import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ChatBox from '../components/ChatBox';
import Navbar from '../components/Navbar';
import { MessageCircle, User, Trash2, MoreVertical } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_BASE_URL } from '../config';

const ChatPage = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const location = useLocation();

    // Context Menu Ref to handle clicking outside
    const contextMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        const newSocket = io(SOCKET_BASE_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            auth: { token }
        });

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
        });

        setSocket(newSocket);
        newSocket.emit('join_user', user._id || user.id); // New event to join user-specific room if needed, or just rely on global if simple

        const fetchChats = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/chat/user`);
                console.log("[DEBUG] Fetched Chats:", res.data);
                setChats(res.data);
            } catch (err) {
                console.error("Failed to fetch chats", err);
            }
        };

        fetchChats();

        // Listen for incoming messages to update the list
        newSocket.on('receive_message', (data) => {
            // data = { room: chatId, content, sender, time, ... }
            setChats(prevChats => {
                const chatIndex = prevChats.findIndex(c => c._id === data.room);
                if (chatIndex === -1) {
                    // New chat or not in list (fetching again is safest but heavy, let's just re-fetch for now to be simple/robust)
                    fetchChats();
                    return prevChats;
                }

                const updatedChat = { ...prevChats[chatIndex] };
                updatedChat.lastMessage = {
                    content: data.content,
                    sender: data.sender,
                    timestamp: data.time || new Date(),
                    isUnsent: false
                };
                updatedChat.updatedAt = new Date().toISOString();

                // Increment unread if not currently selected
                if (selectedChatId !== data.room) {
                    // Need to handle Map or Object structure from backend. 
                    // Backend returns unreadCounts as Map but in JSON it becomes Object { userId: count }
                    const currentCounts = updatedChat.unreadCounts || {};
                    const myId = user._id || user.id;
                    const newCount = (currentCounts[myId] || 0) + 1;
                    updatedChat.unreadCounts = { ...currentCounts, [myId]: newCount };
                }

                // Move to top
                const newChats = [...prevChats];
                newChats.splice(chatIndex, 1);
                newChats.unshift(updatedChat);
                return newChats;
            });
        });

        return () => newSocket.disconnect();
    }, [user, selectedChatId]); // Re-run socket listener if selectedChatId changes? 
    // Ideally we don't want to re-connect socket constantly. 
    // Better to use a ref for selectedChatId inside the socket callback or filtered logic.
    // For simplicity, we can leave selectedChatId out of dependency and just check state, 
    // BUT state inside socket callback might be stale (closure).
    // Let's rely on the chat box to emit "read" events or just optimistically update here.
    // Actually, simply clicking the chat clears unread.

    useEffect(() => {
        // Handle redirect
        const stateChatId = location.state?.chatId;
        if (stateChatId) {
            setSelectedChatId(stateChatId);
            // Also need to mark as read locally
            setChats(prev => prev.map(c => {
                if (c._id === stateChatId) {
                    const myId = user._id || user.id;
                    const counts = c.unreadCounts || {};
                    return { ...c, unreadCounts: { ...counts, [myId]: 0 } };
                }
                return c;
            }));
        }
    }, [location]);

    // Handle selecting a chat (Clear unread)
    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId);
        setChats(prev => prev.map(c => {
            if (c._id === chatId) {
                const myId = user._id || user.id;
                const counts = c.unreadCounts || {};
                return { ...c, unreadCounts: { ...counts, [myId]: 0 } };
            }
            return c;
        }));
    };

    const handleDeleteChat = async (chatId) => {
        if (!window.confirm("Delete this chat?")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/chat/${chatId}/delete`);
            setChats(prev => prev.filter(c => c._id !== chatId));
            if (selectedChatId === chatId) setSelectedChatId(null);
            setContextMenu(null);
        } catch (err) {
            console.error("Failed to delete chat", err);
        }
    };

    const handleContextMenu = (e, chatId) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            chatId
        });
    };

    // Helper to format time
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" onClick={() => setContextMenu(null)}>
            <Navbar />

            <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle size={32} className="text-primary" />
                        Messages
                    </h1>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition font-medium text-sm flex items-center gap-2"
                    >
                        <span>&larr;</span> Back to Products
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[80vh] min-h-[500px] md:h-[600px]">

                    {/* Chat List (Sidebar) */}
                    <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-700">Conversations</h2>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                                {chats.filter(c => (c.unreadCounts?.[user._id || user.id] || 0) > 0).length} New
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {chats.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>No conversations yet</p>
                                </div>
                            ) : (
                                chats.map(chat => {
                                    const otherParticipant = chat.participants.find(p => p._id !== (user._id || user.id)) || chat.participants[0];
                                    const lastMsg = chat.lastMessage;
                                    const unreadCount = chat.unreadCounts?.[user._id || user.id] || 0;

                                    return (
                                        <div
                                            key={chat._id}
                                            onContextMenu={(e) => handleContextMenu(e, chat._id)}
                                            className="relative"
                                        >
                                            <button
                                                onClick={() => handleSelectChat(chat._id)}
                                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 text-left
                                                    ${selectedChatId === chat._id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                            >
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {otherParticipant?.profilePic ? (
                                                            <img src={otherParticipant.profilePic} alt={otherParticipant.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={20} className="text-gray-500" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h4 className="font-semibold text-gray-900 truncate">{otherParticipant?.name || 'User'}</h4>
                                                        <span className={`text-[10px] whitespace-nowrap ${unreadCount > 0 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                                            {formatTime(lastMsg?.timestamp || chat.updatedAt)}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <p className={`text-sm truncate w-[85%] ${unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                                            {lastMsg?.isUnsent ?
                                                                <span className="italic text-gray-400">Message unsent</span> :
                                                                (lastMsg?.content || 'Started a conversation')}
                                                        </p>
                                                        {unreadCount > 0 && (
                                                            <span className="min-w-[20px] h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1.5">
                                                                {unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`w-full md:w-2/3 flex flex-col ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                        {selectedChatId ? (
                            <div className="flex-1 flex flex-col h-full relative">
                                {/* Back button for mobile */}
                                <div className="md:hidden p-2 border-b border-gray-100 flex items-center">
                                    <button onClick={() => setSelectedChatId(null)} className="text-primary text-sm font-medium flex items-center gap-1">
                                        <span>←</span> Back
                                    </button>
                                </div>

                                <div className="flex-1 p-0 overflow-hidden">
                                    <ChatBox existingChatId={selectedChatId} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                <MessageCircle size={64} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select a conversation to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-50 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => handleDeleteChat(contextMenu.chatId)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                        <Trash2 size={16} /> Delete Chat
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
