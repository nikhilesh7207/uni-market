import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Trash2, UserX } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AdminChatModal = ({ chatId, onClose }) => {
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    // Fetch Chat Data
    useEffect(() => {
        const fetchChat = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL} /api/admin / chat / ${chatId}/full`, {
                    headers: { 'x-auth-token': token }
                });
                setChat(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch chat", err);
                alert("Failed to load chat history.");
                onClose();
            }
        };
        if (chatId) fetchChat();
    }, [chatId]);

    // Scroll to bottom on load
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat]);

    // Delete Message
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Permanently delete this message?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/chat/${chatId}/message/${messageId}`, {
                headers: { 'x-auth-token': token }
            });
            // Remove from local state immediately
            setChat(prev => ({
                ...prev,
                messages: prev.messages.filter(m => m._id !== messageId)
            }));
        } catch (err) {
            console.error("Failed to delete message", err);
            alert("Failed to delete message");
        }
    };

    // Block User
    const handleBlockUser = async (userId, name) => {
        if (!window.confirm(`Are you sure you want to block/unblock ${name}?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/admin/block/${userId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert(res.data.msg);
        } catch (err) {
            console.error("Failed to block user", err);
            alert("Error updating user status");
        }
    };

    if (!chatId) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Chat Investigation</h3>
                            <p className="text-xs text-gray-500">ID: {chatId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Participants Info Bar */}
                {chat && (
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex gap-4 overflow-x-auto">
                        {chat.participants.map(p => (
                            <div key={p._id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm shrink-0">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {p.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                <button
                                    onClick={() => handleBlockUser(p._id, p.name)}
                                    className="ml-1 p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition"
                                    title={`Block ${p.name}`}
                                >
                                    <Ban size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Chat Area */}
                <div
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative"
                    ref={scrollRef}
                >
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                        </div>
                    ) : chat?.messages.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No messages found in this history.</p>
                        </div>
                    ) : (
                        chat?.messages.map((msg, index) => {
                            const isFirstParticipant = msg.sender?._id === chat.participants[0]?._id;
                            const senderName = msg.sender?.name || 'Unknown User';

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex flex-col ${isFirstParticipant ? 'items-start' : 'items-end'} group`}
                                >
                                    <span className="text-[10px] text-gray-400 mb-1 px-1">
                                        {senderName} • {new Date(msg.timestamp).toLocaleString()}
                                    </span>

                                    <div className="relative max-w-[80%]">
                                        <div
                                            className={`px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-words border relative z-10 ${isFirstParticipant
                                                ? 'bg-white border-gray-200 text-gray-800 rounded-tl-none'
                                                : 'bg-blue-50 border-blue-100 text-gray-800 rounded-tr-none'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>

                                        {/* Admin Actions (Delete) */}
                                        <button
                                            onClick={() => handleDeleteMessage(msg._id)}
                                            className={`absolute top-1/2 -translate-y-1/2 p-2 bg-white shadow-md rounded-full border border-gray-100 text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 z-0 hover:bg-red-50 ${isFirstParticipant ? '-right-10' : '-left-10'
                                                }`}
                                            title="Delete Message"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer / Status */}
                <div className="p-3 bg-white border-t border-gray-100 text-center text-xs text-gray-400">
                    Admin View • Read-Only Mode
                </div>
            </div>
        </div>
    );
};

export default AdminChatModal;

