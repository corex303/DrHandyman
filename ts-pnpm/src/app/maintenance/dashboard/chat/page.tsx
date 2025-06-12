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
import { useSession } from 'next-auth/react';
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
  const { data: session, status: authStatus } = useSession();
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

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchConversations();
      fetchGlobalStaffActivity();
      const intervalId = setInterval(fetchGlobalStaffActivity, 60000);
      return () => clearInterval(intervalId);
    }
  }, [authStatus]);

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

  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) return;
    const currentUserId = session.user.id;

    setIsLoadingConversations(true);
    setError(null);
    try {
      const response = await fetch('/api/portal/chat/conversations');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch conversations" }));
        throw new Error(errorData.error);
      }
      let data: ChatConversation[] = await response.json();

      data = data.map(conv => {
        const otherParticipants = conv.participants.filter(p => p.id !== currentUserId);
        let displayTitle = conv.participants.map(p => p.name || p.email).join(', ');
        let displayImage = null;

        if (otherParticipants.length === 1) {
          displayTitle = otherParticipants[0].name || otherParticipants[0].email || 'Chat User';
          displayImage = otherParticipants[0].image;
        } else if (otherParticipants.length === 0 && conv.participants.length === 1) {
          displayTitle = 'My Notes';
          displayImage = conv.participants[0].image;
        } else if (otherParticipants.length > 1) {
          displayTitle = otherParticipants.map(p => p.name || p.email).join(', ');
          if (conv.participants.some(p => p.id === currentUserId)) {
            displayTitle += ', You';
          }
        }
        return {
          ...conv,
          displayTitle,
          displayImage,
          lastMessagePreview: conv.lastMessagePreview || (conv.lastMessageSenderId === currentUserId ? 'You: ' : '') + (conv.lastMessagePreview || 'No messages yet')
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
  }, [session?.user?.id]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user) {
      fetchConversations();
    }
  }, [authStatus, session, fetchConversations]);

  const debouncedSendTypingStarted = useCallback(
    debounce(() => {
      if (selectedConversation && session?.user?.id && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing_started',
          payload: { senderId: session.user.id, senderName: session.user.name || 'Someone' },
        });
      }
    }, 500),
    [selectedConversation, session]
  );

  const sendTypingStopped = () => {
    if (selectedConversation && session?.user?.id && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_stopped',
        payload: { senderId: session.user.id },
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
        if (payload.senderId !== session?.user?.id) {
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
        if (payload.senderId !== session?.user?.id) {
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
                return presences[0]?.user_id !== session?.user?.id;
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
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File is too large. Maximum size is 5MB.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !session?.user?.id) return;
  
    sendTypingStopped();
  
    let attachmentData = null;
  
    if (selectedFile) {
      setIsUploading(true);
      setUploadError(null);
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
          throw new Error(errorData.error || 'Failed to upload attachment.');
        }
  
        attachmentData = await response.json();
        handleRemoveSelectedFile();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        setUploadError(message);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
  
    // Send message content via API route
    const messageContent = newMessage.trim();
    if (messageContent || attachmentData) {
        try {
            const response = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: messageContent,
                    attachment: attachmentData ? {
                        url: attachmentData.url,
                        type: attachmentData.mimeType,
                        filename: attachmentData.fileName,
                        size: attachmentData.size,
                    } : undefined,
                }),
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to send message.");
            }
            // Message will be added via broadcast, so we just clear the input
            setNewMessage('');
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred while sending the message.";
            setError(message);
            console.error(error);
        }
    }
  };

  const openLightbox = (imageSrc: string) => {
    const imageMessages = messages.filter(m => m.attachmentType?.startsWith('image/'));
    const imageIndex = imageMessages.findIndex(m => m.attachmentUrl === imageSrc);
    if (imageIndex > -1) {
      setLightboxIndex(imageIndex);
      setLightboxOpen(true);
    }
  };

  const formatDateToTime = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
  
  function formatLastActive(isoString?: string | null): string | null {
      if (!isoString) return null;
      const now = new Date();
      const lastActive = new Date(isoString);
      const diffInSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);
      
      if (diffInSeconds < 60) return "Active now";
      if (diffInSeconds < 3600) return `Active ${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `Active ${Math.floor(diffInSeconds / 3600)}h ago`;
      return `Active on ${lastActive.toLocaleDateString()}`;
  }

  function isRecentlyActive(isoString?: string | null): boolean {
    if (!isoString) return false;
    const now = new Date();
    const lastActive = new Date(isoString);
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    return diffInMinutes <= 5;
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGlobalStaffActivity = async () => {
    try {
      const response = await fetch('/api/v1/staff/global-activity');
      if (response.ok) {
        const data = await response.json();
        setIsStaffGloballyActive(data.isActive);
        setStaffGlobalLastSeen(data.lastSeen);
      }
    } catch (error) {
      console.error('Failed to fetch global staff activity:', error);
    }
  };

  const createConversationWithAdmin = async () => {
    setIsCreatingConversation(true);
    setError(null);
    try {
        const response = await fetch('/api/maintenance/chat/from-inquiry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'New Support Request',
                message: 'I need help with something.', 
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not start conversation');
        }
        const newConversation = await response.json();
        await fetchConversations();
        setSelectedConversation(newConversation);
    } catch (error) {
        if (error instanceof Error) {
            setError(error.message);
        } else {
            setError('An unknown error occurred.');
        }
    } finally {
        setIsCreatingConversation(false);
    }
  };
  
  if (authStatus === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading chat...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-8">Please log in to view your messages.</p>
        <Link href="/maintenance/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <aside className="w-1/4 min-w-[300px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Conversations</h2>
          <button onClick={() => fetchConversations()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Refresh conversations">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : conversations.length > 0 ? (
            <ul>
              {conversations.map((conv) => (
                <li key={conv.id} onClick={() => handleSelectConversation(conv)}
                    className={`p-4 cursor-pointer border-l-4 ${selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <div className="flex items-center space-x-3">
                      <div className="relative">
                          {conv.displayImage ? (
                              <img src={conv.displayImage} alt={conv.displayTitle} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <UsersIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                              </div>
                          )}
                          {isRecentlyActive(conv.otherParticipantsLastActive) && (
                              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                              <p className="font-semibold truncate">{conv.displayTitle}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateToTime(conv.lastMessageAt)}</p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.lastMessagePreview}</p>
                      </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
                No conversations yet.
                <button 
                  onClick={createConversationWithAdmin} 
                  disabled={isCreatingConversation}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isCreatingConversation ? 'Starting...' : 'Start a Conversation with Support'}
                </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
              <button 
                onClick={() => setShowAttachmentsShelf(!showAttachmentsShelf)} 
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" 
                title={showAttachmentsShelf ? "Hide Attachments" : "Show Attachments"}
              >
                <PaperClipIcon className="h-6 w-6" />
              </button>
            </header>
            
            <div className="flex-1 flex overflow-hidden">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="text-center">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages in this conversation yet.</div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                      {msg.senderId !== session?.user?.id && (
                        <img src={msg.sender.image || '/images/default-avatar.png'} alt={msg.sender.name || 'User'} className="w-8 h-8 rounded-full self-start"/>
                      )}
                      <div className={`max-w-md rounded-lg px-4 py-2 ${msg.senderId === session?.user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        {msg.senderId !== session?.user?.id && <p className="text-xs font-bold mb-1">{msg.sender.name}</p>}
                        {msg.attachmentUrl && (
                          <div className="mb-2">
                              {msg.attachmentType?.startsWith('image/') ? (
                                  <img 
                                      src={msg.attachmentUrl} 
                                      alt={msg.attachmentFilename || 'attachment'} 
                                      className="max-w-xs max-h-48 rounded-lg cursor-pointer"
                                      onClick={() => openLightbox(msg.attachmentUrl!)}
                                  />
                              ) : (
                                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" 
                                     className="flex items-center space-x-2 p-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                                      <PaperClipIcon className="h-5 w-5" />
                                      <span>{msg.attachmentFilename || 'Download Attachment'}</span>
                                  </a>
                              )}
                          </div>
                        )}
                        {msg.content && <p>{msg.content}</p>}
                        <p className={`text-xs mt-1 ${msg.senderId === session?.user?.id ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formatDateToTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {Object.entries(typingUsers).map(([id, name]) => <p key={id} className="text-sm text-gray-500 italic">{name} is typing...</p>)}
                <div ref={messagesEndRef} />
              </div>
              
              {showAttachmentsShelf && (
                <aside ref={attachmentsContainerRef} className="w-1/3 min-w-[300px] border-l border-gray-200 dark:border-gray-700 flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold">Attachments</h3>
                    <button onClick={() => setShowAttachmentsShelf(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-grow overflow-y-auto p-2">
                      {messages.filter(m => m.attachmentUrl).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {messages.filter(m => m.attachmentUrl).map(m => (
                            <div key={m.id}>
                              {m.attachmentType?.startsWith('image/') ? (
                                <img src={m.attachmentUrl!} alt={m.attachmentFilename || 'attachment'} className="w-full h-auto rounded-lg object-cover cursor-pointer" onClick={() => openLightbox(m.attachmentUrl!)}/>
                              ) : (
                                <a href={m.attachmentUrl!} target="_blank" rel="noopener noreferrer" className="block p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm truncate hover:bg-gray-300">
                                  {m.attachmentFilename || 'File'}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 p-4">No attachments found.</div>
                      )}
                  </div>
                </aside>
              )}

            </div>

            <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {uploadError && (
                  <div className="mb-2 text-red-500 text-sm flex items-center">
                      <XCircleIcon className="h-4 w-4 mr-1"/>
                      {uploadError}
                  </div>
              )}
              {selectedFile && (
                <div className="mb-2 p-2 border border-gray-300 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {filePreview && <img src={filePreview} alt="preview" className="h-10 w-10 object-cover rounded"/>}
                    {!filePreview && <PaperClipIcon className="h-6 w-6"/>}
                    <span className="text-sm">{selectedFile.name}</span>
                  </div>
                  <button onClick={handleRemoveSelectedFile} className="p-1 rounded-full hover:bg-gray-200">
                    <XCircleIcon className="h-5 w-5"/>
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <PaperClipIcon className="h-6 w-6" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleNewMessageChange}
                  onKeyDown={(e) => e.key === 'Enter' && !isUploading && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUploading}
                />
                <button onClick={handleSendMessage} disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400">
                  {isUploading ? 'Uploading...' : <PaperAirplaneIcon className="h-5 w-5"/>}
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
            <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold">Select a conversation</h2>
            <p>Choose one from the left panel to start chatting.</p>
          </div>
        )}
      </main>
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={messages.filter(m => m.attachmentType?.startsWith('image/')).map(m => ({ src: m.attachmentUrl! }))}
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

