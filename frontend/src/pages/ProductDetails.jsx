import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ArrowLeft, Share2, Heart, MessageCircle, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [showReportPopup, setShowReportPopup] = useState(false);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProduct();
    }, [id]);

    const handleReportProduct = async () => {
        if (!reportReason.trim()) return alert('Please provide a reason');
        try {
            await axios.post(`${API_BASE_URL}/api/products/${product._id}/report`, { reason: reportReason }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            alert('Product reported successfully');
            setShowReportPopup(false);
            setReportReason('');
        } catch (err) {
            console.error(err);
            alert('Failed to report product');
        }
    };

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    const isOwner = user && (user._id === product.seller._id || user.id === product.seller._id);

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => {
                            if (user && user.role === 'admin') {
                                navigate('/admin/products');
                            } else {
                                navigate('/');
                            }
                        }}
                        className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-5 py-2.5 rounded-full shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md font-medium transition-all duration-300"
                    >
                        <ArrowLeft size={18} /> Back to Products
                    </button>
                    <Link to="/" className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-700 hover:bg-gray-50 transition">
                        Home
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Images */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <img
                                src={product.images[0] || 'https://via.placeholder.com/800x600'}
                                alt={product.name}
                                className="w-full h-[400px] sm:h-[500px] object-cover"
                            />
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {product.category}
                                    </span>
                                    <h1 className="text-3xl font-bold text-gray-900 mt-2 leading-tight">{product.name}</h1>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                                        <Heart size={20} />
                                    </button>
                                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary transition">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-4xl font-extrabold text-gray-900">₹{product.price}</span>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                            </div>

                            <Link to={`/profile/${product.seller._id}`} className="mt-6 flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                    {product.seller.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{product.seller.name}</p>
                                    <p className="text-sm text-gray-500">Seller • Joined 2024</p>
                                </div>
                            </Link>

                            {!isOwner && user && (
                                <div className="mt-6 space-y-3">
                                    <button
                                        onClick={async () => {
                                            if (!user) {
                                                navigate('/login');
                                                return;
                                            }
                                            try {
                                                const res = await axios.post(`${API_BASE_URL}/api/chat/start`, {
                                                    productId: product._id,
                                                    sellerId: product.seller._id
                                                });
                                                navigate('/chat', { state: { chatId: res.data._id } });
                                            } catch (err) {
                                                console.error("Failed to start chat", err);
                                            }
                                        }}
                                        className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <MessageCircle size={24} />
                                        Contact Seller
                                    </button>

                                    <button
                                        onClick={() => setShowReportPopup(true)}
                                        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                    >
                                        <AlertTriangle size={18} />
                                        Report Product
                                    </button>
                                </div>
                            )}

                            {isOwner && (
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => navigate('/sell', { state: { product } })}
                                        className="flex-1 py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition"
                                    >
                                        Edit Product
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to delete this product?')) {
                                                try {
                                                    await axios.delete(`${API_BASE_URL}/api/products/${product._id}`);
                                                    navigate('/');
                                                } catch (err) {
                                                    console.error("Failed to delete", err);
                                                    alert('Failed to delete product');
                                                }
                                            }
                                        }}
                                        className="flex-1 py-3 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 hover:border-red-200 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Popup */}
            {showReportPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Report Product?</h4>
                        <p className="text-gray-500 mb-4 text-sm">
                            Please provide a reason for flagging this item.
                        </p>

                        <textarea
                            className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            placeholder="Reason (e.g. Fake item, abusive content)..."
                            rows="3"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        ></textarea>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReportPopup(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReportProduct}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
