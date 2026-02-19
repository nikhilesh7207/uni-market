import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, PlusCircle, User, MessageCircle, Shield } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 border-b border-blue-500 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                            <GraduationCap className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">UniMarket</span>
                    </Link>

                    {/* Right Side Actions */}
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link
                                to="/chat"
                                className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-full transition"
                                title="Messages"
                            >
                                <MessageCircle size={22} />
                            </Link>

                            {user.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="hidden md:flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm ml-2 shadow-sm"
                                    title="Admin Dashboard"
                                >
                                    <Shield size={18} />
                                    <span>Admin</span>
                                </Link>
                            )}

                            <Link
                                to="/sell"
                                className="hidden md:flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium text-sm shadow-sm"
                            >
                                <PlusCircle size={18} />
                                <span>Sell Product</span>
                            </Link>

                            <div className="flex items-center gap-3 border-l border-blue-400 pl-4 ml-2">
                                <Link to={`/profile/${user.id}`} className="flex flex-col text-right hidden sm:block hover:opacity-90">
                                    <span className="text-sm font-semibold text-white">{user.name}</span>
                                    <span className="text-xs text-blue-200">{user.email}</span>
                                </Link>
                                <Link to={`/profile/${user.id}`} className="w-10 h-10 bg-blue-500/50 rounded-full flex items-center justify-center border border-blue-400 text-white hover:border-white transition overflow-hidden">
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </Link>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="text-blue-200 hover:text-white p-2 rounded-full hover:bg-red-500/80 transition"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Link to="/login" className="px-4 py-2 text-white hover:text-blue-100 font-medium transition">Login</Link>
                            <Link to="/signup" className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition shadow-sm">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
