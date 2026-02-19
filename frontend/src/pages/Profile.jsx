import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, Mail, BookOpen, Calendar, MessageSquare, Edit, Trash2, Save, X, ArrowLeft, Home, Camera, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    // Edit Form State
    const [formData, setFormData] = useState({
        department: '',
        year: '',
        bio: '',
        contactPreference: 'Chat Only'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`${API_BASE_URL}/api/auth/profile/${id}`);
                setProfileUser(userRes.data);
                setFormData({
                    department: userRes.data.department || '',
                    year: userRes.data.year || '',
                    bio: userRes.data.bio || '',
                    contactPreference: userRes.data.contactPreference || 'Chat Only'
                });

                const productsRes = await axios.get(`${API_BASE_URL}/api/products/user/${id}`);
                setProducts(productsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const handleUpdateProfile = async () => {
        try {
            const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, formData);
            setProfileUser(prev => ({ ...prev, ...res.data }));
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePic', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/upload-profile-pic`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfileUser(prev => ({ ...prev, profilePic: res.data.profilePic }));

            if (currentUser && currentUser.id === profileUser._id) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${productId}`);
            setProducts(products.filter(p => p._id !== productId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (!profileUser) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">User not found</div>;

    const isOwner = currentUser && (currentUser._id === profileUser._id || currentUser.id === profileUser._id);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Navigation Actions */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium transition"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Home size={18} /> Home
                    </button>
                </div>

                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="bg-white p-1 rounded-full relative group">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl font-bold border-4 border-white overflow-hidden relative">
                                    {profileUser.profilePic ? (
                                        <img src={profileUser.profilePic} alt={profileUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{profileUser.name.charAt(0)}</span>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader className="animate-spin text-white" size={24} />
                                        </div>
                                    )}
                                </div>
                                {isOwner && (
                                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-hover transition shadow-sm border-2 border-white">
                                        <Camera size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            {isOwner && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                                >
                                    <Edit size={16} /> Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Department</label>
                                    <input
                                        className="input-field"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Computer Science"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Year</label>
                                    <input
                                        className="input-field"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        placeholder="e.g. 2nd Year"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bio</label>
                                    <textarea
                                        className="input-field"
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleUpdateProfile} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
                                        <Save size={16} /> Save
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-700 flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">
                                        <X size={16} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail size={16} />
                                    <span>{profileUser.email}</span>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                                    <div className="flex items-center gap-1">
                                        <BookOpen size={16} />
                                        <span>{profileUser.department || 'No Dept'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={16} />
                                        <span>{profileUser.year || 'No Year'}</span>
                                    </div>
                                </div>
                                {profileUser.bio && (
                                    <p className="text-gray-600 mt-4 max-w-2xl bg-gray-50 p-4 rounded-lg text-sm border border-gray-100">
                                        {profileUser.bio}
                                    </p>
                                )}
                                {!isOwner && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-400 mt-2">Preferred Contact: {profileUser.contactPreference}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Products */}
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BookOpen className="text-primary" />
                    {isOwner ? 'My Listings' : `${profileUser.name.split(' ')[0]}'s Listings`}
                </h2>

                {products.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No products listed yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="h-48 bg-gray-200 relative overflow-hidden">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                                            ₹{product.price}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{product.description}</p>

                                    {isOwner ? (
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                                            {/* Edit Button - Placeholder for future logic */}
                                            <button className="flex-1 bg-gray-100 text-gray-700 text-xs py-2 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product._id)}
                                                className="flex-1 bg-red-50 text-red-600 text-xs py-2 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/product/${product._id}`)}
                                            className="w-full btn-secondary text-xs py-2 rounded"
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
