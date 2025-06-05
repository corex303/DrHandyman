'use client';

import { ArrowPathIcon, ChatBubbleLeftEllipsisIcon,PaperAirplaneIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

// Types (should ideally be in a separate types file)
interface ChatParticipant {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ChatMessage {
  id: string;
  createdAt: string;
  content: string;
  senderId: string;
  sender: ChatParticipant;
  conversationId: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}

interface ChatConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  title?: string;
  image?: string | null;
  lastMessage?: ChatMessage | null;
  displayTitle: string;
}

interface MaintenanceWorker extends Pick<ChatParticipant, 'id' | 'name' | 'image'> {
  // Add other specific fields if needed from the API response
  email?: string;
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

export default function MaintenanceChatPage() {
  const { data: session, status: authStatus } = useSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // { userId: userName }
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); 

  const [activeWorkers, setActiveWorkers] = useState<MaintenanceWorker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  const formatDateToTime = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return ' ';
    try {
      const date = new Date(dateInput);
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

  // Fetch active maintenance workers
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const fetchActiveWorkers = async () => {
        setIsLoadingWorkers(true);
        try {
          const res = await fetch('/api/maintenance/workers/active');
          if (!res.ok) {
            throw new Error('Failed to fetch active workers');
          }
          const data = await res.json();
          setActiveWorkers(data);
          // Auto-select the logged-in user if they are in the list, or the first worker
          if (data.length > 0) {
            const loggedInWorker = data.find((w: MaintenanceWorker) => w.id === session?.user?.id);
            setSelectedWorkerId(loggedInWorker ? loggedInWorker.id : data[0].id);
          }
        } catch (err: any) {
          console.error("Error fetching active workers:", err);
          // Optionally set an error state for workers
        } finally {
          setIsLoadingWorkers(false);
        }
      };
      fetchActiveWorkers();
    }
  }, [authStatus, session?.user?.id]);

  // Fetch conversations
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const fetchConversations = async () => {
        setIsLoadingConversations(true);
        setError(null);
        try {
          // MAINTENANCE NOTE: API endpoint is likely the same as portal/customer for fetching their conversations.
          const res = await fetch('/api/portal/chat/conversations'); 
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Failed to fetch conversations' }));
            throw new Error(errorData.message || 'Failed to fetch conversations');
          }
          let data = await res.json();

          // Process conversations to correctly identify displayTitle for maintenance
          data = data.map((conv: any) => {
            const loggedInUserId = selectedWorkerId || session?.user?.id;
            const customerParticipant = conv.participants.find((p: ChatParticipant) => p.role === 'CUSTOMER');
            const otherParticipants = conv.participants.filter((p: ChatParticipant) => p.id !== loggedInUserId);
            
            let displayTitle = conv.displayTitle; // Keep original if already good

            if (customerParticipant) {
              displayTitle = customerParticipant.name || customerParticipant.email || 'Customer';
            } else if (otherParticipants.length === 1) {
              // If no customer, and one other participant (likely another staff)
              displayTitle = otherParticipants[0].name || otherParticipants[0].email || 'Chat User';
            } else if (otherParticipants.length > 1) {
              // If no customer, and multiple other participants
              displayTitle = otherParticipants.map((p: ChatParticipant) => p.name || p.email).join(', ');
            }
            // If it's a chat with self (only logged in user is participant), title might be "My Notes" or similar
            // This case should be handled by the API's original displayTitle logic if selectedWorkerId is part of participants

            return {
              ...conv,
              displayTitle: displayTitle,
              // Ensure participants array is part of the conv object for selection logic
              participants: conv.participants 
            };
          });

          setConversations(data);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        } finally {
            setIsLoadingConversations(false);
        }
      };
      fetchConversations();
    }
  }, [authStatus, selectedWorkerId, session?.user?.id]);

  // Debounced function to send typing started event
  const debouncedSendTypingStarted = useCallback(
    debounce(() => {
      const currentSenderId = selectedWorkerId || session?.user?.id;
      const currentSenderName = activeWorkers.find(w => w.id === currentSenderId)?.name || session?.user?.name || 'Someone';
      if (selectedConversation && currentSenderId && supabase.channel(`chat:${selectedConversation.id}`)) {
        supabase.channel(`chat:${selectedConversation.id}`).send({
          type: 'broadcast',
          event: 'typing_started',
          payload: { senderId: currentSenderId, senderName: currentSenderName },
        });
      }
    }, 500), 
    [selectedConversation, session, selectedWorkerId, activeWorkers]
  );

  const sendTypingStopped = () => {
    const currentSenderId = selectedWorkerId || session?.user?.id;
    if (selectedConversation && currentSenderId && supabase.channel(`chat:${selectedConversation.id}`)) {
      supabase.channel(`chat:${selectedConversation.id}`).send({
        type: 'broadcast',
        event: 'typing_stopped',
        payload: { senderId: currentSenderId },
      });
    }
  };

  const handleNewMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Only input for maintenance chat
    setNewMessage(e.target.value);
    if (e.target.value.trim().length > 0) {
      debouncedSendTypingStarted();
    } else {
      sendTypingStopped();
    }
  };

  // Fetch messages and subscribe to realtime updates (MODIFIED for typing events & selectedWorkerId)
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
          const currentUserId = selectedWorkerId || session?.user?.id;
          if (senderId !== currentUserId) {
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
          const currentUserId = selectedWorkerId || session?.user?.id;
          if (senderId !== currentUserId) {
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
  }, [selectedConversation, session?.user?.id, selectedWorkerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); 

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    // Determine the display name for the chat header
    // Prioritize customer name if available
    const loggedInUserId = selectedWorkerId || session?.user?.id;
    const customerParticipant = conversation.participants.find(p => p.role === 'CUSTOMER');
    let headerName = conversation.displayTitle; // Default to what came from the list

    if (customerParticipant) {
      headerName = customerParticipant.name || customerParticipant.email || 'Customer';
    } else {
      // Fallback for non-customer chats (e.g., staff-to-staff)
      const otherParticipants = conversation.participants.filter(p => p.id !== loggedInUserId);
      if (otherParticipants.length > 0) {
        headerName = otherParticipants.map(p => p.name || p.email).join(', ');
      } else if (conversation.participants.length === 1 && conversation.participants[0].id === loggedInUserId) {
        headerName = "My Notes"; // Or similar for self-chat
      }
    }
    // Update the selected conversation with a refined title for the header if necessary
    setSelectedConversation(prev => prev ? ({...prev, title: headerName }) : null);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !selectedWorkerId) {
      // Added !selectedWorkerId check
      alert('Please select a worker to send as and type a message.');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const senderForMessage = activeWorkers.find(w => w.id === selectedWorkerId);

    if (!senderForMessage) {
        alert('Selected worker not found. Cannot send message.');
        return;
    }

    // Optimistic UI update
    const optimisticMessage: ChatMessage = {
      id: tempId,
      createdAt: new Date().toISOString(),
      content: newMessage.trim(),
      senderId: selectedWorkerId, // Use selected worker ID
      sender: {
        id: selectedWorkerId,
        name: senderForMessage.name,
        image: senderForMessage.image,
        role: 'MAINTENANCE', // Assuming role
      },
      conversationId: selectedConversation.id,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    sendTypingStopped(); // Stop typing indicator immediately after sending
    setNewMessage('');

    try {
      const res = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage.trim(),
            senderId: selectedWorkerId, // Send selected worker ID to backend
            // The backend should ideally fetch/verify sender details based on this ID
          }),
        }
      );
      const savedMessage = await res.json();
      if (!res.ok) {
        throw new Error(savedMessage.error || 'Failed to send message');
      }
      // Replace optimistic message with saved one
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? savedMessage : msg)));
    } catch (err: any) {
      console.error('Send message error:', err);
      setError(`Failed to send: ${err.message}`);
      // Revert optimistic update on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };
  
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
        {/* MAINTENANCE NOTE: Link should point to maintenance signin */}
        <Link href="/maintenance/login" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          Sign In
        </Link>
      </div>
    );
  }

  const typingDisplayNames = Object.values(typingUsers).filter(name => name).join(', ');

  const otherTypingUsers = Object.entries(typingUsers)
    .filter(([userId]) => userId !== (selectedWorkerId || session?.user?.id)) // Filter out self
    .map(([, userName]) => userName);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-900 text-slate-100">
      {/* Sidebar for Conversations List */}
      <aside className="w-1/3 min-w-[300px] max-w-[400px] bg-slate-800/70 border-r border-slate-700 flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-100">Messages</h2>
          {/* "New Chat" button removed for maintenance workers */}
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
                {otherTypingUsers.length > 0 && (
                  <p className="text-xs text-primary-400 animate-pulse">
                    {otherTypingUsers.join(', ')} {otherTypingUsers.length === 1 ? 'is' : 'are'} typing...
                  </p>
                )}
              </div>
            </header>
            <div className="p-3 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <h3 className="text-lg font-semibold text-sky-300 truncate">
                {selectedConversation.title || selectedConversation.displayTitle || 'Chat'}
              </h3>
              {/* Optionally show other participants if not a 1:1 customer chat */}
              {selectedConversation.participants && selectedConversation.participants.filter(p => p.id !== (selectedWorkerId || session?.user?.id) && p.role !== 'CUSTOMER').length > 0 && (
                 <p className="text-xs text-slate-400 truncate">
                   With: {selectedConversation.participants.filter(p => p.id !== (selectedWorkerId || session?.user?.id) && p.role !== 'CUSTOMER').map(p=>p.name || p.email).join(', ')}
                 </p>
              )}
            </div>
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-750">
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
                  onChange={handleNewMessageChange} // Use new handler
                  placeholder="Type a message..."
                  className="flex-1 p-2 rounded-md bg-slate-700 text-slate-100 border border-slate-600 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-400"
                  disabled={!selectedConversation || isLoadingMessages}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || !selectedConversation || isLoadingMessages}
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
            <p className="text-lg">Select a conversation to view messages.</p>
          </div>
        )}
      </main>
      {/* New Conversation Modal removed for maintenance workers */}
    </div>
  );
} 