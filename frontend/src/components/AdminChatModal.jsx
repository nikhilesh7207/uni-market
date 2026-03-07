import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, X, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const AdminChatModal = ({ chatId, onClose }) => {
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

    const fetchChat = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/chat/${chatId}`, {
                headers: { 'x-auth-token': token }
            });
            setChat(res.data);
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 100);
        } catch (err) {
            console.error("Failed to load chat details", err);
            toast.error("Failed to load full chat history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (chatId) fetchChat();
    }, [chatId]);

    const deleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/chat/${chatId}/message/${msgId}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Message deleted");
            setChat({ ...chat, messages: chat.messages.filter(m => m._id !== msgId) });
        } catch (err) {
            console.error("Failed to delete message", err);
            toast.error("Failed to delete message");
        }
    };

    if (!chatId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] border outline-none border-gray-100 dark:border-slate-700">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat Investigation</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Participants: {chat?.participants?.map(p => p?.name).filter(Boolean).join(', ')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Messages Body */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar"
                >
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : chat?.messages?.length > 0 ? (
                        chat.messages.map((msg, idx) => {
                            const isFirstChild = idx === 0 || chat.messages[idx - 1].sender?._id !== msg.sender?._id;
                            return (
                                <div key={msg._id} className={`flex items-start gap-3 group translate-z-0 ${isFirstChild ? 'mt-6' : 'mt-1'}`}>
                                    {isFirstChild ? (
                                        msg.sender?.profilePic ? (
                                            <img src={msg.sender.profilePic} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" alt={msg.sender.name} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
                                                {msg.sender?.name?.charAt(0) || '?'}
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-8 flex-shrink-0"></div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {isFirstChild && (
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {msg.sender?.name || 'Unknown User'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                    {format(new Date(msg.createdAt), 'MMM dd, h:mm a')}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-none inline-block max-w-[85%] shadow-sm">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                                    {msg.content}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => deleteMessage(msg._id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all focus:opacity-100 focus:outline-none"
                                                title="Delete specific message"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>No messages found in this chat.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatModal;
