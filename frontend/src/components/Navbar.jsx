import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, PlusCircle, User, MessageCircle, Shield } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        if (!user) return;

        // Reset badge on chat page open
        if (location.pathname === '/chat') {
            setUnreadCount(0);
        }

        const token = localStorage.getItem('token');
        const newSocket = io(SOCKET_BASE_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            auth: { token }
        });

        newSocket.on('receive_message', () => {
            // Only increment when not on the chat page to act like a background notification
            if (location.pathname !== '/chat') {
                setUnreadCount(prev => prev + 1);
            }
        });

        return () => newSocket.disconnect();
    }, [user, location.pathname]);

    return (
        <nav className="bg-blue-600 border-b border-blue-500 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-1 sm:gap-2 group">
                        <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                            <GraduationCap className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-white tracking-tight">UniMarket</span>
                    </Link>

                    {/* Right Side Actions */}
                    {user ? (
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link
                                to="/chat"
                                className="relative p-1.5 sm:p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition"
                                title="Messages"
                            >
                                <MessageCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-blue-600">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>

                            {user.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-1 sm:gap-2 bg-red-500/90 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-600 transition font-medium text-[11px] sm:text-sm ml-1 sm:ml-2 shadow-sm"
                                    title="Admin Dashboard"
                                >
                                    <Shield size={16} className="sm:hidden" />
                                    <Shield size={18} className="hidden sm:block" />
                                    <span className="hidden sm:inline">Admin</span>
                                </Link>
                            )}

                            <Link
                                to="/sell"
                                className="flex items-center gap-1 sm:gap-2 bg-white text-blue-600 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-50 transition font-medium text-xs sm:text-sm shadow-sm whitespace-nowrap"
                            >
                                <PlusCircle size={16} className="sm:hidden" />
                                <PlusCircle size={18} className="hidden sm:block" />
                                <span>Sell Product</span>
                            </Link>

                            <div className="flex items-center gap-2 sm:gap-3 border-l border-blue-400 pl-2 sm:pl-4 ml-1 sm:ml-2">
                                <Link to={`/profile/${user.id}`} className="flex flex-col text-right hidden sm:block hover:opacity-90">
                                    <span className="text-sm font-semibold text-white">{user.name}</span>
                                    <span className="text-xs text-blue-200">{user.email}</span>
                                </Link>
                                <Link to={`/profile/${user.id}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/50 rounded-full flex items-center justify-center border border-blue-400 text-white hover:border-white transition overflow-hidden shrink-0">
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </Link>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="text-blue-200 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-red-500/80 transition"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 sm:gap-3">
                            <Link to="/login" className="px-3 sm:px-4 py-1.5 sm:py-2 text-white hover:text-blue-100 font-medium transition text-sm sm:text-base">Login</Link>
                            <Link to="/signup" className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition shadow-sm text-sm sm:text-base">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
