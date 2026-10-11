import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PromoBanners.css';

const DEFAULT_BANNERS = [
    {
        image: 'https://images.unsplash.com/photo-1713952160156-bb59cac789a9?q=80&w=1632&auto=format&fit=crop',
        title: 'Smart Agricultural Spraying',
        subtitle: 'Agricultural UAV',
        description: 'Revolutionize farming with high-capacity 25L automated spraying UAVs.',
        link: '/category/drones',
        btnText: 'Explore Now'
    },
    {
        image: 'https://plus.unsplash.com/premium_photo-1664478063149-295e8449a105?q=80&w=1169&auto=format&fit=crop',
        title: 'High-Speed FPV Racing & Freestyle',
        subtitle: 'Racing Series',
        description: 'Ultra-low latency digital video, high-KV brushless motors, and carbon-fiber frames.',
        link: '/category/fpv-drone-accessories',
        btnText: 'View Models'
    },
    {
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=2000&auto=format&fit=crop',
        title: 'Enterprise Mapping & Surveillance',
        subtitle: 'Industrial Solutions',
        description: 'Dual-optical zoom and thermal sensors with centimeter-accurate RTK positioning.',
        link: '/category/drones',
        btnText: 'Discover More'
    },
    {
        image: 'https://images.unsplash.com/photo-1506947411487-a56738267384?q=80&w=1632&auto=format&fit=crop',
        title: 'Disaster & Rescue Drone',
        subtitle: 'Emergency Response',
        description: 'Purpose-built drones for search, rescue and rapid deployment in disaster zones.',
        link: '/category/drones',
        btnText: 'Explore Now'
    }
];

const PromoBanners = ({ cmsBanners }) => {
    const navigate = useNavigate();
    const [swiperInstance, setSwiperInstance] = useState(null);

    const handleNavigate = (link) => {
        const target = link && link.trim() ? link.trim() : '/all-categories';
        if (target.startsWith('http://') || target.startsWith('https://')) {
            window.open(target, '_blank', 'noopener,noreferrer');
        } else {
            navigate(target);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const banners = (cmsBanners && cmsBanners.length > 0 && cmsBanners.some(b => b.image))
        ? cmsBanners.filter(b => b.image)
        : DEFAULT_BANNERS;

    if (!banners || banners.length === 0) return null;

    return (
        <section className="promo-banners-section">
            <div className="promo-banners-inner">
                {/* Header */}
                <div className="promo-banners-header">
                    <div className="promo-banners-title-group">
                        <h2 className="promo-banners-title">Featured Promotions</h2>
                        <p className="promo-banners-subtitle">
                            Discover specialized drone series, enterprise payloads, and limited-time packages
                        </p>
                    </div>
                    <div className="promo-banners-controls">
                        <button
                            type="button"
                            className="promo-nav-btn"
                            onClick={() => swiperInstance?.slidePrev()}
                            aria-label="Previous"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            className="promo-nav-btn"
                            onClick={() => swiperInstance?.slideNext()}
                            aria-label="Next"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Swiper */}
                <div className="promo-swiper-outer">
                    <Swiper
                        onSwiper={setSwiperInstance}
                        modules={[Navigation, Pagination, Autoplay]}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true
                        }}
                        loop={banners.length > 2}
                        speed={700}
                        spaceBetween={16}
                        slidesPerView={1.15}
                        breakpoints={{
                            480:  { slidesPerView: 1.4,  spaceBetween: 14 },
                            680:  { slidesPerView: 1.85, spaceBetween: 16 },
                            900:  { slidesPerView: 2.1,  spaceBetween: 16 },
                            1100: { slidesPerView: 2.3,  spaceBetween: 18 },
                            1400: { slidesPerView: 2.5,  spaceBetween: 20 },
                        }}
                        pagination={{
                            clickable: true,
                            el: '.promo-swiper-pagination-dots',
                            bulletClass: 'promo-dot',
                            bulletActiveClass: 'promo-dot-active'
                        }}
                        className="promo-swiper"
                    >
                        {banners.map((banner, idx) => (
                            <SwiperSlide key={idx} className="promo-swiper-slide">
                                <div
                                    className="promo-overlay-card"
                                    onClick={() => handleNavigate(banner.link)}
                                >
                                    {/* Full-bleed image */}
                                    <img
                                        src={banner.image}
                                        alt={banner.title || `Promo ${idx + 1}`}
                                        className="promo-overlay-img"
                                        loading="lazy"
                                    />

                                    {/* Gradient overlay */}
                                    <div className="promo-overlay-gradient" />

                                    {/* Text content overlaid at bottom-left */}
                                    <div className="promo-overlay-content">
                                        {banner.subtitle && (
                                            <span className="promo-overlay-badge">{banner.subtitle}</span>
                                        )}
                                        <h3 className="promo-overlay-title">
                                            {banner.title || 'Featured Drone Series'}
                                        </h3>
                                        {banner.description && (
                                            /<[a-z][\s\S]*>/i.test(banner.description) ? (
                                                <div
                                                    className="promo-overlay-desc promo-overlay-html-desc"
                                                    dangerouslySetInnerHTML={{ __html: banner.description }}
                                                />
                                            ) : (
                                                <p className="promo-overlay-desc">{banner.description}</p>
                                            )
                                        )}
                                        <button
                                            type="button"
                                            className="promo-overlay-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNavigate(banner.link);
                                            }}
                                        >
                                            {banner.btnText || 'Explore Now'}
                                        </button>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div className="promo-swiper-pagination-dots" />
                </div>
            </div>
        </section>
    );
};

export default PromoBanners;
