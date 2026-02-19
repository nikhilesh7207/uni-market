import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Upload, DollarSign, Tag, Type, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SellProduct = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const editProduct = location.state?.product;

    const isEditMode = location.state?.product; // Check if editing

    const [formData, setFormData] = useState({
        name: isEditMode?.name || '',
        description: isEditMode?.description || '',
        price: isEditMode?.price || '',
        category: isEditMode?.category || 'Electronics',
        images: isEditMode?.images || []
    });

    const [previewImages, setPreviewImages] = useState(isEditMode?.images || []);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const categories = ['Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, images: [...formData.images, ...files] });

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages([...previewImages, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData({ ...formData, images: newImages });

        const newPreviews = [...previewImages];
        newPreviews.splice(index, 1);
        setPreviewImages(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('category', formData.category);

        formData.images.forEach((image) => {
            if (typeof image === 'string') {
                data.append('existingImages', image); // Handle existing images in edit mode
            } else {
                data.append('images', image);
            }
        });

        const token = localStorage.getItem('token');

        try {
            if (isEditMode) {
                await axios.put(`${API_BASE_URL}/api/products/${isEditMode._id}`, data, {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert('Product Updated Successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/api/products/add`, data, {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert('Product Listed Successfully!');
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Failed to save product');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-8 bg-white border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Product' : 'List a New Product'}
                        </h2>
                        <p className="text-gray-500 mt-1">Fill in the details to sell your item</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Product Title</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. iPhone 14 Pro Max"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Price & Category Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <DollarSign size={16} /> Price (₹)
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                    <Tag size={16} /> Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <FileText size={16} /> Description
                            </label>
                            <textarea
                                name="description"
                                placeholder="Describe the condition, features, and reason for selling..."
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                required
                            ></textarea>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <ImageIcon size={16} /> Product Images
                            </label>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {/* Upload Button */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                >
                                    <Upload className="text-gray-400 group-hover:text-blue-500 mb-2" size={24} />
                                    <span className="text-xs text-gray-500 group-hover:text-blue-500 font-medium">Upload</span>
                                </div>

                                {/* Previews */}
                                {previewImages.map((src, index) => (
                                    <div key={index} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-200">
                                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="file"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="animate-spin" /> Publishing...
                                </>
                            ) : (
                                isEditMode ? 'Update Product' : 'Publish Listing'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellProduct;
