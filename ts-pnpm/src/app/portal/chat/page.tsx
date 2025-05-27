'use client';

import { ArrowPathIcon,ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, PlusCircleIcon, UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { RealtimeChannel } from '@supabase/supabase-js'; // Import Supabase types
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FormEvent,useEffect, useRef, useState } from 'react';

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

export default function ChatPage() {
  const { data: session, status: authStatus } = useSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [showNewConversationModal, setShowNewConversationModal] = useState(false); // Not needed for customer direct chat

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
    // Use chatContainerRef for scrolling, messagesEndRef is just a target div at the end
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const fetchConversations = async () => {
        setIsLoadingConversations(true);
        setError(null);
        try {
          const res = await fetch('/api/portal/chat/conversations');
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

  // Fetch messages and subscribe to realtime updates when a conversation is selected
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
      if (selectedConversation && !selectedConversation.id) {
        console.error('fetchMessagesAndSubscribe: selectedConversation has no ID!', selectedConversation);
      }

      setIsLoadingMessages(true);
      setError(null);
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

      // Setup Supabase real-time subscription
      const channelName = `chat:${selectedConversation.id}`; // Standardized channel name
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
        .subscribe((status: any, err?: any) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to broadcast channel ${channelName}`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`Supabase broadcast subscription error for ${channelName}:`, status, err);
          }
        });
    };

    if (selectedConversation) {
      fetchMessagesAndSubscribe();
    }

    return () => {
      if (channel && selectedConversation) { // Ensure selectedConversation is not null for logging
        console.log(`Unsubscribing from broadcast channel chat:${selectedConversation.id}`);
        supabase.removeChannel(channel).catch((err: any) => console.error('Error removing channel:', err));
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom whenever messages change
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
      const res = await fetch(`/api/portal/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend.trim() }),
      });

      if (!res.ok) {
        // Rollback optimistic update on error
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

      // Replace optimistic message with confirmed message
      setMessages(prev => {
        console.log('HANDLE_SEND_MESSAGE: Previous messages before replacing optimistic with confirmed:', prev.map(m => m.id));
        
        // Check if the confirmed message's ID is already present (added by broadcast)
        const alreadyExistsViaBroadcast = prev.find(msg => msg.id === confirmedMessage.id);

        if (alreadyExistsViaBroadcast) {
          // If broadcast already added it, we just need to remove the optimistic one.
          console.log(`HANDLE_SEND_MESSAGE: Confirmed message ID ${confirmedMessage.id} already added by broadcast. Removing optimistic ${tempMessageId}.`);
          return prev.filter(msg => msg.id !== tempMessageId);
        } else {
          // If not added by broadcast, replace optimistic with confirmed.
          console.log(`HANDLE_SEND_MESSAGE: Confirmed message ID ${confirmedMessage.id} not yet added by broadcast. Replacing optimistic ${tempMessageId}.`);
          return prev.map(msg => 
            msg.id === tempMessageId ? { ...confirmedMessage, sender: optimisticMessage.sender } : msg
          );
        }
      });
      
      // Update conversation list (this part seems okay for lastMessage content and updatedAt)
      setConversations(prevConvs => prevConvs.map(conv => 
        conv.id === selectedConversation.id 
        ? { 
            ...conv, 
            lastMessage: { // Reconstruct ChatMessage for lastMessage type
              id: confirmedMessage.id,
              content: confirmedMessage.content,
              createdAt: confirmedMessage.createdAt,
              senderId: confirmedMessage.senderId,
              sender: optimisticMessage.sender, // Assuming sender details are not in confirmedMessage from this specific API
              conversationId: confirmedMessage.conversationId,
            },
            updatedAt: confirmedMessage.createdAt 
          }
        : conv
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    } catch (err: any) {
      setError(err.message);
      console.error(err);
      // Ensure rollback if error happens after API call but before/during state updates
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId && msg.id !== (err.confirmedMessageId || ' '))); // Attempt to remove confirmed if somehow added before error
      setNewMessage(messageToSend); 
    }
  };
  
  const handleNewConversation = async () => {
    if (authStatus !== 'authenticated') return;
    setIsCreatingConversation(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [] }), // Backend handles adding staff for customers
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to start new chat' }));
        throw new Error(errorData.message || 'Failed to start new chat');
      }
      const newConvData = await res.json() as ChatConversation;
      setConversations(prev => [newConvData, ...prev.filter(c => c.id !== newConvData.id)].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setSelectedConversation(newConvData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating new conversation:', err);
    } finally {
      setIsCreatingConversation(false);
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
        <Link href="/auth/signin" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-900 text-slate-100">
      {/* Sidebar for Conversations List */}
      <aside className="w-1/3 min-w-[300px] max-w-[400px] bg-slate-800/70 border-r border-slate-700 flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-100">Messages</h2>
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={handleNewConversation}
              disabled={isCreatingConversation}
              className="p-2 rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              title="New Chat with Support (Dev Only)"
            >
              <PlusCircleIcon className="h-6 w-6 text-slate-300" />
            </button>
          )}
        </header>
        <div className="overflow-y-auto flex-grow">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-slate-400">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No conversations yet. Start one!</div>
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
                        {/* Use helper for safe formatting */}
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
                <UserGroupIcon className="h-10 w-10 text-slate-500" /> // Default to group if no image
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selectedConversation.title || 'Chat'}</h2>
                {/* Could add participant names here if needed, carefully */}
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
                        {/* Use helper for safe formatting */}
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
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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