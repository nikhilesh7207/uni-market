import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, MessageSquare, MessageSquareWarning, BarChart2, Shield } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/analytics', name: 'Analytics', icon: BarChart2 },
        { path: '/admin/users', name: 'Users', icon: Users },
        { path: '/admin/products', name: 'Products', icon: Package },
        { path: '/admin/reports', name: 'General Reports', icon: MessageSquare },
        { path: '/admin/reported-chats', name: 'Reported Chats', icon: MessageSquareWarning }
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col h-screen fixed relative left-0 shadow-sm transition-colors duration-300 z-10">
            {/* Brand / Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <Shield className="text-blue-600 mr-2" size={24} />
                <span className="text-xl font-bold text-slate-900">
                    Admin Portal
                </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
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

            {/* Bottom Footer Area (optional) */}
            <div className="p-4 border-t border-slate-100 text-xs text-center text-slate-500">
                &copy; {new Date().getFullYear()} UniMarket
            </div>
        </aside>
    );
};

export default Sidebar;
