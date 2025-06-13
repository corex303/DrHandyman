'use client';

import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { supabase } from '@/lib/supabaseClient';

// Types
interface ChatParticipant {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  otherParticipantsLastActive?: string | null;
}

interface ChatMessage {
  id: string;
  content?: string | null;
  createdAt: string;
  senderId: string;
  sender: ChatParticipant;
  conversationId: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentFilename?: string | null;
  attachmentSize?: number | null;
}

interface ChatConversation {
  id: string;
  participants: ChatParticipant[];
  updatedAt: string;
  displayTitle: string;
  displayImage?: string | null;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string | null;
  otherParticipantsLastActive?: string | null;
}

interface Worker {
  id: string;
  name: string | null;
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => void;
}

export default function ChatPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null } | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAttachmentsShelf, setShowAttachmentsShelf] = useState(false);
  const attachmentsContainerRef = useRef<HTMLDivElement>(null);

  const selectedConversationDetails = conversations.find(c => c.id === selectedConversation?.id);

  const [isStaffGloballyActive, setIsStaffGloballyActive] = useState<boolean>(false);
  const [staffGlobalLastSeen, setStaffGlobalLastSeen] = useState<string | null>(null);

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/maintenance/workers');
      if (!response.ok) {
        throw new Error('Failed to fetch workers');
      }
      const data: Worker[] = await response.json();
      setWorkers(data);
      if (data.length > 0 && !selectedWorker) {
        setSelectedWorker(data[0]);
      }
    } catch (e) {
      console.error(e);
      setError(prev => prev ? `${prev}\nCould not load maintenance workers.` : 'Could not load maintenance workers.');
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        // First, get the current maintenance user's session info
        const sessionRes = await fetch('/api/maintenance/chat/session');
        if (!sessionRes.ok) {
          throw new Error('Failed to authenticate maintenance session.');
        }
        const sessionData = await sessionRes.json();
        setCurrentUser(sessionData);

        // Then, fetch conversations for that user
        await fetchConversations(sessionData.id);

        // Also fetch the list of available worker identities
        await fetchWorkers();

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred during chat initialization.');
        }
        setIsLoadingConversations(false);
      }
    };

    initChat();
    fetchGlobalStaffActivity();
    const intervalId = setInterval(fetchGlobalStaffActivity, 60000);
    return () => clearInterval(intervalId);
  }, []); // Removed fetchConversations from dependency array

  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
      fetch(`/api/portal/chat/conversations/${selectedConversation.id}/active`, {
        method: 'POST',
      }).catch(console.error);
    } else {
      setMessages([]);
      if (selectedConversation !== null) {
        setSelectedConversation(null);
      }
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation?.id && conversations.length > 0) {
      const updatedDetailsInList = conversations.find(c => c.id === selectedConversation.id);
      if (updatedDetailsInList && selectedConversation.otherParticipantsLastActive !== updatedDetailsInList.otherParticipantsLastActive) {
        setSelectedConversation(prev => {
          if (prev && prev.id === updatedDetailsInList.id) {
            return { ...prev, otherParticipantsLastActive: updatedDetailsInList.otherParticipantsLastActive };
          }
          return prev;
        });
      }
    }
  }, [conversations, selectedConversation?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages, typingUsers]);

  const fetchConversations = useCallback(async (userId: string) => {
    if (!userId) return;

    setIsLoadingConversations(true);
    setError(null);
    try {
      // Now we call the portal endpoint, but with the required userId query param
      const response = await fetch(`/api/portal/chat/conversations?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch conversations" }));
        throw new Error(errorData.error);
      }
      let data: ChatConversation[] = await response.json();

      data = data.map(conv => {
        const otherParticipants = conv.participants.filter(p => p.role !== 'MAINTENANCE');
        let displayTitle = otherParticipants.map(p => p.name || p.email).join(', ');
        let displayImage = null;

        if (otherParticipants.length === 1) {
          displayTitle = otherParticipants[0].name || otherParticipants[0].email || 'Chat User';
          displayImage = otherParticipants[0].image;
        } else if (otherParticipants.length === 0 && conv.participants.length === 1) {
          displayTitle = 'My Notes';
          displayImage = conv.participants[0].image;
        } else if (otherParticipants.length > 1) {
          displayTitle = otherParticipants.map(p => p.name || p.email).join(', ');
        }
        return {
          ...conv,
          displayTitle,
          displayImage,
          lastMessagePreview: conv.lastMessagePreview || 'No messages yet'
        };
      });
      setConversations(data.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while fetching conversations.");
      }
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const debouncedSendTypingStarted = useCallback(
    debounce(() => {
      if (selectedConversation && selectedWorker && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing_started',
          payload: { senderId: selectedWorker.id, senderName: selectedWorker.name || 'Someone' },
        });
      }
    }, 500),
    [selectedConversation, selectedWorker]
  );

  const sendTypingStopped = () => {
    if (selectedConversation && selectedWorker && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_stopped',
        payload: { senderId: selectedWorker.id },
      });
    }
  };

  const handleNewMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim().length > 0) {
      debouncedSendTypingStarted();
    } else {
      sendTypingStopped();
    }
  };

  const handleSelectConversation = async (conversation: ChatConversation) => {
    if (selectedConversation?.id === conversation.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    setMessages([]);

    channelRef.current = supabase.channel(`chat:${conversation.id}`, {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    channelRef.current
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        setMessages(prev => {
          if (prev.some(msg => msg.id === payload.id)) {
            return prev;
          }
          return [...prev, payload].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      })
      .on('broadcast', { event: 'typing_started' }, ({ payload }) => {
        if (payload.senderId !== selectedWorker?.id) {
          setTypingUsers(prev => ({ ...prev, [payload.senderId]: payload.senderName }));
          if (typingTimeoutRef.current[payload.senderId]) {
            clearTimeout(typingTimeoutRef.current[payload.senderId]);
          }
          typingTimeoutRef.current[payload.senderId] = setTimeout(() => {
            setTypingUsers(prev => {
              const newTypingUsers = { ...prev };
              delete newTypingUsers[payload.senderId];
              return newTypingUsers;
            });
          }, 3000);
        }
      })
      .on('broadcast', { event: 'typing_stopped' }, ({ payload }) => {
        if (payload.senderId !== selectedWorker?.id) {
          if (typingTimeoutRef.current[payload.senderId]) {
            clearTimeout(typingTimeoutRef.current[payload.senderId]);
          }
          setTypingUsers(prev => {
            const newTypingUsers = { ...prev };
            delete newTypingUsers[payload.senderId];
            return newTypingUsers;
          });
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channelRef.current?.presenceState();
        const updateActivity = async () => {
          if(presenceState) {
            const otherUsers = Object.keys(presenceState)
              .filter(presence_ref => {
                const presences = presenceState[presence_ref] as unknown as { user_id: string }[];
                return presences.every(p => p.user_id !== selectedWorker?.id);
              })
              .map(presence_ref => {
                 const presences = presenceState[presence_ref] as unknown as { last_seen: string }[];
                 return { presence_ref, last_seen: presences[0]?.last_seen };
              });

            if(otherUsers.length > 0) {
              const lastSeenTimes = otherUsers.map(u => u.last_seen).filter(Boolean);
              if (lastSeenTimes.length > 0) {
                const mostRecentLastSeen = new Date(Math.max(...lastSeenTimes.map(t => new Date(t).getTime()))).toISOString();
                setConversations(prev => prev.map(conv => conv.id === conversation.id ? { ...conv, otherParticipantsLastActive: mostRecentLastSeen } : conv));
              }
            }
          }
        };
        updateActivity();
      })
      .subscribe();
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) {
      setError('Please select a conversation first.');
      return;
    }
    if (!selectedWorker) {
      setError('Please select a worker identity to send messages.');
      return;
    }
    if (!newMessage.trim() && !selectedFile) {
      return; // Do nothing if there's no content
    }

    setIsUploading(true);
    setUploadError(null);
    let attachmentData = {};

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('conversationId', selectedConversation.id);

      try {
        const response = await fetch('/api/portal/chat/attachment', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'File upload failed');
        }

        const uploadedAttachment = await response.json();
        attachmentData = {
          attachmentUrl: uploadedAttachment.url,
          attachmentType: uploadedAttachment.contentType,
          attachmentFilename: uploadedAttachment.filename,
          attachmentSize: uploadedAttachment.size,
        };
        handleRemoveSelectedFile();
      } catch (error: any) {
        setUploadError(error.message);
        setIsUploading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          maintenanceSenderId: selectedWorker.id,
          ...attachmentData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setNewMessage('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploading(false);
      sendTypingStopped();
    }
  };

  const openLightbox = (imageSrc: string) => {
    const imageMessages = messages
      .filter(m => m.attachmentUrl && m.attachmentType?.startsWith('image/'))
      .map(m => ({ src: m.attachmentUrl! }));
    const imageIndex = imageMessages.findIndex(img => img.src === imageSrc);
    if (imageIndex !== -1) {
      setLightboxIndex(imageIndex);
      setLightboxOpen(true);
    }
  };

  const formatDateToTime = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  function formatLastActive(isoString?: string | null): string | null {
    if (!isoString) return null;
    const now = new Date();
    const lastActive = new Date(isoString);
    const diffSeconds = Math.round((now.getTime() - lastActive.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 1) return 'Active now';
    if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
    return `Last seen at ${lastActive.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  function isRecentlyActive(isoString?: string | null): boolean {
    if (!isoString) return false;
    const now = new Date();
    const lastActive = new Date(isoString);
    const diffMinutes = Math.round((now.getTime() - lastActive.getTime()) / (1000 * 60));
    return diffMinutes < 5;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGlobalStaffActivity = async () => {
    try {
      const response = await fetch('/api/v1/staff/global-activity');
      const data = await response.json();
      setIsStaffGloballyActive(data.isStaffGloballyActive);
      setStaffGlobalLastSeen(data.lastSeen);
    } catch (error) {
      console.error('Failed to fetch global staff activity:', error);
    }
  };

  const createConversationWithAdmin = async () => {
    // This function needs to be re-evaluated in the new auth context
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/portal/chat/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data: ChatMessage[] = await response.json();
      setMessages(data.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (error) {
      setError('Error fetching messages.');
      console.error(error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setFilePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  if (isLoadingConversations) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full text-sm font-medium lg:text-base">
      {/* Sidebar */}
      <div className="flex h-full w-full max-w-xs flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Conversations</h2>
          <div className="mt-4">
            <label htmlFor="worker-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sending as:
            </label>
            <select
              id="worker-select"
              name="worker"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              value={selectedWorker?.id || ''}
              onChange={(e) => {
                const worker = workers.find(w => w.id === e.target.value);
                setSelectedWorker(worker || null);
              }}
              disabled={workers.length === 0}
            >
              <option value="">-- Select Your Name --</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : conversations.length > 0 ? (
            <ul>
              {conversations.map(conversation => (
                <li key={conversation.id}>
                  <button
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none ${selectedConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="relative mr-4">
                        {conversation.displayImage ? (
                          <img src={conversation.displayImage} alt={conversation.displayTitle} className="h-12 w-12 rounded-full" />
                        ) : (
                          <UsersIcon className="h-12 w-12 rounded-full bg-gray-200 p-2 text-gray-500" />
                        )}
                        {isRecentlyActive(conversation.otherParticipantsLastActive) && (
                           <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-bold">{conversation.displayTitle}</h3>
                          <span className="text-xs text-gray-500">
                            {formatDateToTime(conversation.lastMessageAt || conversation.updatedAt)}
                          </span>
                        </div>
                        <p className={`truncate text-sm ${conversation.lastMessageSenderId && selectedWorker && conversation.lastMessageSenderId === selectedWorker.id ? 'font-semibold text-gray-800 dark:text-gray-200' : 'font-normal text-gray-500 dark:text-gray-400'}`}>
                          {conversation.lastMessageSenderId === selectedWorker?.id && 'You: '}
                          {conversation.lastMessagePreview}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">No conversations found.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            {selectedConversation ? (
              <div>
                 <h3 className="text-lg font-bold">{selectedConversation.displayTitle}</h3>
                 <div className="flex items-center space-x-2">
                   <p className="text-sm text-gray-500 dark:text-gray-400">
                     {formatLastActive(selectedConversation.otherParticipantsLastActive)}
                   </p>
                   {isStaffGloballyActive && (
                     <span className="text-xs text-green-500 flex items-center">
                       <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                       Support Active
                     </span>
                   )}
                 </div>
               </div>
            ) : (
              <div></div>
            )}
            <button
                onClick={() => setShowAttachmentsShelf(prev => !prev)}
                disabled={!selectedConversation}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <PaperClipIcon className="h-6 w-6" />
            </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6" ref={chatContainerRef}>
          {selectedConversation ? (
            isLoadingMessages ? (
              <div className="text-center">Loading messages...</div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={message.id || index} className={`flex ${message.senderId === selectedWorker?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-end gap-2">
                      {message.senderId !== selectedWorker?.id && (
                        <img
                          src={message.sender.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name || 'U')}&background=random`}
                          alt={message.sender.name || 'Sender'}
                          className="mr-3 h-8 w-8 rounded-full"
                        />
                      )}
                      <div className={`max-w-md rounded-2xl px-4 py-2 ${message.senderId === selectedWorker?.id ? 'rounded-br-none bg-blue-500 text-white' : 'rounded-bl-none bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                        {message.senderId !== selectedWorker?.id && (
                          <p className="text-xs font-bold mb-1">{message.sender.name || 'Chat User'}</p>
                        )}
                        {message.attachmentUrl ? (
                          <div className="mt-1">
                            {message.attachmentType?.startsWith('image/') ? (
                              <img src={message.attachmentUrl} alt="attachment" className="max-w-xs max-h-48 rounded-lg cursor-pointer" onClick={() => openLightbox(message.attachmentUrl!)} />
                            ) : (
                              <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">
                                {message.attachmentFilename || 'View Attachment'}
                              </a>
                            )}
                          </div>
                        ) : null}
                        <p className="text-sm">{message.content}</p>
                        <span className="mt-1 block text-right text-xs opacity-70">
                          {formatDateToTime(message.createdAt)}
                        </span>
                      </div>
                      {message.senderId === selectedWorker?.id && (
                         <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedWorker.name || 'W')}&background=random`}
                          alt={selectedWorker.name || 'Worker'}
                          className="ml-3 h-8 w-8 rounded-full"
                        />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Select a Conversation</h3>
              <p className="mt-1 text-gray-500">
                Choose a conversation from the left panel to start chatting.
              </p>
               {!selectedWorker && (
                <p className="mt-4 text-red-500 font-bold">
                  Please select a worker identity from the dropdown to begin.
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Typing indicator */}
        {Object.entries(typingUsers).length > 0 && (
          <div className="px-6 pb-2 text-sm text-gray-500">
            {Object.entries(typingUsers)
              .filter(([id]) => id !== selectedWorker?.id)
              .map(([, name]) => name)
              .join(', ')} 
            {Object.keys(typingUsers).filter(id => id !== selectedWorker?.id).length > 1 ? ' are' : ' is'} typing...
          </div>
        )}

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-4"
          >
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                />
            <input
              type="text"
              value={newMessage}
              onChange={handleNewMessageChange}
              placeholder={selectedWorker ? "Type a message..." : "Select your name to type..."}
              className="flex-1 bg-transparent focus:outline-none"
              disabled={!selectedWorker || isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              disabled={!selectedWorker || isUploading}
            >
              <PaperClipIcon className="h-6 w-6" />
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
              disabled={!selectedWorker || isUploading || (!newMessage.trim() && !selectedFile)}
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </form>
          {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
          {filePreview && (
            <div className="mt-2 relative w-24">
              <img src={filePreview} alt="preview" className="h-24 w-24 object-cover rounded"/>
              <button onClick={handleRemoveSelectedFile} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                <XCircleIcon className="h-5 w-5"/>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Attachments Shelf */}
      {/* Attachments shelf will be rendered here */}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={messages.filter(m => m.attachmentUrl && m.attachmentType?.startsWith('image/')).map(m => ({ src: m.attachmentUrl! }))}
        index={lightboxIndex}
      />
    </div>
  );
}

// Future Improvements:
// 1. Online status indicator for each participant.
// 2. Add error boundaries to catch and handle potential errors gracefully.
// 3. Implement optimistic UI updates for faster perceived performance.
// 4. Skeleton loaders for conversations and messages to improve UX during loading states.
// 5. Enhance accessibility (ARIA attributes, keyboard navigation).

