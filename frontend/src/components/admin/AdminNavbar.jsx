import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Menu, Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { SOCKET_BASE_URL, API_BASE_URL } from '../../config';

const AdminNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [pendingReports, setPendingReports] = useState(0);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const fetchPending = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/reported-chats`, {
                    headers: { 'x-auth-token': token }
                });
                const pending = res.data.filter(r => r.status === 'pending');
                setPendingReports(pending.length);
            } catch (err) {
                console.error("Failed to load reported chats count", err);
            }
        };
        fetchPending();

        const token = localStorage.getItem('token');
        const adminSocket = io(SOCKET_BASE_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            auth: { token }
        });

        adminSocket.on('new_reported_chat', () => {
            setPendingReports(prev => prev + 1);
        });

        return () => adminSocket.disconnect();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 transition-colors duration-300">
            {/* Mobile Menu Toggle (stub for future logic) */}
            <div className="flex items-center md:hidden">
                <button className="p-2 text-gray-500 hover:text-blue-600 rounded-lg focus:outline-none">
                    <Menu size={24} />
                </button>
            </div>

            {/* Title (Mobile only) */}
            <div className="md:hidden flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Admin
                </span>
            </div>

            {/* Spacer for Desktop (Since Sidebar has the logo) */}
            <div className="hidden md:block flex-1"></div>

            {/* Right Profile & Actions */}
            <div className="flex items-center gap-4">
                {/* Switch to User Portal */}
                <Link
                    to="/"
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-full shadow-sm hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:shadow-md font-medium transition-all duration-300 border border-blue-100 hover:border-transparent group"
                    title="Switch to User Portal"
                >
                    <User size={16} className="text-blue-500 group-hover:text-white transition-colors" />
                    <span>User Portal</span>
                </Link>
                <Link
                    to="/"
                    className="sm:hidden flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-full shadow-sm hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:shadow-md transition-all duration-300 border border-blue-100 hover:border-transparent group"
                    title="Switch to User Portal"
                >
                    <User size={18} className="text-blue-500 group-hover:text-white transition-colors" />
                </Link>

                {/* Admin Notifications */}
                <Link to="/admin/reported-chats" className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center">
                    <Bell size={20} />
                    {pendingReports > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-white shadow-sm">
                            {pendingReports} New
                        </span>
                    ) : (
                        <span className="absolute -top-1 -right-2 bg-slate-600 text-white px-2 py-0.5 rounded-full text-[10px] font-medium border-2 border-white shadow-sm scale-90">
                            0 New
                        </span>
                    )}
                </Link>
                {/* Admin Profile Area */}
                <Link to="/admin/profile" className="flex items-center gap-3 group px-3 py-1.5 rounded-full hover:bg-slate-50 transition">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {user?.name || 'Admin'}
                        </p>
                        <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    {user?.profilePic ? (
                        <img
                            src={user.profilePic}
                            alt="Profile"
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-600 transition"
                        />
                    ) : (
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold ring-2 ring-transparent group-hover:ring-blue-600 transition">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    )}
                </Link>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    title="Log out"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default AdminNavbar;
