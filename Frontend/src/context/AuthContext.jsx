import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const getInitialUser = () => {
        const savedUser = localStorage.getItem('userInfo');
        return savedUser ? JSON.parse(savedUser) : null;
    };

    const [user, setUser] = useState(getInitialUser);
    const [isLoggedIn, setIsLoggedIn] = useState(!!getInitialUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (emailOrUser, password) => {
        setLoading(true);
        setError(null);
        try {
            let payload;
            if (emailOrUser && typeof emailOrUser === 'object' && emailOrUser.mobile) {
                payload = { mobile: emailOrUser.mobile };
            } else {
                payload = { email: emailOrUser, password };
            }
            const { data } = await api.post('/api/auth/login', payload);
            setUser(data);
            setIsLoggedIn(true);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (err) {
            const errorObj = new Error(err.response?.data?.message || 'Login failed');
            errorObj.status = err.response?.status;
            setError(errorObj.message);
            throw errorObj;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/api/auth/register', userData);
            setUser(data);
            setIsLoggedIn(true);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (err) {
            const errorObj = new Error(err.response?.data?.message || 'Registration failed');
            errorObj.status = err.response?.status;
            setError(errorObj.message);
            throw errorObj;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('userInfo');
    };

    const updateUser = async (updates) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.put('/api/auth/profile', updates);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            throw new Error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Fetch the latest user profile (name, email, mobile, address) from the backend
    // and sync it into context + localStorage. Called on account/cart page mount so the
    // "Default Address" (and any other profile data saved in MongoDB) is always fresh.
    // NOTE: The /api/auth/profile endpoint does NOT return the JWT token, so we must
    // preserve the existing token to avoid wiping it from localStorage (which would
    // break subsequent authenticated requests like POST /api/orders).
    const refreshProfile = async () => {
        if (!user) return null;
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/api/auth/profile');
            const updatedUser = { ...data, token: user.token };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to refresh profile');
            throw new Error(err.response?.data?.message || 'Failed to refresh profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, logout, register, updateUser, refreshProfile, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
