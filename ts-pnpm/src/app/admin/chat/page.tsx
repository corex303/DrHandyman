"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ChatConversation, ChatMessage, User, UserRole } from '@prisma/client'; 
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ProcessedConversation {
  id: string;
  participants: User[];
  updatedAt: string;
  displayTitle: string;
  displayImage?: string | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  lastMessageSenderId: string | null;
}

interface MessageWithSender extends ChatMessage {
  sender: Pick<User, 'id' | 'name' | 'email' | 'image' | 'role'>;
}

// interface MaintenanceWorkerOption extends Pick<User, 'id' | 'name' | 'email'> {}
type MaintenanceWorkerOption = Pick<User, 'id' | 'name' | 'email'>;

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
  const router = useRouter();
  const [conversations, setConversations] = useState<ProcessedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ProcessedConversation | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [currentAdminUserId, setCurrentAdminUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeChannel, setActiveChannel] = useState<RealtimeChannel | null>(null);

  // New state for "New Conversation" modal
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [availableMaintenanceWorkers, setAvailableMaintenanceWorkers] = useState<MaintenanceWorkerOption[]>([]);
  const [selectedWorkerForNewConversation, setSelectedWorkerForNewConversation] = useState<string>('');
  const [initialMessageForNewConversation, setInitialMessageForNewConversation] = useState('');
  const [newConversationError, setNewConversationError] = useState<string | null>(null);

  useEffect(() => {
    const getAdminId = async () => {
      setCurrentAdminUserId("admin-observer-id");
    };
    getAdminId();
  }, []);

  // Fetch available maintenance workers
  useEffect(() => {
    const fetchMaintenanceWorkers = async () => {
      try {
        // Assuming the role of the current user (admin) is already verified by session/auth higher up
        // This endpoint should be accessible to admins.
        const response = await fetch('/api/maintenance/workers/active');
        if (!response.ok) {
          throw new Error('Failed to fetch maintenance workers');
        }
        const workers: User[] = await response.json();
        setAvailableMaintenanceWorkers(workers.map(w => ({ id: w.id, name: w.name, email: w.email })));
      } catch (err) {
        console.error("Error fetching maintenance workers for admin:", err);
        // Handle error appropriately, maybe set an error state for the modal
      }
    };
    fetchMaintenanceWorkers();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchConversations = async (page = 1, search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chat/conversations?page=${page}&limit=15&searchTerm=${search}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }
      const data = await response.json();
      setConversations(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(data.pagination?.page || 1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced version of fetchConversations for search term changes
  const debouncedFetchConversations = useCallback(
    debounce((page: number, search: string) => {
      fetchConversations(page, search);
    }, 500), // 500ms debounce
    [] // Dependencies for useCallback, empty if fetchConversations itself doesn't change based on external scope often
  );

  useEffect(() => {
    // Fetch immediately if page changes
    // Debounce if searchTerm changes
    if (searchTerm === '' && currentPage === 1) { // Initial load or cleared search
        fetchConversations(currentPage, searchTerm);
    } else {
        debouncedFetchConversations(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, debouncedFetchConversations]); // Added debouncedFetchConversations to dependencies

  const fetchMessagesForConversation = async (conversationId: string) => {
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      const data = await response.json();
      setMessages(data || []);
    } catch (err) {
      console.error(err);
      setMessagesError(err instanceof Error ? err.message : 'An unknown error occurred fetching messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedConversation || !selectedConversation.id || !supabase) return;

    let channel: RealtimeChannel | null = null;
    const channelName = `chat:${selectedConversation.id}`;
    channel = supabase.channel(channelName, {
      config: { broadcast: { ack: true } },
    });
    setActiveChannel(channel); // Store active channel

    channel
      .on('broadcast', { event: 'new_message' }, (payload: any) => {
        const newMessagePayload = payload.payload as MessageWithSender;
        setMessages((prevMessages) => {
          if (prevMessages.find(msg => msg.id === newMessagePayload.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessagePayload];
        });
      })
      .on('broadcast', { event: 'typing_started' }, (payload: any) => {
        const { senderId, senderName } = payload.payload;
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
      })
      .on('broadcast', { event: 'typing_stopped' }, (payload: any) => {
        const { senderId } = payload.payload;
        if (typingTimeoutRef.current[senderId]) {
          clearTimeout(typingTimeoutRef.current[senderId]);
        }
        setTypingUsers(prev => {
          const { [senderId]: _, ...rest } = prev;
          return rest;
        });
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Admin subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Admin Supabase subscription error for ${channelName}:`, status, err);
          setMessagesError(`Chat connection issue: ${status}. Try selecting conversation again.`);
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(err => console.error('Admin: Error removing channel', err));
        console.log(`Admin unsubscribed from ${channelName}`);
      }
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {}; 
    };
  }, [selectedConversation, currentAdminUserId]);

  const handleSelectConversation = (conversation: ProcessedConversation) => {
    if (activeChannel) {
      supabase.removeChannel(activeChannel).catch(err => console.error('Error removing active admin channel', err));
      console.log(`Admin unsubscribed from ${activeChannel.topic} due to new selection or unmount`);
      setActiveChannel(null);
    }
    setTypingUsers({});
    setSelectedConversation(conversation);
    fetchMessagesForConversation(conversation.id);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchConversations(1, searchTerm);
  };

  const handleOpenNewConversationModal = () => {
    setNewConversationError(null);
    setSelectedWorkerForNewConversation('');
    setInitialMessageForNewConversation('');
    setIsNewConversationModalOpen(true);
  };

  const handleCloseNewConversationModal = () => {
    setIsNewConversationModalOpen(false);
  };

  const handleCreateNewConversation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWorkerForNewConversation || !initialMessageForNewConversation.trim()) {
      setNewConversationError("Please select a worker and enter an initial message.");
      return;
    }
    setNewConversationError(null);
    setIsSending(true); // Use existing isSending or a new one for this modal

    try {
      const response = await fetch('/api/admin/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceWorkerId: selectedWorkerForNewConversation,
          initialMessageContent: initialMessageForNewConversation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      const newConvData = await response.json();
      
      // Successfully created. Refresh conversation list and potentially select it.
      await fetchConversations(1, ''); // Refresh to page 1, no search term
      
      // Find and select the new/updated conversation
      // The response from POST might be the new message or the whole conversation
      // For simplicity, we'll just refresh and let the user select.
      // A more sophisticated approach would be to find it in the refreshed list and select it.
      
      handleCloseNewConversationModal();

    } catch (err) {
      console.error('Error creating new conversation:', err);
      setNewConversationError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentAdminUserId || !activeChannel) return;

    setIsSending(true);
    const tempMessageId = `temp_${Date.now()}`;
    const messagePayload: MessageWithSender = {
      id: tempMessageId, // Temporary ID for optimistic update
      content: newMessage,
      senderId: currentAdminUserId!, // Assert non-null as it should be set
      conversationId: selectedConversation.id,
      createdAt: new Date(),
      sender: { 
        id: currentAdminUserId!, // Assert non-null
        name: 'Admin', 
        email: 'admin@example.com', 
        image: '/images/icons/avatar-admin.png', 
        role: 'ADMIN',
      },
      attachmentUrl: null,
      attachmentType: null,
      attachmentFilename: null,
      attachmentSize: null,
      readAt: null,
    };

    // Optimistic update
    setMessages(prev => [...prev, messagePayload]);
    setNewMessage('');

    try {
      // Send to Supabase channel for other participants
      const broadcastStatus = await activeChannel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: messagePayload,
      });

      if (broadcastStatus !== 'ok') {
        console.error('Supabase broadcast error:', broadcastStatus);
        // Revert optimistic update or mark message as failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        setMessagesError('Failed to send message via real-time. Please try again.');
        // Optionally, restore newMessage if you want the user to retry sending it.
        // setNewMessage(messagePayload.content); 
      }

      // Send to backend API to persist
      const response = await fetch(`/api/admin/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messagePayload.content,
          // senderId is handled by the session on the backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
      }
      const persistedMessage = await response.json();
      
      // Replace temporary message with persisted one
      setMessages(prev => prev.map(msg => msg.id === tempMessageId ? persistedMessage : msg));

      // Notify typing stopped
      activeChannel.send({
        type: 'broadcast',
        event: 'typing_stopped',
        payload: { senderId: currentAdminUserId, senderName: 'Admin' },
      }).catch(err => console.error("Error sending typing_stopped broadcast:", err));

    } catch (err) {
      console.error('Error sending message:', err);
      setMessagesError(err instanceof Error ? err.message : 'An unknown error occurred while sending message.');
      // Revert optimistic update if API call failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      // Optionally, restore newMessage if you want the user to retry sending it.
      // setNewMessage(messagePayload.content);
    } finally {
      setIsSending(false);
    }
  };

  const debouncedTypingStarted = useCallback(
    debounce(() => {
      if (activeChannel && currentAdminUserId && selectedConversation) {
        activeChannel.send({
          type: 'broadcast',
          event: 'typing_started',
          payload: { senderId: currentAdminUserId, senderName: 'Admin' },
        }).catch(err => console.error("Error sending typing_started broadcast:", err));
      }
    }, 500),
    [activeChannel, currentAdminUserId, selectedConversation]
  );

  const handleNewMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      debouncedTypingStarted();
    }
  };

  const displayTypingUsers = Object.values(typingUsers).filter(name => name).join(', ');

  return (
    <div className="container mx-auto p-4 md:p-8 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Chat Overview</h1>
        <p className="text-slate-600">View and monitor conversations between maintenance staff and customers.</p>
      </header>

      <form onSubmit={handleSearchSubmit} className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">Search Conversations</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by keyword, user, work order..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Search
          </button>
        </div>
      </form>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">Error: {error}</div>}

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`w-full md:w-1/3 bg-white shadow-lg rounded-lg p-2 overflow-y-auto ${selectedConversation ? 'hidden md:block' : 'block'}`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="flex justify-between items-center p-3 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-700">Conversations</h2>
            <button
              onClick={handleOpenNewConversationModal}
              className="px-3 py-1.5 text-sm bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            >
              New Chat
            </button>
          </div>
          {isLoading && conversations.length === 0 && <div className="p-4 text-center text-slate-500">Loading conversations...</div>}
          {!isLoading && conversations.length === 0 && <div className="p-4 text-center text-slate-500">No conversations found.</div>}
          
          <ul className="divide-y divide-slate-200">
            {conversations.map((conv) => (
              <li 
                key={conv.id} 
                onClick={() => handleSelectConversation(conv)}
                className={`p-3 hover:bg-slate-100 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-sky-100 border-l-4 border-sky-500' : ''}`}
              >
                <div className="font-semibold text-slate-800 truncate">{conv.displayTitle}</div>
                <p className="text-sm text-slate-500 truncate">{conv.lastMessagePreview}</p>
                <p className="text-xs text-slate-400 text-right">{new Date(conv.lastMessageAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="p-3 mt-4 flex justify-between items-center border-t border-slate-200">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className={`flex-grow bg-white shadow-lg rounded-lg ${!selectedConversation ? 'hidden md:flex md:items-center md:justify-center' : 'block'}`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {!selectedConversation && (
            <div className="text-center text-slate-500 p-4">
              <p className="text-xl">Select a conversation to view messages.</p>
              <p>Admins can observe conversations here but cannot participate.</p>
            </div>
          )}
          {selectedConversation && (
            <div className="h-full flex flex-col">
              <header className="p-3 border-b border-slate-200 mb-2 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-800 truncate">{selectedConversation.displayTitle}</h2>
                   <button 
                      onClick={() => setSelectedConversation(null)} 
                      className="md:hidden px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                    >
                      Back
                    </button>
                </div>
                <p className="text-xs text-slate-500">
                  Participants: {selectedConversation.participants.map(p => `${p.name || p.email} (${p.role})`).join(', ')}
                </p>
                {displayTypingUsers && (
                    <p className="text-xs text-sky-600 animate-pulse">
                        {displayTypingUsers} {displayTypingUsers.includes(',') ? 'are' : 'is'} typing...
                    </p>
                )}
              </header>
              
              <div className="flex-grow overflow-y-auto p-3 space-y-4 bg-slate-50 rounded">
                {isLoadingMessages && <div className="text-center text-slate-400 py-8">Loading messages...</div>}
                {!isLoadingMessages && messagesError && 
                  <div className="text-center text-red-500 py-8">
                    Error loading messages: {messagesError}
                  </div>
                }
                {!isLoadingMessages && !messagesError && messages.length === 0 && 
                  <div className="text-center text-slate-400 py-8">No messages in this conversation.</div>
                }
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col items-start max-w-xl ${
                      msg.sender.id === currentAdminUserId ? 'self-end ml-auto' : 
                      msg.sender.role === 'CUSTOMER' ? 'self-start' : 'self-end ml-auto'
                      }`}>
                    <div className={`flex items-end gap-2 ${
                        msg.sender.id === currentAdminUserId ? 'flex-row-reverse' : 
                        msg.sender.role === 'CUSTOMER' ? 'flex-row' : 'flex-row-reverse'
                        }`}>
                        <img 
                            src={msg.sender.image || '/images/icons/avatar-placeholder.png'} 
                            alt={msg.sender.name || 'User'}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                        />
                        <div
                            className={`px-3 py-2 rounded-lg shadow-sm ${
                                msg.sender.id === currentAdminUserId ? 'bg-sky-600 text-white' : // Admin's own messages
                                msg.sender.role === 'CUSTOMER' ? 'bg-slate-200 text-slate-800' : // Customer messages
                                'bg-fuchsia-500 text-white' // Maintenance messages (example)
                            }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                            {msg.attachmentFilename && (
                                <div className="mt-1 pt-1 border-t border-opacity-50">
                                    <a 
                                        href={`/api/portal/chat/attachment?messageId=${msg.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs underline hover:text-opacity-80 break-all"
                                    >
                                        Attachment: {msg.attachmentFilename}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className={`text-xs text-slate-400 mt-1 ${
                        msg.sender.id === currentAdminUserId ? 'mr-8 self-end' : 
                        msg.sender.role === 'CUSTOMER' ? 'ml-8' : 'mr-8 self-end'
                        }`}>
                        {msg.sender.id === currentAdminUserId ? 'Admin' : msg.sender.name || msg.sender.email} - {new Date(msg.createdAt).toLocaleTimeString()} | {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="mt-auto p-3 border-t border-slate-200 flex-shrink-0">
                <div className="flex items-start space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={handleNewMessageChange}
                    placeholder="Type your message to Maintenance..."
                    rows={2}
                    className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-none"
                    disabled={!selectedConversation || isSending}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={!selectedConversation || !newMessage.trim() || isSending}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {isNewConversationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Start New Conversation</h2>
              <button onClick={handleCloseNewConversationModal} className="text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
            </div>

            {newConversationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">
                {newConversationError}
              </div>
            )}

            <form onSubmit={handleCreateNewConversation} className="space-y-4">
              <div>
                <label htmlFor="maintenanceWorkerSelect" className="block text-sm font-medium text-slate-700 mb-1">
                  Chat with Maintenance Worker:
                </label>
                <select
                  id="maintenanceWorkerSelect"
                  value={selectedWorkerForNewConversation}
                  onChange={(e) => setSelectedWorkerForNewConversation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  disabled={availableMaintenanceWorkers.length === 0}
                >
                  <option value="" disabled>
                    {availableMaintenanceWorkers.length === 0 ? 'Loading workers...' : 'Select a worker'}
                  </option>
                  {availableMaintenanceWorkers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name || worker.email}
                    </option>
                  ))}
                </select>
                {availableMaintenanceWorkers.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No maintenance workers found or still loading.</p>
                )}
              </div>

              <div>
                <label htmlFor="initialMessage" className="block text-sm font-medium text-slate-700 mb-1">
                  Initial Message:
                </label>
                <textarea
                  id="initialMessage"
                  rows={3}
                  value={initialMessageForNewConversation}
                  onChange={(e) => setInitialMessageForNewConversation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-none"
                  placeholder="Type your first message..."
                  disabled={isSending}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseNewConversationModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 disabled:opacity-50"
                  disabled={isSending || !selectedWorkerForNewConversation || !initialMessageForNewConversation.trim()}
                >
                  {isSending ? 'Starting...' : 'Start Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 