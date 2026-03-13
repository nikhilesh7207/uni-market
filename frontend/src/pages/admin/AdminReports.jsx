import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import toast from 'react-hot-toast';
import { CheckCircle, Search, Trash2, Eye, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import AdminChatModal from '@/components/AdminChatModal';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [filterType, setFilterType] = useState('All');

    // Chat Modal
    const [selectedChatId, setSelectedChatId] = useState(null);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/reports`, {
                headers: { 'x-auth-token': token }
            });
            setReports(res.data);
        } catch (err) {
            console.error("Failed to load reports", err);
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const markResolved = async (reportId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/admin/report/${reportId}/resolve`, {}, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Report marked as resolved");
            setReports(reports.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
        } catch (err) {
            console.error(err);
            toast.error("Failed to resolve report");
        }
    };

    const deleteChatAndResolve = async (chatId, reportId) => {
        if (!window.confirm("Are you sure you want to permanently delete this chat? This will resolve all associated reports.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/chat/${chatId}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Chat deleted successfully");
            fetchReports(); // Refresh all to reflect deleted chat and resolved reports
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete chat");
        }
    };

    const deleteProductAndResolve = async (productId, reportId) => {
        if (!window.confirm("Are you sure you want to permanently delete this product? This will resolve all associated reports.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/product/${productId}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Product deleted successfully");
            fetchReports();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete product");
        }
    };

    const filteredReports = reports.filter(r => {
        const term = searchTerm.toLowerCase();
        
        // Robust search matching with null checks
        const matchesSearch = !term || [
            r.reporter?.name,
            r.reporter?.email,
            r.reportedUser?.name,
            r.reportType,
            r.product?.name,
            r.reason,
            r.description,
            r.status
        ].some(val => val?.toString().toLowerCase().includes(term));

        const matchesType = filterType === 'All' ? true :
            filterType === 'Products' ? r.reportType === 'product' : r.reportType === 'chat';
            
        // Hide resolved reports where the target (product/chat) has been removed
        const isTargetRemoved = (r.reportType === 'product' && !r.product) || 
                               (r.reportType === 'chat' && !r.chat);
        const shouldHide = r.status === 'resolved' && isTargetRemoved;

        return matchesSearch && matchesType && !shouldHide;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">General Reports</h1>
                    <p className="text-sm text-slate-500">Review and resolve issues reported by the community.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="pl-10 pr-4 py-2 w-full md:w-64 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Type Filter Buttons */}
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        {['All', 'Products', 'Chats'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === type
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Report Details</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Participants / Product Info</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </td>
                                </tr>
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <tr key={report._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${report.status === 'resolved' ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold shadow-sm ${report.status === 'resolved' ? 'bg-emerald-600 text-white' :
                                                report.status === 'reviewed' ? 'bg-blue-600 text-white' :
                                                    'bg-red-600 text-white'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${report.reportType === 'product' ? 'bg-purple-600 text-white' : 'bg-orange-600 text-white'}`}>
                                                {report.reportType === 'product' ? 'Product' : 'Chat'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 text-sm line-clamp-2 max-w-xs" title={report.reason}>
                                                "{report.reason}"
                                            </p>
                                            {report.description && (
                                                <p className="text-xs text-slate-600 mt-1 italic line-clamp-1">{report.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                By: <span className="font-semibold">{report.reporter?.name || 'Unknown'}</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {report.reportType === 'product' ? (
                                                report.product ? (
                                                    <div className="flex items-center gap-3">
                                                        {report.product.images?.[0] ? (
                                                            <img src={report.product.images[0]} className="w-10 h-10 rounded object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <Eye size={16} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{report.product.name}</p>
                                                            <p className="text-xs text-slate-500">₹{report.product.price}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-red-500 italic">Product Removed</span>
                                                )
                                            ) : (
                                                report.chat ? (
                                                    <div className="flex -space-x-2">
                                                        {report.chat.participants?.map(p => (
                                                            p.profilePic ? (
                                                                <img key={p._id} src={p.profilePic} className="w-8 h-8 rounded-full border-2 border-white" title={p.name} alt={p.name} />
                                                            ) : (
                                                                <div key={p._id} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold" title={p.name}>
                                                                    {p.name?.charAt(0)}
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">Chat Deleted</span>
                                                )
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {report.reportType === 'chat' && report.chat && (
                                                    <button
                                                        onClick={() => setSelectedChatId(report.chat._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Chat"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                )}
                                                {report.reportType === 'product' && report.product && (
                                                    <button
                                                        onClick={() => deleteProductAndResolve(report.product._id, report._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                                {report.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => markResolved(report._id)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Mark Resolved"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {report.reportType === 'chat' && report.chat && (
                                                    <button
                                                        onClick={() => deleteChatAndResolve(report.chat._id, report._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Chat"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No reports found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FULL CHAT MODAL */}
            {selectedChatId && (
                <AdminChatModal chatId={selectedChatId} onClose={() => setSelectedChatId(null)} />
            )}
        </div>
    );
};

export default AdminReports;
