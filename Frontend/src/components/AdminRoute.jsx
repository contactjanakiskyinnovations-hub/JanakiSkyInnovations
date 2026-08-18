import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const adminInfo = localStorage.getItem('adminInfo');

    if (!adminInfo) {
        return <Navigate to="/admin/login" replace />;
    }

    try {
        const admin = JSON.parse(adminInfo);
        if (!admin || admin.role !== 'admin') {
            return <Navigate to="/admin/login" replace />;
        }
    } catch (err) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminRoute;
