import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

// Pages Import
import LandingPage from '../pages/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Customer Pages
import CustomerDashboard from '../pages/customer/Dashboard';
import OrderRequest from '../pages/customer/OrderRequest';
import MyOrders from '../pages/customer/MyOrders';
import Addresses from '../pages/customer/Addresses';
import Profile from '../pages/customer/Profile';

// Retailer Pages
import RetailerDashboard from '../pages/retailer/Dashboard';
import Marketplace from '../pages/retailer/Marketplace';
import Inventory from '../pages/retailer/Inventory';
import RetailerAnalytics from '../pages/retailer/Analytics';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import Verification from '../pages/admin/Verification';
import UserManagement from '../pages/admin/Users';
import NotificationsPage from '../pages/NotificationsPage';

// Private Route Guard
interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'customer' | 'retailer' | 'admin'>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their default home page if not authorized
    if (user.role === 'retailer') {
      return <Navigate to="/retailer/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Public Route Guard (Redirect if logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'retailer') {
      return <Navigate to="/retailer/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Shared Protected Profile Page */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        }
      />

      {/* Customer Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/order-request"
        element={
          <PrivateRoute allowedRoles={['customer']}>
            <OrderRequest />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <PrivateRoute allowedRoles={['customer']}>
            <MyOrders />
          </PrivateRoute>
        }
      />
      <Route
        path="/addresses"
        element={
          <PrivateRoute allowedRoles={['customer']}>
            <Addresses />
          </PrivateRoute>
        }
      />

      {/* Retailer Protected Routes */}
      <Route
        path="/retailer/dashboard"
        element={
          <PrivateRoute allowedRoles={['retailer']}>
            <RetailerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/retailer/marketplace"
        element={
          <PrivateRoute allowedRoles={['retailer']}>
            <Marketplace />
          </PrivateRoute>
        }
      />
      <Route
        path="/retailer/inventory"
        element={
          <PrivateRoute allowedRoles={['retailer']}>
            <Inventory />
          </PrivateRoute>
        }
      />
      <Route
        path="/retailer/analytics"
        element={
          <PrivateRoute allowedRoles={['retailer']}>
            <RetailerAnalytics />
          </PrivateRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/verification"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <Verification />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <UserManagement />
          </PrivateRoute>
        }
      />

      {/* Fallback redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
