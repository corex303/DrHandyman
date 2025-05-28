'use client';

import { ArrowPathIcon,ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, PlusCircleIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { RealtimeChannel } from '@supabase/supabase-js'; // Import Supabase types
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabaseClient'; // Import public Supabase client

// Types (should ideally be in a separate types file)
interface ChatParticipant {
  id: string;
  name?: string | null;
  image?: string | null;
  role?: string; // Consider using a specific Role enum if defined
}

interface ChatMessage {
  id: string;
  createdAt: string; // Or Date
  content: string;
  senderId: string;
  sender: ChatParticipant;
  conversationId: string;
  attachmentUrl?: string | null; // Added for future use
  attachmentType?: string | null; // Added for future use
}

interface ChatConversation {
  id: string;
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  participants: ChatParticipant[];
  messages: ChatMessage[]; // Will usually be just the last message from API list
  title?: string;
  image?: string | null;
  lastMessage?: ChatMessage | null;
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

export default function AdminChatPage() {
  const { data: session, status: authStatus } = useSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [potentialParticipants, setPotentialParticipants] = useState<ChatParticipant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetchingParticipants, setIsFetchingParticipants] = useState(false);

  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // { userId: userName }
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrolling message container

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

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]); // Scroll when typing users change too

  // Fetch conversations
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const fetchConversations = async () => {
        setIsLoadingConversations(true);
        setError(null);
        try {
          // ADMIN/STAFF NOTE: API endpoint might need to be different or handle roles
          const res = await fetch('/api/portal/chat/conversations'); // Using portal for now, might need /api/admin/chat/...
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Failed to fetch conversations' }));
            throw new Error(errorData.message || 'Failed to fetch conversations');
          }
          const data = await res.json();
          setConversations(data);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        }
        setIsLoadingConversations(false);
      };
      fetchConversations();
    }
  }, [authStatus]);

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
    }, 500),
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

  const handleNewMessageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { // Modified for textarea
    setNewMessage(e.target.value);
    if (e.target.value.trim().length > 0) {
      debouncedSendTypingStarted();
    } else {
      sendTypingStopped();
    }
  };

  // Fetch messages and subscribe to realtime updates (MODIFIED for typing events)
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const fetchMessagesAndSubscribe = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }
      
      if (!selectedConversation.id) {
        console.error('fetchMessagesAndSubscribe: Attempted to fetch messages but selectedConversation.id is missing!', selectedConversation);
        setError('Cannot fetch messages: Selected conversation has no ID.');
        setIsLoadingMessages(false);
        return;
      }

      console.log('fetchMessagesAndSubscribe: selectedConversation object:', JSON.stringify(selectedConversation, null, 2));
      
      setIsLoadingMessages(true);
      setError(null);
      setTypingUsers({}); // Clear typing users
      try {
        // ADMIN/STAFF NOTE: API endpoint might need to be different or handle roles
        const res = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to fetch messages' }));
          throw new Error(errorData.message || 'Failed to fetch messages');
        }
        const data = await res.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setIsLoadingMessages(false);
      }

      const channelName = `chat:${selectedConversation.id}`;
      channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true },
        },
      });

      channel
        .on('broadcast', { event: 'new_message' }, (payload: any) => {
          console.log('New message broadcast received:', payload.payload);
          const newMessagePayload = payload.payload as ChatMessage;
          setMessages((prevMessages) => {
            console.log(`Broadcast: Received message with ID ${newMessagePayload.id}. Current message IDs:`, prevMessages.map(m => m.id));
            if (prevMessages.find(msg => msg.id === newMessagePayload.id)) {
              console.log(`Broadcast: Message with ID ${newMessagePayload.id} already exists. Not adding.`);
              return prevMessages; 
            }
            console.log(`Broadcast: Message with ID ${newMessagePayload.id} is new. Adding.`);
            const updated = [...prevMessages, newMessagePayload];
            console.log('Messages after adding broadcast message:', updated.map(m => m.id));
            return updated;
          });
        })
        .on('broadcast', { event: 'typing_started' }, (payload: any) => {
          const { senderId, senderName } = payload.payload;
          if (senderId !== session?.user?.id) {
            setTypingUsers(prev => ({ ...prev, [senderId]: senderName }));
            if (typingTimeoutRef.current[senderId]) {
              clearTimeout(typingTimeoutRef.current[senderId]);
            }
            typingTimeoutRef.current[senderId] = setTimeout(() => {
              setTypingUsers(prev => {
                const { [senderId]: _, ...rest } = prev;
                return rest;
              });
            }, 3000); 
          }
        })
        .on('broadcast', { event: 'typing_stopped' }, (payload: any) => {
          const { senderId } = payload.payload;
          if (senderId !== session?.user?.id) {
            if (typingTimeoutRef.current[senderId]) {
              clearTimeout(typingTimeoutRef.current[senderId]);
            }
            setTypingUsers(prev => {
              const { [senderId]: _, ...rest } = prev;
              return rest;
            });
          }
        })
        .subscribe((status: any, err?: any) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to broadcast channel ${channelName}`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`Supabase broadcast subscription error for ${channelName}:`, status, err);
            setError(`Chat connection issue: ${status}. Try refreshing.`);
          }
        });
    };

    if (selectedConversation) {
      fetchMessagesAndSubscribe();
    }

    return () => {
      if (channel && selectedConversation) {
        console.log(`Unsubscribing from broadcast channel chat:${selectedConversation.id}`);
        Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        typingTimeoutRef.current = {};
        supabase.removeChannel(channel).catch((err: any) => console.error('Error removing channel:', err));
      }
    };
  }, [selectedConversation, session?.user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); 

  const handleSelectConversation = (conversation: ChatConversation) => {
    if (selectedConversation?.id === conversation.id && messages.length > 0) return; 
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || authStatus !== 'authenticated' || !session?.user?.id) return;

    sendTypingStopped(); // Send typing stopped

    const tempMessageId = `optimistic-${Date.now().toString()}`;
    const senderId = session.user.id;

    const optimisticMessage: ChatMessage = {
      id: tempMessageId,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      senderId: senderId,
      sender: {
        id: senderId,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role as string | undefined,
      },
      conversationId: selectedConversation.id
    };
    
    console.log(`Optimistic message added: ${tempMessageId}`, optimisticMessage);
    setMessages(prev => {
      console.log('HANDLE_SEND_MESSAGE: Previous messages before adding optimistic:', prev.map(m => m.id));
      const updated = [...prev, optimisticMessage];
      console.log('HANDLE_SEND_MESSAGE: Messages after adding optimistic:', updated.map(m => m.id));
      return updated;
    });
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      // ADMIN/STAFF NOTE: API endpoint might need to be different or handle roles
      const res = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend.trim() }),
      });

      if (!res.ok) {
        console.log(`HANDLE_SEND_MESSAGE: Send API failed. Rolling back optimistic message: ${tempMessageId}`);
        setMessages(prev => {
          console.log('HANDLE_SEND_MESSAGE: Previous messages before rollback:', prev.map(m => m.id));
          const updated = prev.filter(msg => msg.id !== tempMessageId);
          console.log('HANDLE_SEND_MESSAGE: Messages after rollback:', updated.map(m => m.id));
          return updated;
        });
        const errorData = await res.json().catch(() => ({ message: 'Failed to send message' }));
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      const confirmedMessage = await res.json() as ChatMessage;
      console.log(`HANDLE_SEND_MESSAGE: Send API success. Confirmed message (DB ID ${confirmedMessage.id}) replacing optimistic ${tempMessageId}:`, confirmedMessage);

      setMessages(prev => {
        console.log('HANDLE_SEND_MESSAGE: Previous messages before replacing optimistic with confirmed:', prev.map(m => m.id));
        const alreadyExistsViaBroadcast = prev.find(msg => msg.id === confirmedMessage.id);
        if (alreadyExistsViaBroadcast) {
          console.log(`HANDLE_SEND_MESSAGE: Confirmed message ID ${confirmedMessage.id} already added by broadcast. Removing optimistic ${tempMessageId}.`);
          return prev.filter(msg => msg.id !== tempMessageId);
        } else {
          console.log(`HANDLE_SEND_MESSAGE: Confirmed message ID ${confirmedMessage.id} not yet added by broadcast. Replacing optimistic ${tempMessageId}.`);
          return prev.map(msg => 
            msg.id === tempMessageId ? { ...confirmedMessage, sender: optimisticMessage.sender } : msg
          );
        }
      });
      
      setConversations(prevConvs => prevConvs.map(conv => 
        conv.id === selectedConversation.id 
        ? { 
            ...conv, 
            lastMessage: { 
              id: confirmedMessage.id,
              content: confirmedMessage.content,
              createdAt: confirmedMessage.createdAt,
              senderId: confirmedMessage.senderId,
              sender: optimisticMessage.sender, 
              conversationId: confirmedMessage.conversationId,
            },
            updatedAt: confirmedMessage.createdAt 
          }
        : conv
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    } catch (err: any) {
      setError(err.message);
      console.error(err);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId && msg.id !== (err.confirmedMessageId || ' '))); 
      setNewMessage(messageToSend); 
    }
  };
  
  // ADMIN/STAFF: Modified to allow selecting participants
  const handleInitiateNewConversation = async () => {
    if (authStatus !== 'authenticated' || selectedParticipants.size === 0) {
      setError("Please select at least one participant.");
      return;
    }
    setIsCreatingConversation(true);
    setError(null);
    try {
      const participantIds = Array.from(selectedParticipants);
      // ADMIN/STAFF NOTE: API endpoint might need to be different or handle roles
      const res = await fetch('/api/portal/chat/conversations', { // Using portal for now
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds, initialMessage: newMessage || undefined }), 
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to start new chat' }));
        throw new Error(errorData.message || 'Failed to start new chat');
      }
      const newConvData = await res.json() as ChatConversation;
      setConversations(prev => [newConvData, ...prev.filter(c => c.id !== newConvData.id)].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setSelectedConversation(newConvData);
      setShowNewConversationModal(false);
      setSelectedParticipants(new Set());
      setSearchTerm('');
      setNewMessage(''); // Clear message input after using it for initial message
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating new conversation:', err);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // ADMIN/STAFF: Fetch potential participants (customers and other staff)
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!showNewConversationModal || authStatus !== 'authenticated') return;
      setIsFetchingParticipants(true);
      setError(null); // Clear previous errors
      try {
        const response = await fetch('/api/admin/chat/participants'); 
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch participants' }));
          throw new Error(errorData.message || 'Failed to fetch participants');
        }
        const data = await response.json();
        setPotentialParticipants(data);
      } catch (error: any) {
        console.error("Error fetching participants:", error);
        setError("Failed to load users for new chat. " + error.message);
      }
      setIsFetchingParticipants(false);
    };
    fetchParticipants();
  }, [showNewConversationModal, authStatus]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  const filteredParticipants = potentialParticipants.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(p => p.id !== session?.user?.id); // Exclude self

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
        {/* ADMIN/STAFF NOTE: Link should point to admin signin */}
        <Link href="/admin/login" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          Sign In
        </Link>
      </div>
    );
  }

  const typingDisplayNames = Object.values(typingUsers).filter(name => name).join(', ');

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-900 text-slate-100">
      {/* Sidebar for Conversations List */}
      <aside className="w-1/3 min-w-[300px] max-w-[400px] bg-slate-800/70 border-r border-slate-700 flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-100">Messages</h2>
          {/* ADMIN/STAFF: Button to open new conversation modal */}
          <button 
            onClick={() => setShowNewConversationModal(true)}
            className="p-2 rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            title="New Chat"
          >
            <PlusCircleIcon className="h-6 w-6 text-slate-300" />
          </button>
        </header>
        <div className="overflow-y-auto flex-grow">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-slate-400">Loading conversations...</div>
          ) : conversations.length === 0 ? (
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
                      {conv.image ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={conv.image} alt={conv.title || 'Conversation'} />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{conv.title || 'Chat'}</p>
                      {conv.lastMessage && (
                        <p className="text-xs text-slate-400 truncate">
                          {conv.lastMessage.senderId === session?.user?.id ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conv.lastMessage && (
                       <p className="text-xs text-slate-500 self-start pt-1 whitespace-nowrap">
                        {formatDateToTime(conv.lastMessage.createdAt)}
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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-850">
        {selectedConversation ? (
          <>
            <header className="p-4 border-b border-slate-700 flex items-center space-x-3 flex-shrink-0">
              {selectedConversation.image ? (
                <img className="h-10 w-10 rounded-full object-cover" src={selectedConversation.image} alt={selectedConversation.title || 'Conversation'} />
              ) : (
                <UserGroupIcon className="h-10 w-10 text-slate-500" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selectedConversation.title || 'Chat'}</h2>
                {/* Display Typing Users */}
                {typingDisplayNames && (
                  <p className="text-xs text-primary-400 animate-pulse">
                    {typingDisplayNames} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                  </p>
                )}
              </div>
            </header>
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-900/80">
              {isLoadingMessages ? (
                <div className="text-center text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400">No messages yet. Send one to start!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg shadow 
                                     ${msg.senderId === session?.user?.id 
                                        ? 'bg-primary-600 text-white rounded-br-none' 
                                        : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === session?.user?.id ? 'text-primary-200' : 'text-slate-400'} text-right`}>
                        {formatDateToTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              {error && !isLoadingMessages && <div className="p-4 text-red-400">Error: {error}</div>}
            </div>
            <footer className="p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={handleNewMessageChange} // Use the new handler for input as well
                  placeholder="Type a message..."
                  className="flex-1 p-2 rounded-md bg-slate-700 text-slate-100 border border-slate-600 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-400"
                  disabled={!selectedConversation || isLoadingMessages}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || !selectedConversation || isLoadingMessages || isCreatingConversation}
                  className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50"
                  title="Send Message"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <ChatBubbleLeftEllipsisIcon className="h-16 w-16 mb-4" />
            <p className="text-lg">Select a conversation or start a new one.</p>
          </div>
        )}
      </main>

      {/* New Conversation Modal for Admin/Staff */}
      {showNewConversationModal && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Start New Chat</h3>
            <input 
              type="text"
              placeholder="Search users (name, role, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 mb-3 rounded-md bg-slate-700 text-slate-100 border border-slate-600 placeholder-slate-400"
            />
            <div className="overflow-y-auto mb-4 flex-grow min-h-[150px] border border-slate-700 rounded-md p-2">
              {isFetchingParticipants ? <p className="text-slate-400">Loading users...</p> :
                error && potentialParticipants.length === 0 ? <p className="text-red-400">Error: {error}</p> : // Display error if fetching failed and no participants
                filteredParticipants.length === 0 ? <p className="text-slate-400">No users found matching your search.</p> :
                filteredParticipants.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-md">
                    <div className="flex items-center space-x-2">
                        {user.image ? <img src={user.image} alt={user.name || 'User'} className="w-8 h-8 rounded-full" /> : <UserCircleIcon className="w-8 h-8 text-slate-500"/>}
                        <div>
                            <p className="text-sm text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.role} - {user.id.substring(0,8)}...</p>
                        </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={selectedParticipants.has(user.id)}
                      onChange={() => toggleParticipant(user.id)}
                      className="form-checkbox h-5 w-5 text-primary-500 bg-slate-600 border-slate-500 rounded focus:ring-primary-400"
                    />
                  </div>
              ))}
            </div>
            <textarea 
              value={newMessage} // This newMessage is for the initial message of a new chat
              onChange={handleNewMessageChange} // Use the same handler, it sets the main newMessage state
              placeholder="Optional: Type an initial message..."
              rows={3}
              className="w-full p-2 mb-4 rounded-md bg-slate-700 text-slate-100 border border-slate-600 placeholder-slate-400"
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => {
                setShowNewConversationModal(false);
                setSelectedParticipants(new Set());
                setSearchTerm('');
                setNewMessage('');
              }} className="px-4 py-2 rounded-md text-slate-300 bg-slate-600 hover:bg-slate-500">
                Cancel
              </button>
              <button 
                onClick={handleInitiateNewConversation} 
                disabled={isCreatingConversation || selectedParticipants.size === 0}
                className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
              >
                {isCreatingConversation ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 