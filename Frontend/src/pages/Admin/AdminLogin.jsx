import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, Lock, UserPlus, KeyRound, ArrowLeft, Smartphone, Mail } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';
import Seo from '../../utils/seo';

const AdminLogin = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const navigate = useNavigate();

    // First-time setup detection: if no admin account exists in the DB yet,
    // automatically show the "Create Admin Account" (register) form.
    useEffect(() => {
        api.get('/api/auth/admin/check-setup')
            .then(res => {
                if (res.data && res.data.configured === false) {
                    setMode('register');
                }
            })
            .catch(() => {
                // If the check fails (backend offline), default to login mode.
                setMode('login');
            });
    }, []);

    // ---------- LOGIN ----------
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setSuccessMsg('');
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/admin/login', { email, password });
            localStorage.setItem('adminInfo', JSON.stringify(data));
            navigate('/admin');
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // ---------- REGISTER (first-time setup) ----------
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError('');
        setSuccessMsg('');
        if (!email || !mobile || !password) {
            setLoginError('Please fill in email, mobile number and password.');
            return;
        }
        if (password.length < 6) {
            setLoginError('Password must be at least 6 characters.');
            return;
        }
        if (!/^\d{10}$/.test(mobile)) {
            setLoginError('Please enter a valid 10-digit mobile number.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/admin/register', { email, mobile, password });
            localStorage.setItem('adminInfo', JSON.stringify(data));
            setSuccessMsg('Admin account created! Logging you in...');
            setTimeout(() => navigate('/admin'), 800);
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ---------- FORGOT PASSWORD ----------
    const handleSendOtp = async () => {
        setLoginError('');
        setSuccessMsg('');
        if (!/^\d{10}$/.test(mobile)) {
            setLoginError('Please enter the 10-digit admin mobile number.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/admin/forgot-password', { mobile });
            setOtpSent(true);
            setSuccessMsg(data.message || 'OTP sent to your mobile. Check the server console.');
            // DEV-ONLY convenience: log the OTP to the browser console so the
            // admin can see it without opening the backend terminal.
            console.log(
                '%c [ADMIN OTP] Your OTP for ' + mobile + ' is: ' + (data.devOtp || '(not returned in production)'),
                'background: #222; color: #FF8F00; font-weight: bold; font-size: 14px;'
            );
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Failed to send OTP. Please check the mobile number.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoginError('');
        setSuccessMsg('');
        if (!otp || !newPassword) {
            setLoginError('Please enter the OTP and your new password.');
            return;
        }
        if (newPassword.length < 6) {
            setLoginError('New password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/admin/reset-password', { mobile, otp, newPassword });
            setSuccessMsg(data.message || 'Password reset successful! Please login.');
            setOtpSent(false);
            setMode('login');
            setPassword('');
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Password reset failed. Please check your OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <Seo noindex title="Admin Login" description="Restricted admin access – Janaki Sky Innovations." path="/admin/login" />
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-login-icon">
                        <Shield size={32} />
                    </div>
                    <h2>Admin Portal</h2>
                    <p>
                        {mode === 'login' && 'Enter your credentials to access the control center'}
                        {mode === 'register' && 'First-time setup — create your admin account'}
                        {mode === 'forgot' && 'Reset your admin password via OTP'}
                    </p>
                </div>

                {loginError && (
                    <div className="error-banner" style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {loginError}
                    </div>
                )}
                {successMsg && (
                    <div className="success-banner" style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {successMsg}
                    </div>
                )}

                {/* ============ LOGIN MODE ============ */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="admin-login-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@janakisky.in"
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <button type="submit" className="primary-btn login-submit-btn" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Lock size={18} />}
                            Secure Login
                        </button>
                        <div className="admin-login-links">
                            <span onClick={() => { setMode('forgot'); setLoginError(''); setSuccessMsg(''); }} className="link-btn">
                                <KeyRound size={14} /> Forgot Password?
                            </span>
                            <span onClick={() => { setMode('register'); setLoginError(''); setSuccessMsg(''); }} className="link-btn">
                                <UserPlus size={14} /> First time? Create Admin Account
                            </span>
                        </div>
                    </form>
                )}

                {/* ============ REGISTER MODE ============ */}
                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="admin-login-form">
                        <div className="input-group">
                            <label><Mail size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@janakisky.in"
                            />
                        </div>
                        <div className="input-group">
                            <label><Smartphone size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Mobile Number</label>
                            <input
                                type="tel"
                                required
                                maxLength={10}
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="10-digit mobile number"
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <button type="submit" className="primary-btn login-submit-btn" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
                            Create Admin Account
                        </button>
                        <div className="admin-login-links">
                            <span onClick={() => { setMode('login'); setLoginError(''); setSuccessMsg(''); }} className="link-btn">
                                <ArrowLeft size={14} /> Back to Login
                            </span>
                        </div>
                    </form>
                )}


                {/* ============ FORGOT PASSWORD MODE ============ */}
                {mode === 'forgot' && (
                    <div className="admin-login-form">
                        <div className="input-group">
                            <label><Smartphone size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Registered Mobile Number</label>
                            <input
                                type="tel"
                                required
                                maxLength={10}
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="10-digit mobile number"
                                disabled={otpSent}
                            />
                        </div>

                        {!otpSent ? (
                            <button onClick={handleSendOtp} className="primary-btn login-submit-btn" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                                {loading ? <Loader2 size={18} className="spin" /> : <KeyRound size={18} />}
                                Send OTP
                            </button>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <div className="input-group">
                                    <label>Enter OTP</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="6-digit OTP (check server console)"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <button type="submit" className="primary-btn login-submit-btn" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                                    {loading ? <Loader2 size={18} className="spin" /> : <Lock size={18} />}
                                    Reset Password
                                </button>
                            </form>
                        )}

                        <div className="admin-login-links">
                            <span onClick={() => { setMode('login'); setOtpSent(false); setOtp(''); setNewPassword(''); setLoginError(''); setSuccessMsg(''); }} className="link-btn">
                                <ArrowLeft size={14} /> Back to Login
                            </span>
                        </div>
                    </div>
                )}

                <div className="admin-login-footer">
                    <p onClick={() => navigate('/')}>&larr; Back to Storefront</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

