import React, { useState, useEffect } from 'react';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import PromoBanners from '../../components/PromoBanners/PromoBanners';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel';
import CategoryGrid from '../../components/CategoryGrid/CategoryGrid';
import CategoryBanners from '../../components/CategoryBanners/CategoryBanners';
import HomeServicesSlider from '../../components/HomeServicesSlider/HomeServicesSlider';
import QuickCategories from '../../components/QuickCategories/QuickCategories';
import api from '../../utils/api';

import { Loader2 } from 'lucide-react';
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
                const catServices = cats.flatMap(cat => 
                    (cat.services || []).map(svc => ({ 
                        ...svc, 
                        category: cat.name,
                        categorySlug: cat.slug || cat.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    }))
                );
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

    // derived datasets for carousels
    const bestsellers = products.slice(0, 12);
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

    return (
        <div className="home-page">
            <Seo
                title="Buy Drones, Robotics & DIY Electronics Online in India"
                description={cms?.footer?.tagline || "India's biggest online drone store – shop drones, FPV, robotics, Arduino, sensors and DIY electronics with fast delivery."}
                path="/"
                image="/logoWithName.jpeg"
            />
            <HeroSlider cmsSlides={cms?.heroSliders} />

            <PromoBanners cmsBanners={cms?.promoBanners} />

            {/* Quick Category Navigation — icon strip for fast browsing */}
            <QuickCategories />


            
            {/* Shop by Category - Horizontal Automatic Slider */}
            <CategoryBanners title="Shop by Category" />
            
            <CategoryGrid />
            
            {bestsellers.length > 0 && <ProductCarousel title="Shop our bestsellers" products={bestsellers} fullWidth={true} />}
            {newLaunches.length > 0 && <ProductCarousel title="NEW LAUNCH PRODUCTS" products={newLaunches} fullWidth={true} />}
            
            {/* Services Section - Horizontal Automatic Slider showcasing all aerial & engineering solutions */}
            <HomeServicesSlider services={services} />
            
            {stemKits.length > 0 && <ProductCarousel title="STEM KITS" products={stemKits} fullWidth={true} />}
            {toolsAndInstruments.length > 0 && <ProductCarousel title="TOOL & INSTRUMENTS" products={toolsAndInstruments} fullWidth={true} />}
            {displays.length > 0 && <ProductCarousel title="BATTERIES & POWER" products={displays} fullWidth={true} />}
        </div>
    );
};

export default Home;
