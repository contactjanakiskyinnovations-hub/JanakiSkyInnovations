import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import './HeroSlider.css';

// Default static slides shown when no CMS heroSliders have been configured yet.
const DEFAULT_SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop',
        title: 'RJX CNC Machining Services',
        subtitle: 'Build Your Own FPV Drone',
        btnText: 'Shop Now',
        link: '/all-categories'
    },
    {
        image: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2070&auto=format&fit=crop',
        title: 'Carbon Fiber Tubes',
        subtitle: 'High Strength · Lightweight · Corrosion Resistant',
        btnText: 'Explore',
        link: '/category/accessories'
    },
    {
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop',
        title: 'Advanced FPV Drones',
        subtitle: 'Professional Grade Racing',
        btnText: 'Explore Collection',
        link: '/category/drones'
    }
];

const HeroSlider = ({ cmsSlides }) => {
    const [slides, setSlides] = useState(null);
    const navigate = useNavigate();

    const handleNavigate = (link) => {
        const target = link && link.trim() ? link.trim() : '/all-categories';
        if (target.startsWith('http://') || target.startsWith('https://')) {
            window.open(target, '_blank', 'noopener,noreferrer');
        } else {
            navigate(target);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (cmsSlides !== undefined) {
            // Parent already fetched CMS data and passed it in
            const active = (cmsSlides || []).filter(s => s.isActive !== false && s.image);
            setSlides(active.length > 0 ? active : DEFAULT_SLIDES);
            return;
        }
        // Standalone fetch (when used without a parent CMS fetch)
        api.get('/api/cms')
            .then(res => {
                const cmsData = res.data?.heroSliders || [];
                const active = cmsData.filter(s => s.isActive !== false && s.image);
                setSlides(active.length > 0 ? active : DEFAULT_SLIDES);
            })
            .catch(() => setSlides(DEFAULT_SLIDES));
    }, [cmsSlides]);

    if (!slides) {
        return (
            <section className="hero-slider full-width" style={{ minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={36} className="spin" color="var(--primary-orange, #f97316)" />
            </section>
        );
    }

    return (
        <section className="hero-slider full-width">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation={true}
                pagination={{ clickable: true }}
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                loop={slides.length > 1}
                className="mySwiper hero-swiper"
            >
                {slides.map((slide, idx) => (
                    <SwiperSlide key={idx}>
                        <div className="hero-slide-item" onClick={() => handleNavigate(slide.link)}>
                            <img
                                src={slide.image}
                                alt={slide.title || `Slide ${idx + 1}`}
                                className="hero-slide-img"
                            />
                            <div className="hero-slide-overlay">
                                <div className="hero-overlay-inner">
                                    {slide.title && <h2 className="hero-slide-title">{slide.title}</h2>}
                                    {slide.subtitle && <p className="hero-slide-subtitle">{slide.subtitle}</p>}
                                    <button
                                        type="button"
                                        className="hero-slide-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigate(slide.link);
                                        }}
                                    >
                                        {slide.btnText || 'Explore'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};

export default HeroSlider;
