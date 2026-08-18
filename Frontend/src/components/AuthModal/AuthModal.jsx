import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, ShieldCheck, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
    const { login, register } = useAuth();
    const [step, setStep] = useState('mobile'); // 'mobile', 'otp', 'register'
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const cooldownRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setStep('mobile');
            setMobile('');
            setOtp(['', '', '', '']);
            setName('');
            setError('');
        }
    }, [isOpen]);

    const handleSendOtp = () => {
        if (mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate OTP Generation
        setTimeout(() => {
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            setGeneratedOtp(newOtp);
            // Log for testing as requested
            console.log(`%c [AUTH] Your OTP for ${mobile} is: ${newOtp} `, 'background: #222; color: #FF8F00; font-weight: bold; font-size: 14px;');
            setLoading(false);
            setStep('otp');
            startResendCooldown();
        }, 1200);
    };

    const startResendCooldown = () => {
        setResendCooldown(30);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOtp = () => {
        if (resendCooldown > 0) return;
        setOtp(['', '', '', '']);
        setError('');
        setLoading(true);
        setTimeout(() => {
            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            setGeneratedOtp(newOtp);
            console.log(`%c [AUTH] Resent OTP for ${mobile}: ${newOtp} `, 'background: #222; color: #FF8F00; font-weight: bold; font-size: 14px;');
            setLoading(false);
            startResendCooldown();
        }, 1000);
    };

    const handleVerifyOtp = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length !== 4) {
            setError('Please enter the 4-digit OTP');
            return;
        }

        if (enteredOtp !== generatedOtp) {
            setError('Invalid OTP. Please try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Check if the mobile number is already registered (returns 200, no console error)
            const { data } = await api.post('/api/auth/check-mobile', { mobile });
            if (data.exists) {
                // Existing user -> log them in
                console.log(`%c [AUTH] User found! Login successful! `, 'background: #222; color: #4CAF50;');
                await login({ mobile });
                onClose(); // Redirect them back to where they were by closing modal
            } else {
                // New user -> Move to registration step
                console.log('%c [AUTH] New user detected. Moving to registration... ', 'background: #222; color: #2196F3;');
                setStep('register');
            }
        } catch (err) {
            setError(err.message || 'Verification or Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (name.trim().length < 3) {
            setError('Please enter your full name');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const newUser = { mobile, name };
            const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
            if (!users.some(u => u.mobile === mobile)) {
                users.push({ ...newUser, id: Date.now() });
                localStorage.setItem('registered_users', JSON.stringify(users));
            }

            console.log(`%c [AUTH] Registration complete: ${name} `, 'background: #222; color: #4CAF50;');
            await register(newUser);
            onClose(); // Redirect to the app
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-container">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="auth-modal-content">
                    <div className="auth-header">
                        <div className="logo-mini">JS</div>
                        <h2>{step === 'mobile' ? 'Welcome to Janaki Sky' : step === 'otp' ? 'Verify OTP' : 'Complete Registration'}</h2>
                        <p>
                            {step === 'mobile' ? 'Sign in or Create an account using your mobile number' :
                                step === 'otp' ? `One Time Password sent to +91 ${mobile}` :
                                    'Just a few more details to get you started'}
                        </p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    {step === 'mobile' && (
                        <div className="auth-step-content">
                            <div className="input-group">
                                <label>Mobile Number</label>
                                <div className="input-wrapper">
                                    <span className="prefix">+91</span>
                                    <input
                                        type="tel"
                                        className="with-prefix"
                                        placeholder="Enter mobile number"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    />
                                    <Smartphone className="input-icon" size={20} />
                                </div>
                            </div>
                            <button
                                className="auth-btn-primary"
                                onClick={handleSendOtp}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="spinner" /> : 'GET OTP'}
                                {!loading && <ArrowRight size={20} />}
                            </button>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div className="auth-step-content">
                            <div className="otp-container">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        className="otp-input"
                                    />
                                ))}
                            </div>
                            <div className="resend-timer">
                                Didn't receive code?{' '}
                                <button
                                    className="text-btn"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0 || loading}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </div>
                            <button
                                className="auth-btn-primary"
                                onClick={handleVerifyOtp}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="spinner" /> : 'VERIFY & CONTINUE'}
                            </button>
                            <button className="back-btn" onClick={() => setStep('mobile')}>
                                Change Mobile Number
                            </button>
                        </div>
                    )}

                    {step === 'register' && (
                        <div className="auth-step-content">
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <UserPlus className="input-icon" size={20} />
                                </div>
                            </div>
                            <button
                                className="auth-btn-primary"
                                onClick={handleRegister}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="spinner" /> : 'CREATE ACCOUNT'}
                            </button>
                        </div>
                    )}

                    <div className="auth-footer">
                        <ShieldCheck size={16} />
                        <span>Your data is secured with end-to-end encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
