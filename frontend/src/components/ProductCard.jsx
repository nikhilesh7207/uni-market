import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, onReportClick, onEditClick, onDeleteClick, isOwner }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Determine if the current user is the owner if isOwner prop isn't explicitly passed
    // But rely on props mostly for flexibility
    const showOwnerActions = isOwner || (user && (user._id === product.seller?._id || user.id === product.seller?._id));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col h-full">
            {/* Image Section */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        No Image
                    </div>
                )}

                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm">
                    {product.category}
                </span>

                {!showOwnerActions && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onReportClick && onReportClick(); }}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                        title="Report"
                    >
                        <AlertTriangle size={16} />
                    </button>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 line-clamp-1 flex-1" title={product.name}>
                        {product.name}
                    </h3>
                    <span className="text-primary font-extrabold bg-primary/5 px-2 py-0.5 rounded-lg ml-2">
                        ₹{product.price}
                    </span>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                    {product.description}
                </p>

                {/* Footer / Actions */}
                <div className="mt-auto pt-3 border-t border-gray-50 flex gap-2">
                    {showOwnerActions ? (
                        <>
                            <button
                                onClick={onEditClick}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 text-gray-600 font-medium text-sm hover:bg-gray-100 transition"
                            >
                                <Edit size={16} /> Edit
                            </button>
                            <button
                                onClick={onDeleteClick}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-500 font-medium text-sm hover:bg-red-100 transition"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate(`/product/${product._id}`)}
                            className="w-full py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={16} /> View Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
