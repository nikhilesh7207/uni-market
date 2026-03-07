import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, SOCKET_BASE_URL } from '@/config';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { CheckCircle, Search, Trash2, ShieldAlert, UserX, X } from 'lucide-react';
import { format } from 'date-fns';

const AdminReportedChats = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/reported-chats`, {
                headers: { 'x-auth-token': token }
            });
            setReports(res.data);
        } catch (err) {
            console.error("Failed to load reported chats", err);
            toast.error("Failed to load reported chats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        const token = localStorage.getItem('token');
        const socket = io(SOCKET_BASE_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            auth: { token }
        });

        socket.on('new_reported_chat', (newReport) => {
            setReports(prev => [newReport, ...prev]);
        });

        return () => socket.disconnect();
    }, []);

    const markReviewed = async (reportId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/admin/reported-chats/${reportId}/review`, {}, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Report marked as reviewed");
            setReports(reports.map(r => r._id === reportId ? { ...r, status: 'reviewed' } : r));
        } catch (err) {
            console.error(err);
            toast.error("Failed to review report");
        }
    };

    const deleteReportedChat = async (reportId) => {
        if (!window.confirm("Delete this reported chat? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/reported-chats/${reportId}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Reported chat deleted");
            setReports((prev) => prev.filter(r => r._id !== reportId));
            if (selectedChat?._id === reportId) setSelectedChat(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete reported chat");
        }
    };

    const blockUser = async (userId) => {
        if (!window.confirm("Are you sure you want to toggle block status for this user?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/admin/block/${userId}`, {}, {
                headers: { 'x-auth-token': token }
            });
            toast.success(res.data.msg);
        } catch (err) {
            console.error(err);
            toast.error("Failed to Block/Unblock user");
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.reporterId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reportedUserId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Reported Chats</h1>

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
                            <tr className="bg-red-600 text-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Messages Count</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Reported Date</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                    </td>
                                </tr>
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <tr key={report._id} className={`hover:bg-slate-50 transition-colors ${report.status === 'reviewed' ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${report.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {report.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900">
                                                By: <span className="font-semibold text-blue-600">{report.reporterId?.name || 'Unknown'}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Reported: <span className="font-semibold text-red-600">{report.reportedUserId?.name || 'Unknown'}</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {report.chatHistory?.length || 0} Messages Captured
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(report.reportedAt), 'MMM dd, yyyy - hh:mm a')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedChat(report)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Full Chat Log"
                                                >
                                                    <ShieldAlert size={18} />
                                                </button>
                                                {report.status !== 'reviewed' && (
                                                    <button
                                                        onClick={() => markReviewed(report._id)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Mark Reviewed"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteReportedChat(report._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Report"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No reported chats found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FULL CHAT LOG VIEWER MODAL */}
            {selectedChat && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 sm:p-6 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">

                        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Chat Log Review</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Reported by <span className="font-semibold">{selectedChat.reporterId?.name}</span> against <span className="font-semibold text-red-600">{selectedChat.reportedUserId?.name}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => blockUser(selectedChat.reportedUserId?._id)}
                                    className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                                >
                                    <UserX size={16} /> Block Offender
                                </button>
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 space-y-4">
                            {selectedChat.chatHistory?.length > 0 ? (
                                selectedChat.chatHistory.map((msg, index) => {
                                    const isReporter = msg.sender?._id === selectedChat.reporterId?._id;

                                    return (
                                        <div key={index} className={`flex ${isReporter ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isReporter ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'}`}>
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className={`text-xs font-bold ${isReporter ? 'text-blue-100' : 'text-slate-500'}`}>
                                                        {msg.sender?.name || 'Unknown User'}
                                                    </span>
                                                    <span className={`text-[10px] ${isReporter ? 'text-blue-200' : 'text-slate-400'}`}>
                                                        {format(new Date(msg.time), 'hh:mm a')}
                                                    </span>
                                                </div>
                                                <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 italic py-8">No messages captured in this report.</p>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedChat(null)}
                                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
                            >
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportedChats;
