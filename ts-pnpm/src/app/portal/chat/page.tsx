'use client';

import { ArrowPathIcon, ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, PlusCircleIcon, UserCircleIcon, UserGroupIcon, UsersIcon, PaperClipIcon, XCircleIcon, PhotoIcon, ChevronRightIcon, ChevronLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { RealtimeChannel } from '@supabase/supabase-js'; // Import Supabase types
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabaseClient'; // Import public Supabase client

// Lightbox imports
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
// Optional: Import plugins if you want to use them (e.g., Zoom, Thumbnails)
// import Zoom from "yet-another-react-lightbox/plugins/zoom";
// import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
// import "yet-another-react-lightbox/plugins/thumbnails.css";

// Types (should ideally be in a separate types file)
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

// Simple debounce function
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

  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // { userId: userName }
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrolling message container
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Attachments Shelf State
  const [showAttachmentsShelf, setShowAttachmentsShelf] = useState(false);
  const attachmentsContainerRef = useRef<HTMLDivElement>(null);

  // DERIVED STATE & EFFECTS (ORDER MATTERS)
  // Ensure selectedConversationDetails is derived *after* conversations state is defined
  const selectedConversationDetails = conversations.find(c => c.id === selectedConversation?.id);

  // Global Staff Activity State
  const [isStaffGloballyActive, setIsStaffGloballyActive] = useState<boolean>(false);
  const [staffGlobalLastSeen, setStaffGlobalLastSeen] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
    fetchGlobalStaffActivity(); // Fetch initial global staff activity

    const intervalId = setInterval(fetchGlobalStaffActivity, 60000); // Fetch every 60 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  // Effect for when the selected conversation ID changes
  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
      // Mark conversation as active by calling the API endpoint
      fetch(`/api/portal/chat/conversations/${selectedConversation.id}/active`, {
        method: 'POST',
      }).catch(console.error);
    } else {
      // Clear messages if no conversation is selected
      setMessages([]);
      // Explicitly set selectedConversation to null if its id is not present,
      // though handleSelectConversation usually manages this.
      if (selectedConversation !== null) { // Avoid unnecessary state update
          setSelectedConversation(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]); // Only re-run when the selected ID changes

  // Effect to synchronize selectedConversation's details (like otherParticipantsLastActive)
  // with the potentially updated version in the main 'conversations' list.
  useEffect(() => {
    if (selectedConversation?.id && conversations.length > 0) {
      const updatedDetailsInList = conversations.find(c => c.id === selectedConversation.id);
      if (updatedDetailsInList && selectedConversation.otherParticipantsLastActive !== updatedDetailsInList.otherParticipantsLastActive) {
        setSelectedConversation(prev => {
          if (prev && prev.id === updatedDetailsInList.id) { // Ensure it's still the same conversation
            return { ...prev, otherParticipantsLastActive: updatedDetailsInList.otherParticipantsLastActive };
          }
          return prev;
        });
      }
    }
  }, [conversations, selectedConversation?.id]); // Re-run if conversations list changes or selected id changes

  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages, typingUsers]); // Scroll when typing users change too

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;
    // Fallback for user ID - user should fix NextAuth types
    const currentUserId = session.user.id || session.user.email;
    if (!currentUserId) {
        setError("User ID not found in session.");
        setIsLoadingConversations(false);
        return;
    }

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
        // Use pre-formatted lastMessagePreview from API if available
        return { 
            ...conv, 
            displayTitle, 
            displayImage,
            lastMessagePreview: conv.lastMessagePreview || (conv.lastMessageSenderId === currentUserId ? 'You: ' : '') + (conv.lastMessagePreview || 'No messages yet')
        };
      });
      setConversations(data.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Could not load conversations.');
    }
    setIsLoadingConversations(false);
  }, [session]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user) {
      fetchConversations();
    }
  }, [authStatus, session, fetchConversations]);

  // Debounced function to send typing started event
  const debouncedSendTypingStarted = useCallback(
    debounce(() => {
      if (selectedConversation && session?.user?.id && supabase.channel(`chat:${selectedConversation.id}`)) {
        supabase.channel(`chat:${selectedConversation.id}`).send({
          type: 'broadcast',
          event: 'typing_started',
          payload: { senderId: session.user.id, senderName: session.user.name || 'Someone' },
        });
      }
    }, 500), // Send after 500ms of inactivity
    [selectedConversation, session]
  );

  const sendTypingStopped = () => {
    if (selectedConversation && session?.user?.id && supabase.channel(`chat:${selectedConversation.id}`)) {
      supabase.channel(`chat:${selectedConversation.id}`).send({
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
      sendTypingStopped(); // Send stopped if input is cleared
    }
  };

  const handleSelectConversation = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    setMessages([]);
    setError(null);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    try {
      const response = await fetch(`/api/portal/chat/conversations/${conversation.id}/messages`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch messages" }));
        throw new Error(errorData.error);
      }
      const data: ChatMessage[] = await response.json();
      setMessages(data);

      // Subscribe to Supabase channel for this conversation
      const channel = supabase.channel(`chat:${conversation.id}`);
      channel
        .on('broadcast', { event: 'new_message' }, (payload) => {
          const newMessagePayload = payload.payload as ChatMessage;
          setMessages((prevMessages) => {
            if (!prevMessages.find(msg => msg.id === newMessagePayload.id)) {
              return [...prevMessages, newMessagePayload];
            }
            return prevMessages;
          });
          fetchConversations();
        })
        .on('broadcast', { event: 'activity_update' }, ({ payload }) => {
          // console.log('Received activity_update:', payload);
          const { conversationId: updatedConvId, userId: updatedUserId, lastAccessedAt: updatedLastActive } = payload as { conversationId: string, userId: string, lastAccessedAt: string };
          
          // Update if it's the currently selected conversation and not the current user's activity
          if (selectedConversation?.id === updatedConvId && updatedUserId !== session?.user?.id) {
            setSelectedConversation(prev => {
              if (prev && prev.id === updatedConvId) {
                // console.log(`Updating selectedConversation ${prev.id} otherParticipantsLastActive to ${updatedLastActive} for user ${updatedUserId}`);
                return { ...prev, otherParticipantsLastActive: updatedLastActive };
              }
              return prev;
            });
          }
          // Also update the main conversations list
          setConversations(prevConvs => 
            prevConvs.map(conv => {
              if (conv.id === updatedConvId) {
                // Check if this activity update is for one of the *other* participants in this conversation view
                const isOtherParticipantActivity = conv.participants.some(p => p.id === updatedUserId && p.id !== session?.user?.id);
                if (isOtherParticipantActivity) {
                    // Only update if this new activity is more recent than what we have for *any* other participant
                    // This logic might need refinement if multiple other participants send updates close together
                    // For now, we assume the latest received activity for an other user is the one to display
                    // console.log(`Updating conv ${conv.id} otherParticipantsLastActive to ${updatedLastActive} for user ${updatedUserId}`);
                    return { ...conv, otherParticipantsLastActive: updatedLastActive };
                }
              }
              return conv;
            })
          );
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${channel.topic}`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Supabase channel error on ${channel.topic}:`, err);
            setError('Realtime connection error. Please refresh.');
          }
        });
      channelRef.current = channel;

    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Could not load messages.');
    }
    setIsLoadingMessages(false);

    // Fetch messages for the selected conversation
    if (selectedConversation?.id && session?.user?.id) {
      fetchMessages(selectedConversation.id);

      // Update activity status when conversation is selected
      const updateActivity = async () => {
        try {
          await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/active`, {
            method: 'POST',
          });
          // console.log('User activity updated for conversation:', selectedConversation.id);
        } catch (error) {
          console.error('Failed to update user activity:', error);
        }
      };
      updateActivity(); // Call immediately
      // Optionally, set up an interval to call updateActivity periodically if the chat is focused

      // Supabase real-time subscription
      if (supabase) {
        // ... existing code ...
      }
    }
  };
  
  // Cleanup Supabase channel subscription on component unmount or when selectedConversation changes
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log(`Unsubscribed from ${channelRef.current.topic}`);
        channelRef.current = null;
      }
    };
  }, []); // Empty dependency array for unmount cleanup

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadError("File exceeds 10MB limit.");
        setSelectedFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ''; // Clear input
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
        setFilePreview(null); // No preview for non-images, or show generic icon
      }
    } else {
      setSelectedFile(null);
      setFilePreview(null);
      setUploadError(null);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the actual file input
    }
  };

  const handleSendMessage = async () => {
    const senderId = session?.user?.id || session?.user?.email; // Fallback for user ID
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !senderId) {
      setError('Cannot send message: missing data or user session.');
      return;
    }
    setError(null);
    setUploadError(null);

    let attachmentDetails = {};

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const uploadResponse = await fetch('/api/portal/chat/attachment', {
          method: 'POST',
          body: formData,
          // Do not set Content-Type header, browser will do it with boundary
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({error: "Failed to upload file"}));
          throw new Error(errorData.error || 'Server error during file upload');
        }
        const uploadedFileData = await uploadResponse.json();
        attachmentDetails = {
          attachmentUrl: uploadedFileData.url,
          attachmentType: uploadedFileData.type,
          attachmentFilename: uploadedFileData.name,
          attachmentSize: uploadedFileData.size,
        };
        handleRemoveSelectedFile(); // Clear file after successful upload prep
      } catch (err: any) {
        console.error('Error uploading file:', err);
        setUploadError(err.message || 'Could not upload file.');
        setIsUploading(false);
        return; // Stop message sending if upload fails
      }
      setIsUploading(false);
    }

    const messageToSend = newMessage;
    setNewMessage(''); // Clear input after capturing

    try {
      const response = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: messageToSend.trim() || null, // Send null if only attachment
          ...attachmentDetails 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Server error sending message');
      }
      // Message is added via Supabase broadcast
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Could not send message.');
      setNewMessage(messageToSend); // Restore message to input if sending failed
      // Potentially clear attachmentDetails if that part was successful but message send failed
    }
  };
  
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return;
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/portal/chat/conversations/${conversationId}/messages`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      const data: ChatMessage[] = await response.json();
      setMessages(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (error: any) {
      console.error("Error fetching messages:", error.message);
      setMessages([]); // Clear messages on error
    } finally {
      setIsLoadingMessages(false);
    }
  }, [session]); // Added session to dependency array

  // Prepare slides for the lightbox
  const imageSlides = messages
    .filter(msg => msg.attachmentUrl && msg.attachmentType?.startsWith('image/'))
    .map(msg => ({ src: msg.attachmentUrl as string, alt: msg.attachmentFilename || 'Chat Image' }));

  const openLightbox = (imageSrc: string) => {
    const imageIndex = imageSlides.findIndex(slide => slide.src === imageSrc);
    if (imageIndex !== -1) {
      setLightboxIndex(imageIndex);
      setLightboxOpen(true);
    }
  };

  // Filter all attachments for the shelf
  const allAttachments = messages
    .filter(msg => msg.attachmentUrl)
    .map(msg => ({
      id: msg.id,
      url: msg.attachmentUrl as string,
      type: msg.attachmentType,
      name: msg.attachmentFilename || (msg.attachmentType?.startsWith('image/') ? 'Image Attachment' : 'File Attachment'),
      size: msg.attachmentSize,
      senderName: msg.sender?.name || msg.sender?.email || 'Unknown User',
      timestamp: msg.createdAt,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort newest first

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ArrowPathIcon className="h-8 w-8 text-slate-400 animate-spin mr-3" />
        <p className="text-lg text-slate-300">Loading chat...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-lg text-slate-300 mb-4">Please sign in to access chat.</p>
        <Link href="/auth/signin" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          Sign In
        </Link>
      </div>
    );
  }

  const typingDisplayNames = Object.values(typingUsers).filter(name => name).join(', ');

  // Helper function for safe date formatting
  const formatDateToTime = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return ' '; // Return empty or placeholder if no date
    try {
      const date = new Date(dateInput);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date'; 
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formatting date:", dateInput, e);
      return 'Invalid Date';
    }
  };

  function formatLastActive(isoString?: string | null): string | null {
    if (!isoString) return null; // If no timestamp, return null
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMinutes < 5) return 'Active now';
    if (diffMinutes < 10) return `Active ${diffMinutes}m ago`;
    if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return `Last seen yesterday`;
    return `Last seen ${diffDays}d ago`;
  }

  function isRecentlyActive(isoString?: string | null): boolean {
    if (!isoString) return false;
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return diffMinutes < 5;
  }

  const scrollToBottom = () => {
    // Use chatContainerRef for scrolling, messagesEndRef is just a target div at the end
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Function to fetch global staff activity
  const fetchGlobalStaffActivity = async () => {
    try {
      const response = await fetch('/api/v1/staff/global-activity');
      if (response.ok) {
        const data = await response.json();
        setIsStaffGloballyActive(data.isActive);
        setStaffGlobalLastSeen(data.lastSeen);
      } else {
        console.error('Failed to fetch global staff activity');
        setIsStaffGloballyActive(false);
        setStaffGlobalLastSeen(null);
      }
    } catch (error) {
      console.error('Error fetching global staff activity:', error);
      setIsStaffGloballyActive(false);
      setStaffGlobalLastSeen(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-900 text-slate-100">
      {/* Sidebar for Conversations List */}
      <aside className="w-1/3 min-w-[300px] max-w-[400px] bg-slate-800/70 border-r border-slate-700 flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-100">Messages</h2>
        </header>
        <div className="overflow-y-auto flex-grow">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-slate-400">Loading conversations...</div>
          ) : conversations.length === 0 && !isCreatingConversation ? (
            <div className="p-4 text-center text-slate-400">No conversations yet.</div>
          ) : (
            <ul>
              {conversations.map((conv) => (
                <li key={conv.id} 
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 cursor-pointer hover:bg-slate-700/50 border-b border-slate-700/50 
                              ${selectedConversation?.id === conv.id ? 'bg-slate-700' : 'bg-transparent'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {conv.displayImage ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={conv.displayImage} alt={conv.displayTitle || 'Conversation'} />
                      ) : (
                        <UsersIcon className="h-10 w-10 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{conv.displayTitle || 'Chat'}</p>
                      {conv.lastMessagePreview && (
                        <p className="text-xs text-slate-400 truncate">
                          {conv.lastMessagePreview}
                        </p>
                      )}
                      {/* Participant Activity Status Display in Conversation List */}
                      <div className="flex items-center mt-1">
                        {isStaffGloballyActive ? (
                          <>
                            <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5 flex-shrink-0"></span>
                            <p className="text-xs text-green-400">Staff currently active</p>
                          </>
                        ) : conv.otherParticipantsLastActive ? (
                          <>
                            {isRecentlyActive(conv.otherParticipantsLastActive) && (
                              <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5 flex-shrink-0"></span>
                            )}
                            <p className={`text-xs ${isRecentlyActive(conv.otherParticipantsLastActive) ? 'text-green-400' : 'text-slate-500'}`}>
                              {formatLastActive(conv.otherParticipantsLastActive) || 'Awaiting staff interaction'}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">Awaiting staff interaction</p>
                        )}
                      </div>
                    </div>
                    {conv.lastMessageAt && (
                       <p className="text-xs text-slate-500 self-start pt-1 whitespace-nowrap">
                        {formatDateToTime(conv.lastMessageAt)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && !isLoadingConversations && <div className="p-4 text-red-400">Error: {error}</div>}
        </div>
      </aside>

      {/* Main Chat Area - adjusted to make space for shelf */}
      <main className={`flex-1 flex flex-col bg-slate-850 ${showAttachmentsShelf ? 'w-2/3' : 'w-full'} transition-all duration-300 ease-in-out`}>
        {selectedConversation ? (
          <>
            <header className="p-4 border-b border-slate-700 flex items-center justify-between space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {selectedConversation.displayImage ? (
                  <img className="h-10 w-10 rounded-full object-cover" src={selectedConversation.displayImage} alt={selectedConversation.displayTitle || 'Conversation'} />
                ) : (
                  <UsersIcon className="h-10 w-10 text-slate-500" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-slate-100 truncate max-w-xs" title={selectedConversation.displayTitle || 'Chat'}>{selectedConversation.displayTitle || 'Chat'}</h2>
                  {/* Global Staff Activity and Default Message Area - to the right of title */}
                  <div className="text-xs mt-0.5">
                    {isStaffGloballyActive ? (
                      <div className="flex items-center text-green-400">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                        Staff currently active
                      </div>
                    ) : selectedConversation.otherParticipantsLastActive && formatLastActive(selectedConversation.otherParticipantsLastActive) ? (
                      <div className="flex items-center">
                        {isRecentlyActive(selectedConversation.otherParticipantsLastActive) && (
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                        )}
                        <p className={`${isRecentlyActive(selectedConversation.otherParticipantsLastActive) ? 'text-green-400' : 'text-slate-400'}`}>
                          {formatLastActive(selectedConversation.otherParticipantsLastActive)}
                        </p>
                      </div>
                    ) : staffGlobalLastSeen && formatLastActive(staffGlobalLastSeen) ? (
                      <p className="text-slate-400">
                        Staff last seen: {formatLastActive(staffGlobalLastSeen)}
                      </p>
                    ) : (
                      <p className="text-slate-400">
                        Dr. Handyman has received your inquiry and will respond ASAP.
                      </p>
                    )}
                  </div>
                  {/* Typing indicator - keep this below activity status */}
                  {typingDisplayNames && (
                    <p className="text-xs text-primary-400 animate-pulse mt-0.5">
                      {typingDisplayNames} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAttachmentsShelf(!showAttachmentsShelf)}
                className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-850"
                title={showAttachmentsShelf ? "Hide Attachments" : "Show Attachments"}
              >
                {showAttachmentsShelf ? <ChevronRightIcon className="h-5 w-5" /> : <PhotoIcon className="h-5 w-5" />}
              </button>
            </header>
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-900/80">
              {isLoadingMessages ? (
                <div className="text-center text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400">No messages yet. Send one to start!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === (session?.user?.id || session?.user?.email) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg shadow 
                                     ${msg.senderId === (session?.user?.id || session?.user?.email) ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>
                      {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                      {/* Attachment Rendering */} 
                      {msg.attachmentUrl && (
                        <div className={`mt-2 ${!msg.content ? 'pt-0' : 'pt-2'}`}>
                          {msg.attachmentType?.startsWith('image/') ? (
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentFilename || 'Attached Image'}
                              className="max-w-xs max-h-64 rounded-md object-contain cursor-pointer"
                              onClick={() => openLightbox(msg.attachmentUrl as string)}
                            />
                          ) : (
                            <a 
                              href={msg.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              download={msg.attachmentFilename || 'download'}
                              className="flex items-center space-x-2 p-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-md text-slate-200 hover:text-white transition-colors"
                              title={`Download ${msg.attachmentFilename || 'file'}`}
                            >
                              <PaperClipIcon className="h-5 w-5 flex-shrink-0" />
                              <span className="text-sm truncate">{msg.attachmentFilename || 'Attached File'}</span>
                              {msg.attachmentSize && <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">({(msg.attachmentSize / 1024).toFixed(1)} KB)</span>}
                            </a>
                          )}
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${msg.senderId === (session?.user?.id || session?.user?.email) ? 'text-primary-200' : 'text-slate-400'} text-right`}>
                        {formatDateToTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} /> {/* For auto-scrolling */}
              {error && !isLoadingMessages && <div className="p-4 text-red-400">Error: {error}</div>}
            </div>
            <footer className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800">
              {/* File preview and remove button */} 
              {selectedFile && (
                <div className="mb-2 p-2 bg-slate-700 rounded-md flex items-center justify-between">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    {filePreview && selectedFile.type.startsWith('image/') ? (
                      <img src={filePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <PaperClipIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
                    )}
                    <div className="text-sm text-slate-300 truncate">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemoveSelectedFile} 
                    className="p-1 text-slate-400 hover:text-red-400 rounded-full hover:bg-slate-600"
                    title="Remove file"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              {uploadError && <p className="text-xs text-red-400 mb-2">Upload Error: {uploadError}</p>}

              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-3 items-center">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" // Hidden, triggered by button
                  accept="image/jpeg,image/png,image/gif,application/pdf,text/plain"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50"
                  title="Attach file"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <input 
                  type="text"
                  value={newMessage}
                  onChange={handleNewMessageChange}
                  placeholder="Type a message..."
                  className="flex-1 p-2 rounded-md bg-slate-700 text-slate-100 border border-slate-600 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-400"
                  disabled={!selectedConversation || isLoadingMessages || isUploading}
                />
                <button 
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || !selectedConversation || isLoadingMessages || isUploading}
                  className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50"
                  title="Send Message"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-850">
            <ChatBubbleLeftRightIcon className="h-24 w-24 text-slate-600" />
            <p className="mt-4 text-lg text-slate-500">Select a conversation to start chatting.</p>
            {/* Default message also shown here if no staff activity known */}
            {/* Display based on global staff activity when no conversation is selected */}
            <div className="mt-2 text-sm text-slate-500">
                {isStaffGloballyActive ? (
                    <span className="flex items-center"><span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>Staff active</span>
                ) : staffGlobalLastSeen ? (
                    <span>Staff last seen: {formatLastActive(staffGlobalLastSeen)}</span>
                ) : (
                    <span>Dr. Handyman has received your inquiry and will respond ASAP.</span>
                )}
            </div>
          </div>
        )}
      </main>

      {/* Attachments Shelf */}
      {showAttachmentsShelf && selectedConversation && (
        <aside className="w-1/3 min-w-[300px] max-w-[450px] bg-slate-800 border-l border-slate-700 flex flex-col transition-all duration-300 ease-in-out">
          <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-100">Conversation Attachments</h3>
            <button 
              onClick={() => setShowAttachmentsShelf(false)}
              className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700"
              title="Close Attachments Shelf"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </header>
          <div className="overflow-y-auto flex-grow p-3 space-y-3">
            {allAttachments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No attachments in this conversation.</p>
            ) : (
              allAttachments.map(att => (
                <div key={att.id} className="p-2 bg-slate-700/50 rounded-md flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {att.type?.startsWith('image/') ? (
                      <PhotoIcon className="h-6 w-6 text-primary-400" />
                    ) : (
                      <PaperClipIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {att.type?.startsWith('image/') ? (
                      <img 
                        src={att.url}
                        alt={att.name}
                        className="max-w-full h-auto max-h-40 rounded cursor-pointer mb-1 object-contain"
                        onClick={() => openLightbox(att.url)}
                      />
                    ) : null}
                    <a 
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.name}
                      className="text-sm font-medium text-slate-100 hover:text-primary-300 hover:underline truncate block"
                      title={`Download ${att.name}`}
                    >
                      {att.name}
                    </a>
                    <p className="text-xs text-slate-400">
                      Sent by {att.senderName} on {new Date(att.timestamp).toLocaleDateString()} at {formatDateToTime(att.timestamp)}
                    </p>
                    {att.size && <p className="text-xs text-slate-500">({(att.size / 1024).toFixed(1)} KB)</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Lightbox Component */}
      {lightboxOpen && imageSlides.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={imageSlides}
          index={lightboxIndex}
          // Optional: Add plugins here
          // plugins={[Zoom, Thumbnails]}
        />
      )}
    </div>
  );
}

// TODO:
// 1. Implement Supabase real-time subscription for new messages in the selected conversation.
//    - On new message from Supabase, add it to `messages` state.
//    - Ensure to handle potential duplicates if optimistic update + Supabase push the same message.
// 2. Implement New Conversation Modal (`handleOpenNewConversationModal`):
//    - UI to search/select users (staff) to chat with.
//    - Input for an initial message (optional).
//    - API call to POST /api/portal/chat/conversations.
//    - On success, add new conversation to `conversations` state and select it.
// 3. Unread message indicators in conversation list.
// 4. More robust error handling and user feedback.
// 5. Refine styling and responsiveness.
// 6. Consider pagination for both conversation list and message list if they can grow very large.
// 7. Notification system for new messages when chat is not active (more advanced). 