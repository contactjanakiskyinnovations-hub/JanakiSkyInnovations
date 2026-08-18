import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Hammer, MapPin, Wind, Sparkles, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import './OurServices.css';
import Seo, { buildServiceCategorySchema } from '../../utils/seo';

const iconMapping = {
    'Shield': <Shield size={28} />,
    'Hammer': <Hammer size={28} />,
    'MapPin': <MapPin size={28} />,
    'Wind': <Wind size={28} />,
    'Sparkles': <Sparkles size={28} />,
};

const OurServices = () => {
    const [searchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [fallbackServices, setFallbackServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlug, setSelectedSlug] = useState(searchParams.get('category') || '');
    const [formCategory, setFormCategory] = useState('');
    const [formService, setFormService] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Build effective categories (fallback to flat services as "All Services")
    const effectiveCategories = useMemo(() => {
        if (categories.length > 0) return categories;
        if (fallbackServices.length > 0) {
            return [{ name: 'All Services', slug: 'all', description: '', iconName: 'Shield', services: fallbackServices }];
        }
        return [];
    }, [categories, fallbackServices]);

    // Determine the currently displayed category
    const currentCategory = effectiveCategories.find(c => c.slug === selectedSlug) || effectiveCategories[0] || null;

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/api/cms');
                setCategories(data?.serviceCategories || []);
                setFallbackServices(data?.services || []);
            } catch (err) {
                console.error('Failed to fetch CMS services:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Sync selected category from URL and preselect in the form
    useEffect(() => {
        if (effectiveCategories.length === 0) return;
        const param = searchParams.get('category');
        const target = effectiveCategories.find(c => c.slug === param) || effectiveCategories[0];
        if (target) {
            setSelectedSlug(target.slug);
            setFormCategory(target.name);
            setFormService('');
        }
    }, [effectiveCategories, searchParams]);

    // Services belonging to the form's selected category
    const formCatObj = effectiveCategories.find(c => c.name === formCategory);
    const formCatServices = formCatObj ? formCatObj.services || [] : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formCategory) {
            alert('Please select a service category');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/api/service-requests', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                category: formCategory,
                service: formService,
                message: formData.message,
            });
            setSubmitted(true);
            setFormData({ name: '', email: '', phone: '', message: '' });
            setFormService('');
        } catch (err) {
            console.error('Failed to submit service request:', err);
            alert(err.response?.data?.message || 'Failed to submit enquiry. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '100px', textAlign: 'center' }}><Loader2 className="spin" size={40} color="var(--primary-orange)" /></div>;
    }

    return (
        <div className="services-page">
            <Seo
                title={currentCategory ? `${currentCategory.name} Services – Drone & Robotics Solutions` : 'Our Services – Drone & Robotics Solutions'}
                description={currentCategory?.description || "Professional drone and robotics services including aerial surveys, agriculture spraying, inspection, training and custom builds by Janaki Sky Innovations."}
                path={currentCategory?.slug ? `/services?category=${currentCategory.slug}` : '/services'}
                jsonLd={currentCategory ? buildServiceCategorySchema(currentCategory) : null}
            />
            {/* Hero Section */}
            <div className="services-hero">
                <div className="hero-overlay"></div>
                <div className="container hero-content">
                    <span className="badge">Professional Solutions</span>
                    <h1>Advanced Aerial Services</h1>
                    <p>Elevating industrial and celebratory capabilities through precision robotics, drone engineering, and mapping solutions.</p>
                </div>
            </div>

            <div className="container py-60">
                {/* Services Grid */}
                <div className="section-header-center">
                    <h2>{currentCategory ? `${currentCategory.name} Services` : 'Our Service Offerings'}</h2>
                    <p>
                        {currentCategory?.description
                            ? currentCategory.description
                            : 'High-end technical expertise paired with state-of-the-art drone fleets to guarantee unmatched performance.'}
                    </p>
                </div>

                {currentCategory && currentCategory.services && currentCategory.services.length > 0 ? (
                    <div className="services-grid">
                        {currentCategory.services.map((service, idx) => (
                            <div
                                key={idx}
                                className={`service-card shadow-sm${service.image ? ' with-bg' : ''}`}
                                style={service.image ? { '--bg-image': `url(${service.image})` } : undefined}
                            >
                                <div className="service-icon-box">
                                    {iconMapping[service.iconName] || <Shield size={28} />}
                                </div>
                                <h3>{service.title}</h3>
                                <p className="service-desc">{service.description}</p>
                                <ul className="service-features">
                                    {(service.features || []).map((feat, fIdx) => (
                                        <li key={fIdx}>
                                            <Shield size={14} className="shield-icon" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="section-header-center">
                        <p>No services available yet. Please check back soon.</p>
                    </div>
                )}

                {/* Enquiry & Booking Section */}
                <div className="booking-row">
                    <div className="booking-info">
                        <h2>Need a custom solution or live flight booking?</h2>
                        <p>Our expert licensed pilots and system engineers are ready to build, calibrate, and deploy advanced drone payloads to fit your unique operations.</p>
                        
                        <div className="info-points">
                            <div className="point-item">
                                <CheckCircle size={20} />
                                <div>
                                    <h4>Certified Operations</h4>
                                    <p>Strict adherence to DGCA guidelines and safety standards.</p>
                                </div>
                            </div>
                            <div className="point-item">
                                <CheckCircle size={20} />
                                <div>
                                    <h4>Experienced Pilots</h4>
                                    <p>Over 10,000 combined flight hours across industrial mapping and spraying.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="booking-form-card shadow-lg">
                        <h3>Book a Service Consultation</h3>
                        <p>Fill out the form and our representative will contact you in under 24 hours.</p>

                        {submitted ? (
                            <div className="success-enquiry">
                                <CheckCircle size={48} className="success-icon" />
                                <h4>Enquiry Successfully Submitted!</h4>
                                <p>Thank you for reaching out to Janaki Sky Innovations. Our system engineers are reviewing your specifications and will get in touch shortly.</p>
                                <button className="primary-btn mt-20" onClick={() => setSubmitted(false)}>Send Another Enquiry</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="enquiry-form">
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Deep Yadav" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input 
                                            type="email" 
                                            required 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="deep@example.com" 
                                        />
                                    </div>
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Mobile Number</label>
                                        <input 
                                            type="tel" 
                                            required 
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="+91 98765 43210" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Service Category</label>
                                        <select
                                            value={formCategory}
                                            onChange={(e) => { setFormCategory(e.target.value); setFormService(''); }}
                                        >
                                            {effectiveCategories.length === 0 && <option value="">Select category</option>}
                                            {effectiveCategories.map((cat, idx) => (
                                                <option key={idx} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Interested Service</label>
                                    <select
                                        value={formService}
                                        onChange={(e) => setFormService(e.target.value)}
                                        required={formCatServices.length > 0}
                                    >
                                        <option value="">
                                            {formCatServices.length > 0 ? 'Select a service...' : 'No services available for this category'}
                                        </option>
                                        {formCatServices.map((svc, idx) => (
                                            <option key={idx} value={svc.title}>{svc.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Message / Specifications</label>
                                    <textarea 
                                        required 
                                        value={formData.message} 
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        placeholder="Describe your drone requirements, timeline, or site details..."
                                        rows={4}
                                    />
                                </div>
                                <button type="submit" className="primary-btn submit-enquiry-btn" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span>Submit Enquiry</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OurServices;
