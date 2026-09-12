import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheck, 
    Zap, 
    Headphones, 
    Award, 
    Compass, 
    Target, 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    ArrowRight, 
    Loader2, 
    Users, 
    Cpu, 
    Plane, 
    Calendar,
    CheckCircle2
} from 'lucide-react';
import api from '../../utils/api';
import Seo from '../../utils/seo';
import './AboutStore.css';

const DEFAULT_ABOUT = {
    title: 'About Janaki Sky Innovations',
    subtitle: 'Pioneering Drone Tech & Advanced Engineering Solutions across South Asia',
    story: 'Founded with a passion for robotics, aviation, and aerospace engineering, Janaki Sky Innovations is your premier destination for UAV technology, high-precision drone components, DIY robotics supplies, and specialized commercial flight solutions. We serve hobbyists, agricultural innovators, researchers, and professional aerial photographers across India and Nepal.\n\nFrom advanced agriculture spraying multirotors to high-speed FPV racing gear, flight controllers, ESCs, motors, and smart sensors, we ensure every product in our catalog meets stringent quality and performance benchmarks.',
    mission: 'To empower creators, agricultural pioneers, and tech enthusiasts with authentic, high-performance drone hardware, verified engineering parts, and personalized technical support.',
    vision: 'To be the leading unmanned systems and robotics ecosystem in South Asia, bridging cutting-edge aerospace advancements with accessible, reliable hardware.',
    bannerImage: '',
    storeImage: '',
    features: [
        {
            icon: 'ShieldCheck',
            title: '100% Genuine Components',
            description: 'All UAV flight controllers, motors, ESCs, and batteries are sourced directly from verified manufacturers.'
        },
        {
            icon: 'Zap',
            title: 'Fast & Secure Dispatch',
            description: 'Precision-packed sensitive electronics delivered swiftly and safely right to your workshop or field.'
        },
        {
            icon: 'Headphones',
            title: 'Expert Technical Support',
            description: 'Our team of aerospace and robotics engineers is available to help you build, tune, and fly.'
        },
        {
            icon: 'Award',
            title: 'Custom UAV Solutions',
            description: 'Specialized agricultural spraying drones, surveillance systems, and industrial inspection rigs.'
        }
    ],
    stats: [
        { label: 'Active Pilots & Builders', value: '10,000+' },
        { label: 'Drone & Robotics Parts', value: '5,000+' },
        { label: 'Custom Drones Delivered', value: '500+' },
        { label: 'Years of Engineering', value: '5+' }
    ]
};

const getFeatureIcon = (iconName) => {
    switch (iconName) {
        case 'Zap': return <Zap size={24} />;
        case 'Headphones': return <Headphones size={24} />;
        case 'Award': return <Award size={24} />;
        case 'Compass': return <Compass size={24} />;
        case 'Target': return <Target size={24} />;
        case 'Users': return <Users size={24} />;
        case 'Cpu': return <Cpu size={24} />;
        case 'Plane': return <Plane size={24} />;
        case 'ShieldCheck':
        default:
            return <ShieldCheck size={24} />;
    }
};

const getStatIcon = (index) => {
    const icons = [<Users size={22} />, <Cpu size={22} />, <Plane size={22} />, <Calendar size={22} />];
    return icons[index % icons.length];
};

const AboutStore = () => {
    const [aboutData, setAboutData] = useState(DEFAULT_ABOUT);
    const [footerContact, setFooterContact] = useState({
        address: '123 Innovation Street, Campus Chowk, Dhanusha, India - 46800',
        phone: '+91 7742228345',
        email: 'support@janakiskyinnovations.com'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCmsData = async () => {
            try {
                const { data } = await api.get('/api/cms');
                if (data?.aboutStore) {
                    setAboutData({
                        ...DEFAULT_ABOUT,
                        ...data.aboutStore,
                        features: (data.aboutStore.features && data.aboutStore.features.length > 0)
                            ? data.aboutStore.features
                            : DEFAULT_ABOUT.features,
                        stats: (data.aboutStore.stats && data.aboutStore.stats.length > 0)
                            ? data.aboutStore.stats
                            : DEFAULT_ABOUT.stats
                    });
                }
                if (data?.footer) {
                    setFooterContact({
                        address: data.footer.address || footerContact.address,
                        phone: data.footer.phone || footerContact.phone,
                        email: data.footer.email || footerContact.email
                    });
                }
            } catch (err) {
                console.error('Error loading about store details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCmsData();
    }, []);

    if (loading) {
        return (
            <div className="about-loading">
                <Loader2 size={36} className="spin" />
                <p>Loading Store Details...</p>
            </div>
        );
    }

    return (
        <div className="about-store-page">
            <Seo 
                title={`${aboutData.title || 'About Us'} | Janaki Sky Innovations`} 
                description={aboutData.subtitle || 'Learn more about Janaki Sky Innovations, our mission, vision, and custom drone engineering.'} 
                path="/about" 
            />

            {/* Hero Banner */}
            <section 
                className="about-hero" 
                style={aboutData.bannerImage ? { backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url(${aboutData.bannerImage})` } : {}}
            >
                <div className="container">
                    <div className="about-hero-content">
                        <span className="about-hero-badge">
                            <Plane size={16} /> Official Store & UAV Hub
                        </span>
                        <h1 className="about-hero-title">{aboutData.title}</h1>
                        <p className="about-hero-subtitle">{aboutData.subtitle}</p>
                        <div className="about-hero-actions">
                            <Link to="/all-categories" className="btn-primary-about">
                                Explore Store Catalog <ArrowRight size={18} />
                            </Link>
                            <Link to="/services" className="btn-secondary-about">
                                Our UAV Services
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Stats Strip */}
            {aboutData.stats && aboutData.stats.length > 0 && (
                <section className="about-stats-section">
                    <div className="container">
                        <div className="about-stats-grid">
                            {aboutData.stats.map((stat, idx) => (
                                <div key={idx} className="about-stat-card">
                                    <div className="stat-icon-wrapper">
                                        {getStatIcon(idx)}
                                    </div>
                                    <div className="stat-text-wrapper">
                                        <h3 className="stat-value">{stat.value}</h3>
                                        <p className="stat-label">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Story & Showcase Section */}
            <section className="about-story-section">
                <div className="container">
                    <div className="about-story-grid">
                        <div className="story-content">
                            <span className="section-eyebrow">OUR STORY</span>
                            <h2 className="section-heading">Dedicated to the Future of Aerial Robotics</h2>
                            <div className="story-paragraphs">
                                {(aboutData.story || '').split('\n\n').map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>
                            <div className="story-highlights">
                                <div className="highlight-item">
                                    <CheckCircle2 size={18} className="highlight-check" />
                                    <span>Verified suppliers & rigorous pre-dispatch testing</span>
                                </div>
                                <div className="highlight-item">
                                    <CheckCircle2 size={18} className="highlight-check" />
                                    <span>Engineering consulting for agriculture, FPV, and industrial UAVs</span>
                                </div>
                                <div className="highlight-item">
                                    <CheckCircle2 size={18} className="highlight-check" />
                                    <span>Pan-India and Nepal delivery with real-time tracking</span>
                                </div>
                            </div>
                        </div>

                        <div className="story-visual">
                            {aboutData.storeImage ? (
                                <div className="store-image-card">
                                    <img src={aboutData.storeImage} alt="Janaki Sky Innovations Storefront" className="store-img" />
                                </div>
                            ) : (
                                <div className="store-visual-placeholder">
                                    <div className="visual-circle-accent"></div>
                                    <div className="visual-badge">
                                        <Plane size={32} />
                                        <h4>Janaki Sky Innovations</h4>
                                        <p>Engineering UAV Hub & Robotics</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision Cards */}
            <section className="about-mission-section">
                <div className="container">
                    <div className="mission-vision-grid">
                        <div className="mv-card mission-card">
                            <div className="mv-header">
                                <div className="mv-icon-box">
                                    <Target size={28} />
                                </div>
                                <h3>Our Mission</h3>
                            </div>
                            <p>{aboutData.mission}</p>
                        </div>

                        <div className="mv-card vision-card">
                            <div className="mv-header">
                                <div className="mv-icon-box">
                                    <Compass size={28} />
                                </div>
                                <h3>Our Vision</h3>
                            </div>
                            <p>{aboutData.vision}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features / Guarantees */}
            {aboutData.features && aboutData.features.length > 0 && (
                <section className="about-features-section">
                    <div className="container">
                        <div className="section-header-center">
                            <span className="section-eyebrow">WHY CHOOSE US</span>
                            <h2 className="section-heading">Built for Builders, Pilots & Innovators</h2>
                            <p className="section-subtext">Everything you need to take flight with confidence and precision.</p>
                        </div>

                        <div className="about-features-grid">
                            {aboutData.features.map((feat, idx) => (
                                <div key={idx} className="about-feature-card">
                                    <div className="feature-icon-container">
                                        {getFeatureIcon(feat.icon)}
                                    </div>
                                    <h4 className="feature-title">{feat.title}</h4>
                                    <p className="feature-desc">{feat.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact & Store Location Info */}
            <section className="about-contact-strip">
                <div className="container">
                    <div className="about-contact-card">
                        <div className="contact-card-info">
                            <span className="section-eyebrow light">VISIT & CONNECT</span>
                            <h3>Need Assistance with Your Project?</h3>
                            <p>Our team is ready to help with component compatibility, custom builds, and bulk orders.</p>
                            
                            <div className="contact-details-grid">
                                {footerContact.address && (
                                    <div className="contact-detail-item">
                                        <MapPin size={18} />
                                        <span>{footerContact.address}</span>
                                    </div>
                                )}
                                {footerContact.phone && (
                                    <div className="contact-detail-item">
                                        <Phone size={18} />
                                        <span>{footerContact.phone}</span>
                                    </div>
                                )}
                                {footerContact.email && (
                                    <div className="contact-detail-item">
                                        <Mail size={18} />
                                        <span>{footerContact.email}</span>
                                    </div>
                                )}
                                <div className="contact-detail-item">
                                    <Clock size={18} />
                                    <span>Mon - Sat: 9:30 AM - 6:30 PM</span>
                                </div>
                            </div>
                        </div>
                        <div className="contact-card-cta">
                            <Link to="/services" className="btn-white-about">
                                Request UAV Service
                            </Link>
                            <a href={`https://wa.me/917742228345?text=Hi!%20I%20have%20a%20question%20about%20your%20store.`} target="_blank" rel="noopener noreferrer" className="btn-outline-about">
                                Chat on WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutStore;
