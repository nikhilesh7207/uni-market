import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminNavbar from './AdminNavbar';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

const AdminLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <Shield size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
                    <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans transition-colors duration-300">
            {/* Sidebar (left) */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Navbar */}
                <AdminNavbar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 transition-colors duration-300">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
