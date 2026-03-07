import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import toast from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Eye, Package } from 'lucide-react';
import { format } from 'date-fns';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    // View Details Modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 pointer-events-auto';
            case 'Processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Shipped': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/orders`, {
                headers: { 'x-auth-token': token }
            });
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to load orders", err);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/admin/order/${orderId}/status`, { status: newStatus }, {
                headers: { 'x-auth-token': token }
            });
            toast.success(`Order status updated to ${newStatus}`);
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const viewDetails = (order) => {
        setSelectedOrder(order);
        setDetailsModalOpen(true);
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order._id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Management</h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders, customers..."
                            className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow text-slate-900"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            className="pl-4 pr-8 py-2 w-full sm:w-auto bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none text-slate-900"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="All">All Statuses</option>
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
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
                            ) : currentOrders.length > 0 ? (
                                currentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-medium text-slate-900">{order.customer?.name || 'Unknown User'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                                            ₹{order.totalAmount?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full outline-none cursor-pointer appearance-none ${getStatusColor(order.status)} border border-transparent hover:border-current transition-colors`}
                                            >
                                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => viewDetails(order)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {detailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white p-6 rounded-[16px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border outline-none border-slate-100">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">#{selectedOrder._id}</p>
                            </div>
                            <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Customer Info</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-800 dark:text-gray-200">Name:</span> {selectedOrder.customer?.name || 'N/A'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-800 dark:text-gray-200">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2"><span className="font-medium text-gray-800 dark:text-gray-200">Shipping:</span><br />{selectedOrder.shippingAddress || 'No address provided'}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Order Info</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-800 dark:text-gray-200">Date:</span> {format(new Date(selectedOrder.createdAt), 'PPP p')}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2"><span className="font-medium text-gray-800 dark:text-gray-200">Status:</span></p>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                                    className={`w-full text-sm font-bold px-3 py-2 rounded-lg outline-none cursor-pointer appearance-none ${getStatusColor(selectedOrder.status)}`}
                                >
                                    {statusOptions.map(s => <option key={s} value={s} className="bg-white text-gray-900">{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Products ({selectedOrder.products?.length || 0})</h4>
                            <div className="space-y-3">
                                {selectedOrder.products?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 border border-gray-100 dark:border-slate-700 rounded-xl">
                                        {item.product?.images?.[0] ? (
                                            <img src={item.product.images[0]} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400">
                                                <Package size={24} />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{item.product?.name || 'Deleted Product'}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">₹{(item.priceAtPurchase * item.quantity).toFixed(2) || '0.00'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">₹{item.priceAtPurchase?.toFixed(2)} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-4 flex justify-between items-center">
                            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
