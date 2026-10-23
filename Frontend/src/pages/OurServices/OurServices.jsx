import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Hammer, MapPin, Wind, Sparkles, Send, CheckCircle, Loader2, ArrowRight, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { preserveHyphenatedText } from '../../utils/richText';
import './OurServices.css';
import Seo, { buildServiceCategorySchema } from '../../utils/seo';

const iconMapping = {
    'Shield': <Shield size={28} />,
    'Hammer': <Hammer size={28} />,
    'MapPin': <MapPin size={28} />,
    'Wind': <Wind size={28} />,
    'Sparkles': <Sparkles size={28} />,
};

// Fallback category catalog matching default home services
const DEFAULT_CATEGORIES = [
    {
        name: 'Agricultural Drones',
        slug: 'agricultural-drones',
        iconName: 'Wind',
        description: 'Automated precision crop spraying, multispectral orchard mapping, and pest control using heavy-payload multi-rotor UAV systems.',
        services: [
            {
                title: 'Industrial & Agricultural UAV Spraying',
                iconName: 'Wind',
                description: 'Automated precision crop spraying, multispectral orchard mapping, and pest control using heavy-payload multi-rotor UAV systems.',
                features: ['Up to 25L Payload Tanks', 'Autonomous GPS Waypoints', '98% Drift Reduction Tech'],
                image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop'
            }
        ]
    },
    {
        name: 'Events & Celebrations',
        slug: 'events-celebrations',
        iconName: 'Sparkles',
        description: 'Spectacular floral showers for grand celebrations, religious ceremonies, and cinematic 4K FPV aerial media capture.',
        services: [
            {
                title: 'Aerial Cinematography & Flower Showering',
                iconName: 'Sparkles',
                description: 'Spectacular floral showers for grand celebrations, religious ceremonies, and cinematic 4K FPV aerial media capture.',
                features: ['Automated Flower Dispersion Mechanism', 'Custom Height & Drop Scheduling', 'Redundant Safety Parachutes'],
                image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=2000&auto=format&fit=crop'
            }
        ]
    },
    {
        name: 'Engineering & DIY',
        slug: 'engineering-diy',
        iconName: 'Hammer',
        description: 'Bespoke carbon-fiber frame builds, brushless motor calibration, flight controller tuning, and institutional STEM lab kits.',
        services: [
            {
                title: 'Custom Drone Assembly & STEM Robotics',
                iconName: 'Hammer',
                description: 'Bespoke carbon-fiber frame builds, brushless motor calibration, flight controller tuning, and institutional STEM lab kits.',
                features: ['Precision CNC Carbon Fiber', 'Custom ESC & Firmware Flash', 'Complete Bench Testing & QA'],
                image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop'
            }
        ]
    },
    {
        name: 'Inspection & GIS',
        slug: 'inspection-gis',
        iconName: 'Shield',
        description: 'Thermal imaging, perimeter patrol, stockpile volume estimation, and high-accuracy LiDAR mapping for enterprise infrastructure.',
        services: [
            {
                title: 'Security, Surveillance & Mapping',
                iconName: 'Shield',
                description: 'Thermal imaging, perimeter patrol, stockpile volume estimation, and high-accuracy LiDAR mapping for enterprise infrastructure.',
                features: ['Dual Thermal & 4K Optical Gimbals', 'AES-256 Encrypted Telemetry', 'RTK Centimeter Accuracy'],
                image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop'
            }
        ]
    }
];

const normalize = (str) =>
    (str || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const findTargetCategory = (cats, catQuery, svcQuery) => {
    if (!cats || cats.length === 0) return null;

    // 1. If service query is given, prioritize finding the category that owns this service
    if (svcQuery) {
        const normSvc = normalize(svcQuery);
        const matchBySvc = cats.find(c =>
            (c.services || []).some(s =>
                s.title?.toLowerCase() === svcQuery.toLowerCase() ||
                normalize(s.title) === normSvc
            )
        );
        if (matchBySvc) return matchBySvc;
    }

    // 2. Match by category query (slug or name)
    if (catQuery) {
        const normCat = normalize(catQuery);
        const match = cats.find(c =>
            c.slug === catQuery ||
            normalize(c.slug) === normCat ||
            normalize(c.name) === normCat ||
            c.name?.toLowerCase() === catQuery.toLowerCase()
        );
        if (match) return match;
    }

    return cats[0] || null;
};

const OurServices = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [fallbackServices, setFallbackServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlug, setSelectedSlug] = useState('');
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

    // Build effective categories (fallback to flat services or default catalog)
    const effectiveCategories = useMemo(() => {
        if (categories && categories.length > 0) return categories;
        if (fallbackServices && fallbackServices.length > 0) {
            return [{ name: 'All Services', slug: 'all', description: '', iconName: 'Shield', services: fallbackServices }];
        }
        return DEFAULT_CATEGORIES;
    }, [categories, fallbackServices]);

    // Determine the currently displayed category
    const currentCategory = useMemo(() => {
        if (effectiveCategories.length === 0) return null;
        if (selectedSlug) {
            const found = effectiveCategories.find(c =>
                c.slug === selectedSlug ||
                normalize(c.slug) === normalize(selectedSlug) ||
                normalize(c.name) === normalize(selectedSlug) ||
                c.name === selectedSlug
            );
            if (found) return found;
        }
        const catParam = searchParams.get('category');
        const svcParam = searchParams.get('service');
        return findTargetCategory(effectiveCategories, catParam, svcParam) || effectiveCategories[0];
    }, [effectiveCategories, selectedSlug, searchParams]);

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

    // Sync selected category and service from URL query params
    useEffect(() => {
        if (effectiveCategories.length === 0) return;
        const catQuery = searchParams.get('category');
        const svcQuery = searchParams.get('service');
        const target = findTargetCategory(effectiveCategories, catQuery, svcQuery);
        if (target) {
            const slug = target.slug || normalize(target.name);
            setSelectedSlug(slug);
            setFormCategory(target.name);

            if (svcQuery) {
                const matchedSvc = (target.services || []).find(s =>
                    s.title?.toLowerCase() === svcQuery.toLowerCase() ||
                    normalize(s.title) === normalize(svcQuery)
                );
                if (matchedSvc) {
                    setFormService(matchedSvc.title);
                }
            }
        }
    }, [effectiveCategories, searchParams]);

    // Smooth-scroll to the targeted service card if specified in URL
    useEffect(() => {
        const svcQuery = searchParams.get('service');
        if (!svcQuery || loading) return;
        const timer = setTimeout(() => {
            const el = document.getElementById(`service-${normalize(svcQuery)}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchParams, loading, currentCategory]);

    const handleSelectCategory = (cat) => {
        const slug = cat.slug || normalize(cat.name);
        setSelectedSlug(slug);
        setFormCategory(cat.name);
        setFormService('');
        setSearchParams({ category: slug });
    };

    const handleSelectService = (service) => {
        setFormCategory(currentCategory?.name || '');
        setFormService(service.title);
        const bookingEl = document.getElementById('booking-section');
        if (bookingEl) {
            bookingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

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
                {/* Category Switcher Tabs */}
                {effectiveCategories.length > 1 && (
                    <div className="services-category-tabs-wrapper">
                        <div className="services-category-tabs" role="tablist">
                            {effectiveCategories.map((cat, idx) => {
                                const catSlug = cat.slug || normalize(cat.name);
                                const isCatActive = currentCategory && (
                                    currentCategory.slug === cat.slug ||
                                    normalize(currentCategory.slug) === normalize(catSlug) ||
                                    currentCategory.name === cat.name
                                );
                                return (
                                    <button
                                        key={cat.slug || idx}
                                        type="button"
                                        role="tab"
                                        aria-selected={isCatActive}
                                        className={`services-cat-tab ${isCatActive ? 'active' : ''}`}
                                        onClick={() => handleSelectCategory(cat)}
                                    >
                                        <span className="cat-tab-icon">
                                            {iconMapping[cat.iconName] || <Shield size={18} />}
                                        </span>
                                        <span className="cat-tab-name">{cat.name}</span>
                                        {cat.services && cat.services.length > 0 && (
                                            <span className="cat-tab-count">{cat.services.length}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section Header */}
                <div className="section-header-center">
                    <h2>{currentCategory ? `${currentCategory.name} Services` : 'Our Service Offerings'}</h2>
                    {(() => {
                        const catDesc = currentCategory?.description || 'High-end technical expertise paired with state-of-the-art drone fleets to guarantee unmatched performance.';
                        if (/<[a-z][\s\S]*>/i.test(catDesc)) {
                            return <div className="service-cat-desc-html" dangerouslySetInnerHTML={{ __html: preserveHyphenatedText(catDesc) }} />;
                        }
                        return <p>{preserveHyphenatedText(catDesc)}</p>;
                    })()}
                </div>

                {/* Services Grid */}
                {currentCategory && currentCategory.services && currentCategory.services.length > 0 ? (
                    <div className="services-grid">
                        {currentCategory.services.map((service, idx) => {
                            const activeServiceParam = searchParams.get('service');
                            const isSelected = activeServiceParam && (
                                service.title?.toLowerCase() === activeServiceParam.toLowerCase() ||
                                normalize(service.title) === normalize(activeServiceParam)
                            );

                            return (
                                <div
                                    key={idx}
                                    id={`service-${normalize(service.title)}`}
                                    className={`service-card shadow-sm${service.image ? ' has-image' : ''}${isSelected ? ' is-selected-service' : ''}`}
                                >
                                    {isSelected && (
                                        <div className="service-selected-pill">
                                            <Check size={14} />
                                            <span>Selected Service</span>
                                        </div>
                                    )}
                                    {service.image ? (
                                        <div className="service-card-image-wrapper">
                                            <img src={service.image} alt={service.title} className="service-card-img" />
                                            <div className="service-icon-badge">
                                                {iconMapping[service.iconName] || <Shield size={20} />}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="service-no-image-header">
                                            <div className="service-icon-box">
                                                {iconMapping[service.iconName] || <Shield size={26} />}
                                            </div>
                                        </div>
                                    )}
                                    <div className="service-card-content">
                                        <h3>{service.title}</h3>
                                        {service.description && (
                                            /<[a-z][\s\S]*>/i.test(service.description) ? (
                                                <div
                                                    className="service-desc service-html-content"
                                                    dangerouslySetInnerHTML={{ __html: preserveHyphenatedText(service.description) }}
                                                />
                                            ) : (
                                                <p className="service-desc">{preserveHyphenatedText(service.description)}</p>
                                            )
                                        )}
                                        {service.features && service.features.length > 0 && (
                                            <ul className="service-features">
                                                {service.features.map((feat, fIdx) => (
                                                    <li key={fIdx}>
                                                        <Shield size={14} className="shield-icon" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="service-card-actions">
                                            <button
                                                type="button"
                                                className={`service-action-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => handleSelectService(service)}
                                            >
                                                <span>{isSelected ? 'Service Selected • Book Below' : 'Book Consultation'}</span>
                                                <ArrowRight size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="section-header-center">
                        <p>No services available yet for this category. Please check back soon.</p>
                    </div>
                )}

                {/* Enquiry & Booking Section */}
                <div className="booking-row" id="booking-section">
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
                                            onChange={(e) => { 
                                                const newCat = e.target.value;
                                                setFormCategory(newCat); 
                                                setFormService('');
                                                const catMatch = effectiveCategories.find(c => c.name === newCat);
                                                if (catMatch) {
                                                    const slug = catMatch.slug || normalize(catMatch.name);
                                                    setSelectedSlug(slug);
                                                    setSearchParams({ category: slug });
                                                }
                                            }}
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
