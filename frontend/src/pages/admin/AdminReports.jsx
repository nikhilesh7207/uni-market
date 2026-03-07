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
            setReports(reports.map(r => r._id === reportId ? { ...r, status: 'Resolved' } : r));
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

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.reportedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reportedUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reportReason?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Chat Reports</h1>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search reports..."
                        className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow text-slate-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Report Details</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Participants</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </td>
                                </tr>
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <tr key={report._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${report.status === 'Resolved' ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                report.status === 'Reviewed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 text-sm line-clamp-2 max-w-xs" title={report.reportReason}>
                                                "{report.reportReason}"
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                By: <span className="font-semibold">{report.reportedBy?.name || 'Unknown'}</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {report.chat ? (
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
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {report.chat && (
                                                    <button
                                                        onClick={() => setSelectedChatId(report.chat._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Chat"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                )}
                                                {report.status !== 'Resolved' && (
                                                    <button
                                                        onClick={() => markResolved(report._id)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Mark Resolved"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {report.chat && (
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
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
