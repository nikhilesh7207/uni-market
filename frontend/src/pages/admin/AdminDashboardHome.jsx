import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { Users, Package, ShoppingCart, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            setCount(Math.floor(progress * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const StatCard = ({ title, value, icon: Icon, colorClass, prefix = '' }) => (
    <div className="bg-white p-6 rounded-[16px] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 ease-in-out border border-slate-100 group">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {prefix}<AnimatedCounter value={value || 0} />
                </h3>
            </div>
            <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10`}>
                <Icon size={28} className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const AdminDashboardHome = () => {
    const [data, setData] = useState({
        overview: { totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 },
        recentActivity: [],
        charts: { monthlyRevenue: [], userGrowth: [] }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
                    headers: { 'x-auth-token': token }
                });
                setData(res.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const formatChartData = (chartData) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return chartData.map(item => ({
            name: `${months[item._id.month - 1]}`,
            value: item.revenue || item.users
        }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={data.overview.totalUsers} icon={Users} colorClass="bg-blue-600 text-blue-600" />
                <StatCard title="Total Products" value={data.overview.totalProducts} icon={Package} colorClass="bg-indigo-600 text-indigo-600" />
                <StatCard title="Total Orders" value={data.overview.totalOrders} icon={ShoppingCart} colorClass="bg-emerald-600 text-emerald-600" />
                <StatCard title="Total Revenue" value={data.overview.totalRevenue} prefix="₹" icon={DollarSign} colorClass="bg-violet-600 text-violet-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[16px] shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 ease-in-out border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue Overview</h2>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formatChartData(data.charts.monthlyRevenue)}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-[16px] shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 ease-in-out border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                        <Activity className="text-slate-400" size={20} />
                    </div>

                    <div className="space-y-6 overflow-y-auto max-h-72 pr-2 custom-scrollbar">
                        {data.recentActivity.length > 0 ? (
                            data.recentActivity.map((activity, index) => (
                                <div key={index} className="flex gap-4 relative">
                                    {/* Timeline Line */}
                                    {index !== data.recentActivity.length - 1 && (
                                        <div className="absolute top-8 left-4 w-px h-full bg-slate-200 -ml-px"></div>
                                    )}

                                    <div className="relative z-10 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex flex-shrink-0 items-center justify-center ring-4 ring-white">
                                        {activity.adminId?.profilePic ? (
                                            <img src={activity.adminId.profilePic} className="w-full h-full rounded-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-xs font-bold">{activity.adminId?.name?.charAt(0) || 'A'}</span>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {activity.action}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {activity.details}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 py-8">
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHome;
