import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Send, AlertTriangle, MoreVertical, ArrowLeft, Trash2, User, X, Reply, Home, UserX } from 'lucide-react';
import { API_BASE_URL, SOCKET_BASE_URL } from '../config';

const ChatBox = ({ productId, sellerId, existingChatId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState(existingChatId || null);
    const [product, setProduct] = useState(null);
    const [otherUser, setOtherUser] = useState(null);

    const [showReportPopup, setShowReportPopup] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const messagesEndRef = useRef(null);

    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (!existingChatId && (!productId || !sellerId)) return;

        const newSocket = io(SOCKET_BASE_URL);
        setSocket(newSocket);

        const initChat = async () => {
            try {
                let res;
                if (existingChatId) {
                    res = await axios.get(`${API_BASE_URL}/api/chat/${existingChatId}`);
                } else {
                    res = await axios.post(`${API_BASE_URL}/api/chat/start`, {
                        productId,
                        sellerId
                    });
                }

                const chatData = res.data;
                setChatId(chatData._id);
                setMessages(chatData.messages || []);
                setProduct(chatData.product);

                // Identify other user
                const other = chatData.participants.find(p => p._id !== (user._id || user.id));
                setOtherUser(other);

                // Check block status
                if (user.blockedUsers && other) {
                    setIsBlocked(user.blockedUsers.includes(other._id));
                }

                newSocket.emit('join_chat', chatData._id);
            } catch (err) {
                console.error("Failed to init chat", err);
            }
        };

        initChat();

        newSocket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        newSocket.on('error', (err) => {
            alert(err);
        });

        return () => newSocket.close();
    }, [productId, sellerId, user, existingChatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleBlock = async () => {
        if (!otherUser) return;
        const confirmMsg = isBlocked ? "Unblock this user?" : "Block this user? You won't receive messages from them.";
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/block-user/${otherUser._id}`);
            setIsBlocked(res.data.isBlocked);
            alert(res.data.msg);
        } catch (err) {
            console.error(err);
            alert("Action failed");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId) return;

        const messageData = {
            room: chatId,
            sender: user._id || user.id,
            content: newMessage,
            replyTo: replyingTo ? {
                messageId: replyingTo._id,
                content: replyingTo.content,
                senderName: replyingTo.sender.name || 'User'
            } : null,
            time: new Date().toISOString()
        };

        try {
            await axios.post(`${API_BASE_URL}/api/chat/${chatId}/message`, {
                content: newMessage,
                replyTo: replyingTo ? {
                    messageId: replyingTo._id,
                    content: replyingTo.content,
                    senderName: replyingTo.sender.name || 'User'
                } : null
            });
            socket.emit('send_message', messageData);
            setNewMessage('');
            setReplyingTo(null);
        } catch (err) {
            console.error("Failed to send", err);
            if (err.response && err.response.status === 403) {
                alert(err.response.data.msg || "Message failed. You might be blocked.");
            }
        }
    };

    const handleUnsend = async (messageId) => {
        if (!window.confirm("Unsend this message? It will be removed for everyone.")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/chat/${chatId}/message/${messageId}/unsend`);
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        } catch (err) {
            console.error("Failed to unsend", err);
        }
    };

    const handleDeleteMessageLocal = async (messageId) => {
        if (!window.confirm("Delete for me?")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/chat/${chatId}/message/${messageId}/delete`);
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const handleDeleteChat = async () => {
        if (!window.confirm("Delete this conversation? It will be removed from your list.")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/chat/${chatId}/delete`);
            navigate('/chat');
            window.location.reload();
        } catch (err) {
            console.error("Failed to delete chat", err);
        }
    };

    const handleReport = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/chat/${chatId}/report`);
            alert('Report submitted successfully.');
            setShowReportPopup(false);
        } catch (err) {
            alert('Failed to report chat');
        }
    };

    const scrollToMessage = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-yellow-100');
            setTimeout(() => element.classList.remove('bg-yellow-100'), 2000);
        }
    };

    if (!user) return <div className="p-4 bg-gray-100 rounded text-center">Please login to chat.</div>;

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">

            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    {product ? (
                        <button onClick={() => navigate(`/product/${product._id}`)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600" title="Back to Product">
                            <ArrowLeft size={20} />
                        </button>
                    ) : (
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    {otherUser ? (
                        <Link to={`/profile/${otherUser._id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden">
                                {otherUser.profilePic ? (
                                    <img src={otherUser.profilePic} alt={otherUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-none">{otherUser.name}</h3>
                            </div>
                        </Link>
                    ) : (
                        <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden bg-gray-200">
                                {otherUser?.profilePic ? (
                                    <img src={otherUser.profilePic} alt={otherUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-gray-500" />
                                )}
                            </div>
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" title="Home">
                        <Home size={20} />
                    </button>

                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                            <MoreVertical size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => { setShowReportPopup(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <AlertTriangle size={16} /> Report User
                                </button>
                                <button
                                    onClick={() => { handleBlock(); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <UserX size={16} /> {isBlocked ? 'Unblock User' : 'Block User'}
                                </button>
                                <button
                                    onClick={handleDeleteChat}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {product && (
                <div className="bg-primary/5 p-2 px-4 flex justify-between items-center text-sm border-b border-primary/10">
                    <span className="text-primary font-medium truncate">Talking about: {product.name}</span>
                    <span className="font-bold text-primary">₹{product.price}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white scroll-smooth" onClick={() => setShowMenu(false)}>
                {messages.map((msg, index) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const currentUserId = user._id || user.id;
                    const isMe = senderId === currentUserId;

                    return (
                        <div key={index} id={msg._id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'mr-2 flex-row-reverse' : 'ml-2'}`}>
                                <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-gray-300 hover:text-primary bg-white rounded-full shadow-sm" title="Reply">
                                    <Reply size={14} />
                                </button>
                                {isMe && (
                                    <button onClick={() => handleUnsend(msg._id)} className="p-1.5 text-gray-300 hover:text-red-500 bg-white rounded-full shadow-sm" title="Unsend">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                {!isMe && (
                                    <button onClick={() => handleDeleteMessageLocal(msg._id)} className="p-1.5 text-gray-300 hover:text-red-500 bg-white rounded-full shadow-sm" title="Delete for me">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {!isMe && (
                                <div className="flex-shrink-0 mr-2 self-end mb-1">
                                    {msg.sender?.profilePic ? (
                                        <img src={msg.sender.profilePic} alt={msg.sender.name} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-100">
                                            <User size={16} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`relative max-w-[70%]`}>
                                {msg.replyTo && (
                                    <div
                                        onClick={() => scrollToMessage(msg.replyTo.messageId)}
                                        className={`mb-1 p-2 rounded-lg text-xs cursor-pointer border-l-2 bg-opacity-10 ${isMe ? 'bg-white border-white text-white/90' : 'bg-gray-200 border-gray-400 text-gray-500'}`}
                                    >
                                        <span className="font-bold block mb-0.5">{msg.replyTo.senderName}</span>
                                        <span className="line-clamp-1">{msg.replyTo.content}</span>
                                    </div>
                                )}

                                <div className={`px-4 py-2.5 text-sm shadow-sm transition-all ${isMe ? 'bg-primary text-white rounded-2xl rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'}`}>
                                    <p className="leading-relaxed break-words">{msg.content}</p>
                                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end text-primary/20' : 'justify-start text-gray-400'}`}>
                                        <span className="text-[10px]">
                                            {new Date(msg.time || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {isBlocked ? (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-gray-500 italic">
                    <div className="flex flex-col items-center gap-2">
                        <UserX size={24} className="text-red-300" />
                        <p>You blocked this user. <button onClick={handleBlock} className="text-blue-500 underline">Unblock</button> to send messages.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 px-4 rounded-t-xl border-b border-gray-100 mb-2 border-l-4 border-primary">
                            <div className="text-sm">
                                <p className="text-primary font-bold text-xs">Replying to {replyingTo.sender.name || 'User'}</p>
                                <p className="text-gray-500 truncate max-w-[200px]">{replyingTo.content}</p>
                            </div>
                            <button type="button" onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                            className="w-full bg-gray-100 text-gray-800 rounded-full px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12 font-medium"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 p-2.5 bg-primary text-white rounded-full hover:bg-primary-hover transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            )}

            {showReportPopup && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs text-center border border-gray-100">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">Report Chat?</h4>
                        <p className="text-gray-500 mb-6 text-xs">Flag this conversation for admin review.</p>

                        <div className="flex gap-2">
                            <button onClick={() => setShowReportPopup(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleReport} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 shadow-lg shadow-red-100 transition">
                                Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBox;
