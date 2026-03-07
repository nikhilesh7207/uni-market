import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Shield, AlertTriangle, UserX, Trash2, CheckCircle, Users, Package, MessageSquare, Search } from 'lucide-react';
import { API_BASE_URL } from '../config';

import AdminChatModal from '../components/AdminChatModal';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('reports'); // reports, products, users
    const [reports, setReports] = useState([]);
    const [reportedProducts, setReportedProducts] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChatId, setSelectedChatId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (user?.role === 'admin' && token) {
            axios.defaults.headers.common['x-auth-token'] = token;
            fetchData();
        }
    }, [user, activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'reports') {
                const res = await axios.get(`${API_BASE_URL}/api/admin/reports`);
                setReports(res.data);
            } else if (activeTab === 'products') {
                const res = await axios.get(`${API_BASE_URL}/api/admin/products/reported`);
                setReportedProducts(res.data);
            } else if (activeTab === 'users') {
                const res = await axios.get(`${API_BASE_URL}/api/admin/users`);
                setUsersList(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlockUser = async (userId) => {
        if (!window.confirm("Are you sure you want to block/unblock this user?")) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/block/${userId}`);
            alert(res.data.msg);
            fetchData(); // Refresh
        } catch (err) {
            console.error(err);
            alert("Failed to update user status");
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Permanently delete this product?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/product/${productId}`);
            alert("Product deleted");
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete product");
        }
    };

    // Filter logic
    const filterData = (data) => {
        if (!searchTerm) return data;
        return data.filter(item =>
            JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <Shield size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
                    <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-xl text-red-600">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
                            <p className="text-gray-500">Moderation & Management</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition whitespace-nowrap ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <MessageSquare size={18} /> Chat Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition whitespace-nowrap ${activeTab === 'products' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Package size={18} /> Product Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition whitespace-nowrap ${activeTab === 'users' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Users size={18} /> User Management
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-2"></div>
                            Loading data...
                        </div>
                    ) : (
                        <>
                            {/* REPORTS TAB */}
                            {activeTab === 'reports' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Reported By</th>
                                                <th className="px-6 py-4">Reason</th>
                                                <th className="px-6 py-4">Participants</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filterData(reports).map(report => (
                                                <tr key={report._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                            report.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {report.reportedBy?.name || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{report.reportReason}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {report.chat?.participants?.map(p => p.name).join(', ') || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                console.log("View Chat Clicked. Report Chat Obj:", report.chat);
                                                                console.log("Passing Chat ID:", report.chat?._id);
                                                                if (report.chat?._id) {
                                                                    setSelectedChatId(report.chat._id);
                                                                } else {
                                                                    alert("Chat data not found for this report.");
                                                                }
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3"
                                                        >
                                                            View Chat
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {reports.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                                        No reported chats found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* PRODUCTS TAB */}
                            {activeTab === 'products' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">Seller</th>
                                                <th className="px-6 py-4">Reports</th>
                                                <th className="px-6 py-4">Latest Reason</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filterData(reportedProducts).map(prod => (
                                                <tr key={prod._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={prod.images?.[0] || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded object-cover" alt="" />
                                                            <span className="font-medium text-gray-900">{prod.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{prod.seller?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                                                            {prod.reports?.length || 0} Flags
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {prod.reports?.[0]?.reason || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteProduct(prod._id)}
                                                            className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {reportedProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                                        No reported products found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* USERS TAB */}
                            {activeTab === 'users' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filterData(usersList).map(u => (
                                                <tr key={u._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        {u.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.isBlocked ? (
                                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                                                                <UserX size={12} /> Blocked
                                                            </span>
                                                        ) : (
                                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                                                                <CheckCircle size={12} /> Active
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {u.role !== 'admin' && (
                                                            <button
                                                                onClick={() => handleBlockUser(u._id)}
                                                                className={`text-sm font-bold px-3 py-1.5 rounded transition ${u.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                                            >
                                                                {u.isBlocked ? 'Unblock' : 'Block'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* FULL CHAT MODAL */}
            {selectedChatId && (
                <AdminChatModal chatId={selectedChatId} onClose={() => setSelectedChatId(null)} />
            )}
        </div>
    );
};

export default AdminDashboard;
