import React, { useState, useEffect } from 'react';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import PromoBanners from '../../components/PromoBanners/PromoBanners';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel';
import CategoryGrid from '../../components/CategoryGrid/CategoryGrid';
import CategoryBanners from '../../components/CategoryBanners/CategoryBanners';
import api from '../../utils/api';
import { Loader2, Shield, Hammer, MapPin, Wind, Sparkles } from 'lucide-react';
import Seo from '../../utils/seo';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [cms, setCms] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [productsRes, cmsRes] = await Promise.all([
                    api.get('/api/products?limit=100'),
                    api.get('/api/cms')
                ]);
                setProducts(productsRes.data.products);
                setCms(cmsRes.data);
                // Priority: services inside serviceCategories (flattened).
                // Fallback: legacy flat services field.
                const cats = cmsRes.data?.serviceCategories || [];
                const catServices = cats.flatMap(cat => (cat.services || []).map(svc => ({ ...svc, category: cat.name })));
                if (catServices.length > 0) {
                    setServices(catServices);
                } else if (cmsRes.data?.services && cmsRes.data.services.length > 0) {
                    setServices(cmsRes.data.services);
                }
            } catch (error) {
                console.error('Failed to fetch homepage data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    // Only show up to 2 premium services on the homepage
    const premiumServices = services.slice(0, 2);

    // derived datasets for carousels
    const bestsellers = products.slice(0, 8);
    const newLaunches = products.filter(p => p.isFeatured || p.category === 'drones');
    
    // For specific categories
    const stemKits = products.filter(p => p.category === 'arduino' || p.category === 'sensors');
    const toolsAndInstruments = products.filter(p => p.category === 'tools' || p.category === 'motors');
    const displays = products.filter(p => p.category === 'batteries' || p.category === 'accessories');

    if (loading) {
        return (
            <>
                <Seo title="Janaki Sky Innovations" path="/" />
                <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="spin" size={40} color="var(--primary-orange)" />
                </div>
            </>
        );
    }

    const getServiceIcon = (iconName) => {
        const iconMap = {
            'Shield': Shield,
            'Hammer': Hammer,
            'MapPin': MapPin,
            'Wind': Wind,
            'Sparkles': Sparkles
        };
        const IconComponent = iconMap[iconName] || Shield;
        return <IconComponent size={28} />;
    };

    return (
        <div className="home-page">
            <Seo
                title="Buy Drones, Robotics & DIY Electronics Online in India"
                description={cms?.footer?.tagline || "Nepal's biggest online drone store – shop drones, FPV, robotics, Arduino, sensors and DIY electronics with fast delivery."}
                path="/"
                image="/logoWithName.jpeg"
            />
            <HeroSlider cmsSlides={cms?.heroSliders} />
            <PromoBanners cmsBanners={cms?.promoBanners} />
            <CategoryBanners title="Shop by Category" />
            <CategoryGrid />
            
            {bestsellers.length > 0 && <ProductCarousel title="Shop our bestsellers" products={bestsellers} fullWidth={true} />}
            {newLaunches.length > 0 && <ProductCarousel title="NEW LAUNCH PRODUCTS" products={newLaunches} fullWidth={true} />}
            
            {/* Services Section - shows up to 2 premium services */}
            {premiumServices.length > 0 && (
                <section className="home-services-section" style={{ padding: '80px 0', background: '#f8fafc' }}>
                    <div className="container">
                        <div className="section-header-center" style={{ marginBottom: '50px' }}>
                            <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '10px' }}>Our Premium Services</h2>
                            <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Advanced aerial solutions engineered for industrial precision and celebratory excellence.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {premiumServices.map((service, idx) => (
                                <div
                                    key={idx}
                                    className={`service-card-home shadow-sm${service.image ? ' has-image' : ''}`}
                                >
                                    {service.image ? (
                                        <div className="service-card-image-wrapper">
                                            <img src={service.image} alt={service.title} className="service-card-img" />
                                            <div className="service-icon-badge">
                                                {getServiceIcon(service.iconName)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="service-no-image-header">
                                            <div className="service-icon-box">
                                                {getServiceIcon(service.iconName)}
                                            </div>
                                        </div>
                                    )}
                                    <div className="service-card-content">
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>{service.title}</h3>
                                        {service.category && <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-orange)', marginBottom: '8px' }}>{service.category}</p>}
                                        <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.65', marginBottom: '18px' }}>{service.description}</p>
                                        {service.features && service.features.length > 0 && (
                                            <ul className="service-card-features">
                                                {service.features.slice(0, 3).map((feat, fIdx) => (
                                                    <li key={fIdx}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-orange)', flexShrink: 0 }}></span>
                                                        {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            
            {stemKits.length > 0 && <ProductCarousel title="STEM KITS" products={stemKits} fullWidth={true} />}
            {toolsAndInstruments.length > 0 && <ProductCarousel title="TOOL & INSTRUMENTS" products={toolsAndInstruments} fullWidth={true} />}
            {displays.length > 0 && <ProductCarousel title="BATTERIES & POWER" products={displays} fullWidth={true} />}
        </div>
    );
};

export default Home;
