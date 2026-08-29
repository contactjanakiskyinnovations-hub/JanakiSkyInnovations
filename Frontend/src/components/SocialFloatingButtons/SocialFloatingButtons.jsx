import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Mail, MessageSquare } from 'lucide-react';
import WhatsappIcon from '../icons/WhatsappIcon';
import api from '../../utils/api';
import './SocialFloatingButtons.css';

const DEFAULT_CONTACT_ICONS = [
    { platform: 'Messenger', iconName: 'MessageCircle', url: 'https://m.me/janakiskyinnovations', isActive: true },
    { platform: 'WhatsApp', iconName: 'WhatsApp', url: 'https://wa.me/917742228345?text=Hi!%20I%20need%20some%20assistance%20with%20Janaki%20Sky%20Innovations.', isActive: true }
];

const SocialFloatingButtons = () => {
    const [contactIcons, setContactIcons] = useState(DEFAULT_CONTACT_ICONS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContactIcons = async () => {
            try {
                const { data } = await api.get('/api/cms');
                const icons = data?.contactIcons;
                if (Array.isArray(icons) && icons.length > 0) {
                    setContactIcons(icons);
                } else {
                    setContactIcons(DEFAULT_CONTACT_ICONS);
                }
            } catch (error) {
                console.error('Failed to fetch contact icons:', error);
                setContactIcons(DEFAULT_CONTACT_ICONS);
            } finally {
                setLoading(false);
            }
        };
        fetchContactIcons();
    }, []);

    if (loading) {
        return null;
    }

    const activeIcons = (contactIcons || []).filter(item => item.isActive !== false && item.url);

    if (activeIcons.length === 0) {
        return null;
    }

    const renderIcon = (contact) => {
        const icon = contact.iconName || '';
        const platform = (contact.platform || '').toLowerCase();

        if (icon === 'WhatsApp' || platform.includes('whatsapp')) {
            return <WhatsappIcon size={26} />;
        }
        if (icon === 'MessageCircle' || platform.includes('messenger')) {
            return <MessageCircle size={26} />;
        }
        if (icon === 'Phone' || platform.includes('phone')) {
            return <Phone size={22} />;
        }
        if (icon === 'Mail' || platform.includes('mail') || platform.includes('email')) {
            return <Mail size={22} />;
        }
        return <MessageSquare size={22} />;
    };

    const getButtonClass = (contact) => {
        const icon = contact.iconName || '';
        const platform = (contact.platform || '').toLowerCase();

        if (icon === 'WhatsApp' || platform.includes('whatsapp')) {
            return 'social-btn whatsapp-btn';
        }
        if (icon === 'MessageCircle' || platform.includes('messenger')) {
            return 'social-btn messenger-btn';
        }
        if (icon === 'Phone' || platform.includes('phone')) {
            return 'social-btn phone-btn';
        }
        if (icon === 'Mail' || platform.includes('mail')) {
            return 'social-btn mail-btn';
        }
        return 'social-btn custom-contact-btn';
    };

    const handleClick = (contact) => {
        if (!contact.url) return;
        let url = contact.url.trim();
        // If it's a pure phone number entered by admin, format as wa.me or tel:
        if (/^\+?\d{7,15}$/.test(url)) {
            const cleanNum = url.replace(/\D/g, '');
            if (contact.iconName === 'Phone') {
                url = `tel:${url}`;
            } else {
                url = `https://wa.me/${cleanNum}`;
            }
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="social-floating-container">
            {activeIcons.map((contact, idx) => (
                <button 
                    key={idx}
                    className={getButtonClass(contact)}
                    onClick={() => handleClick(contact)}
                    title={`Contact us on ${contact.platform || 'Chat'}`}
                    aria-label={`Contact us on ${contact.platform || 'Chat'}`}
                >
                    <div className="social-icon-wrapper">
                        {renderIcon(contact)}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default SocialFloatingButtons;

