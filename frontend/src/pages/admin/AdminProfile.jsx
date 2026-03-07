import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Camera, Save, Lock, Activity, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AdminProfile = () => {
    const { user, login } = useAuth(); // We can re-use login to update the user context
    const [profileData, setProfileData] = useState({ name: '', email: '', profilePic: '' });
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                profilePic: user.profilePic || ''
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
                    headers: { 'x-auth-token': token }
                });
                setActivityLogs(res.data.recentActivity || []);
            } catch (err) {
                console.error("Failed to load activity logs", err);
            } finally {
                setLoadingLogs(false);
            }
        };
        fetchLogs();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/admin/profile`, profileData, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Profile updated successfully!");
            // Update auth context
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            login(updatedUser, token); // Ensure context updates without full reload
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to update profile");
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("New passwords do not match!");
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/admin/password`, {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            }, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Password changed successfully!");
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.msg || "Failed to change password");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Profile Update & Password */}
                <div className="lg:col-span-2 space-y-6">

                    {/* General Settings */}
                    <div className="bg-white p-6 rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-blue-600" size={24} />
                            <h2 className="text-lg font-bold text-slate-900">General Information</h2>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-5">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative group">
                                    {profileData.profilePic ? (
                                        <img src={profileData.profilePic} className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-50" alt="Profile" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold ring-4 ring-white shadow-sm">
                                            {profileData.name?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image URL</label>
                                    <input
                                        type="text"
                                        value={profileData.profilePic || ''}
                                        onChange={e => setProfileData({ ...profileData, profilePic: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 transition shadow-sm"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileData.name}
                                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 transition shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={profileData.email}
                                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 transition shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all font-medium">
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white p-6 rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="text-blue-600" size={24} />
                            <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.currentPassword}
                                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 transition shadow-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 transition shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        value={passwords.confirmPassword}
                                        onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 transition shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 shadow-lg shadow-slate-200 dark:shadow-none transition-all font-medium">
                                    <Lock size={18} /> Update Password
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* Right Column: Activity Log */}
                <div className="bg-white p-6 rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 flex flex-col h-[800px]">
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                        <Activity className="text-blue-600" size={24} />
                        <h2 className="text-lg font-bold text-slate-900">Your Activity Log</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                        {loadingLogs ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : activityLogs.length > 0 ? (
                            activityLogs.map((activity, index) => (
                                <div key={index} className="flex gap-4 relative group">
                                    {/* Timeline Line */}
                                    {index !== activityLogs.length - 1 && (
                                        <div className="absolute top-8 left-3.5 w-[2px] h-[calc(100%+16px)] bg-slate-200 transition-colors"></div>
                                    )}

                                    <div className="relative z-10 w-7 h-7 rounded-full bg-blue-50 border-2 border-white text-blue-600 flex flex-shrink-0 items-center justify-center mt-1 shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                    </div>

                                    <div className="bg-white p-3 rounded-xl flex-1 border border-slate-100 group-hover:border-blue-100 group-hover:shadow-sm transition">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {activity.action}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {activity.details}
                                        </p>
                                        <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <Activity className="mx-auto mb-3 opacity-20" size={48} />
                                <p>No recent activity found.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminProfile;
