import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, AlertTriangle, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL } from '../config';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    // Reporting State
    const [showReportPopup, setShowReportPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products`);
                setProducts(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', 'Books', 'Electronics', 'Stationary', 'Other'];

    const handleReportProduct = async () => {
        if (!reportReason.trim()) return alert('Please provide a reason');
        try {
            await axios.post(`${API_BASE_URL}/api/products/${selectedProduct._id}/report`, { reason: reportReason }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            alert('Product reported successfully');
            setShowReportPopup(false);
            setReportReason('');
            setSelectedProduct(null);
        } catch (err) {
            console.error(err);
            alert('Failed to report product');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Search & Filter Header */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96 md:max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onReportClick={() => {
                                    setSelectedProduct(product);
                                    setShowReportPopup(true);
                                }}
                                onEditClick={() => navigate('/sell', { state: { product } })}
                                onDeleteClick={async () => {
                                    if (window.confirm('Delete this product?')) {
                                        try {
                                            await axios.delete(`${API_BASE_URL}/api/products/${product._id}`);
                                            setProducts(products.filter(p => p._id !== product._id));
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-gray-400 mb-4">
                            <Search size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">No products found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
                    </div>
                )}
            </div>

            {/* Report Popup (Global) */}
            {showReportPopup && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Report "{selectedProduct.name}"?</h4>
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
                                onClick={() => { setShowReportPopup(false); setReportReason(''); }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReportProduct}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;

