import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, MessageSquare, MessageSquareWarning, BarChart2, Shield, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const navItems = [
        { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/analytics', name: 'Analytics', icon: BarChart2 },
        { path: '/admin/users', name: 'Users', icon: Users },
        { path: '/admin/products', name: 'Products', icon: Package },
        { path: '/admin/reports', name: 'General Reports', icon: MessageSquare },
        { path: '/admin/reported-chats', name: 'Reported Chats', icon: MessageSquareWarning }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-100 flex flex-col shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Brand / Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    <div className="flex items-center">
                        <Shield className="text-blue-600 mr-2" size={24} />
                        <span className="text-xl font-bold text-slate-900">
                            Admin Portal
                        </span>
                    </div>
                    {/* Close Button (Mobile Only) */}
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)} // Close sidebar on mobile after clicking a link
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1'
                                    }`
                                }
                            >
                                <Icon size={20} className="transition-transform group-hover:scale-110" />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Bottom Footer Area */}
                <div className="p-4 border-t border-slate-100 text-xs text-center text-slate-500">
                    &copy; {new Date().getFullYear()} UniMarket
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
