import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import WhatsappIcon from '../icons/WhatsappIcon';
import api from '../../utils/api';
import './SocialFloatingButtons.css';

const SocialFloatingButtons = () => {
    const { isLoggedIn, user } = useAuth();
    const [socialIcons, setSocialIcons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContactIcons = async () => {
            try {
                const { data } = await api.get('/api/cms');
                setSocialIcons(data?.contactIcons || []);
            } catch (error) {
                console.error('Failed to fetch contact icons:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContactIcons();
    }, []);

    const getWhatsAppNumber = () => {
        if (isLoggedIn && user && user.mobile) {
            return user.mobile.replace(/\D/g, '');
        }
        return '917742228345';
    };

    const handleWhatsAppClick = () => {
        const message = "Hi! I need some assistance with Janaki Sky Innovations.";
        window.open(`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleMessengerClick = () => {
        window.open('https://m.me/janakiskyinnovations', '_blank');
    };

    if (loading) {
        return (
            <div className="social-floating-container">
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTopColor: 'var(--primary-orange)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="social-floating-container">
            {/* Messenger Button - Always visible, hardcoded */}
            <button 
                className="social-btn messenger-btn" 
                onClick={handleMessengerClick}
                title="Contact us on Messenger"
            >
                <div className="social-icon-wrapper">
                    <MessageCircle size={24} />
                </div>
            </button>
            
            {/* WhatsApp Button - Always visible, hardcoded */}
            <button 
                className="social-btn whatsapp-btn" 
                onClick={handleWhatsAppClick}
                title="Contact us on WhatsApp"
            >
                <div className="social-icon-wrapper">
                    <WhatsappIcon />
                </div>
            </button>
        </div>
    );
};

export default SocialFloatingButtons;
