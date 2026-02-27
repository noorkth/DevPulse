import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../common/Loading';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'manager' | 'developer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role guard: if a specific role is required, check it
    if (requiredRole && user?.role !== requiredRole) {
        // Redirect non-managers to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
