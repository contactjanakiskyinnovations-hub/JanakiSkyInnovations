import React, { useState, useEffect } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Linkedin, Github } from 'lucide-react';
import api from '../../utils/api';
import './Footer.css';

const Footer = () => {
    const [cmsData, setCmsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFooterData = async () => {
            try {
                const { data } = await api.get('/api/cms');
                setCmsData(data);
            } catch (error) {
                console.error('Failed to fetch footer data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFooterData();
    }, []);

    if (loading) {
        return (
            <footer className="main-footer">
                <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
                    <p style={{ color: '#64748b' }}>Loading...</p>
                </div>
            </footer>
        );
    }

    const footer = cmsData?.footer || {};
    const socialMediaIcons = cmsData?.socialMediaIcons || [];
    const paymentMethods = footer.paymentMethods || ['VISA', 'MasterCard', 'UPI', 'Rupay'];

    const getSocialIcon = (iconName) => {
        const iconMap = {
            'Facebook': Facebook,
            'Twitter': Twitter,
            'Instagram': Instagram,
            'Youtube': Youtube,
            'Linkedin': Linkedin,
            'Github': Github
        };
        const IconComponent = iconMap[iconName] || Facebook;
        return <IconComponent size={20} />;
    };

    return (
        <footer className="main-footer">
            <div className="container footer-content">
                <div className="footer-col about">
                    <h2 className="footer-logo">{footer.companyName || 'Janaki Sky Innovations'}<span>.NP</span></h2>
                    <p>{footer.tagline || 'Nepal\'s Biggest Robotics, DIY & Engineering Online Store.'}</p>

                    <div className="footer-contact-info">
                        {footer.address && (
                            <div className="contact-item">
                                <MapPin size={20} />
                                <p>{footer.address}</p>
                            </div>
                        )}
                        {footer.phone && (
                            <div className="contact-item">
                                <Phone size={20} />
                                <p>{footer.phone}</p>
                            </div>
                        )}
                        {footer.email && (
                            <div className="contact-item">
                                <Mail size={20} />
                                <p>{footer.email}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="footer-col links">
                    <h4>Customer Service</h4>
                    <ul>
                        {(footer.customerServiceLinks || []).map((link, i) => (
                            <li key={i}>
                                <a href={link.href || '#'}>{link.label}</a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="footer-col contact">
                    {footer.newsletterEnabled !== false && (
                        <div className="newsletter-section">
                            <h4>{footer.newsletterTitle || 'NEWSLETTER'}</h4>
                            <p>{footer.newsletterDescription || 'Don\'t miss any updates or promotions by signing up to our newsletter.'}</p>
                            <div className="newsletter-input-group">
                                <input type="email" placeholder="Your email" />
                                <button className="newsletter-btn">
                                    <Mail size={18} /> SEND
                                </button>
                            </div>
                        </div>
                    )}

                    {socialMediaIcons.length > 0 && (
                        <div className="social-links">
                            {socialMediaIcons.filter(icon => icon.isActive !== false).map((social, i) => (
                                <a key={i} href={social.url || '#'} target="_blank" rel="noopener noreferrer" title={social.platform}>
                                    {getSocialIcon(social.iconName)}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    <p>{footer.copyrightText || '© 2026 Janaki Sky Innovations - All Rights Reserved.'}</p>
                    <p className="developer-credit">
                        Developed By{' '}
                        <a href="https://www.dipendrakumaryadav.com.np/" target="_blank" rel="noopener noreferrer">Dipendra</a>
                    </p>
                    <div className="payment-icons">
                        {paymentMethods.map((method, i) => (
                            <span key={i} className="payment-badge">{method}</span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
