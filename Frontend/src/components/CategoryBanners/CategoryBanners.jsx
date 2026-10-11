import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import api from '../../utils/api';
import { Loader2, ChevronLeft, ChevronRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import './CategoryBanners.css';

// Append a cache-busting `?v=` (or `&v=`) query param so overwritten CMS images
// (re-uploaded into the same ImageKit slot) bypass CDN + browser stale caches.
const withVersion = (url, version) => {
    if (!url) return '';
    if (!version) return url;
    return url + (url.includes('?') ? '&' : '?') + `v=${version}`;
};

// Renders the CMS-managed category banners as a modern, interactive horizontal
// slider with auto-sliding, pause-on-hover, and responsive touch navigation.
const CategoryBanners = ({ category, title }) => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [swiperInstance, setSwiperInstance] = useState(null);

    useEffect(() => {
        const fetchBanners = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/api/cms');
                const all = Array.isArray(data?.categoryBanners) ? data.categoryBanners : [];
                const version = data?.imageVersion || 0;
                setBanners(all.map(b => ({ ...b, _version: version })));
            } catch (err) {
                console.error('Failed to load category banners:', err);
                setBanners([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
        window.addEventListener('focus', fetchBanners);
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') fetchBanners();
        }, 20000);
        return () => {
            window.removeEventListener('focus', fetchBanners);
            clearInterval(timer);
        };
    }, []);

    const list = (banners || []).filter(b => b?.isActive !== false);
    const visible = category
        ? list.filter(b => (b.category || '').toLowerCase() === (category || '').toLowerCase())
        : list;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
                <Loader2 className="spin" size={32} color="var(--primary-orange)" />
            </div>
        );
    }
    if (!visible.length) return null;

    const isSingle = visible.length === 1;

    return (
        <section className="category-banners-section">
            <div className="category-banners-inner">
                <div className="category-banners-header">
                    <div className="category-banners-heading-group">
                        {title && <h2 className="section-title-clean">{title}</h2>}
                        <p className="category-banners-subtitle">
                            Explore popular drone fleets, racing kits, and specialized hardware
                        </p>
                    </div>

                    {!isSingle && (
                        <div className="category-banners-controls">
                            <button
                                type="button"
                                className="cat-nav-btn prev"
                                onClick={() => swiperInstance?.slidePrev()}
                                aria-label="Previous categories"
                                title="Previous"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                type="button"
                                className="cat-nav-btn next"
                                onClick={() => swiperInstance?.slideNext()}
                                aria-label="Next categories"
                                title="Next"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <Link to="/all-categories" className="cat-view-all-pill">
                                <span>All Categories</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>

                {isSingle ? (
                    <div className="category-banners-single-wrap">
                        {visible.map((b, i) => (
                            <Link
                                key={b._id || i}
                                to={b.link || `/category/${b.category || ''}`}
                                className="category-banner-card single"
                            >
                                <div className="category-banner-img">
                                    <img src={withVersion(b.image, b._version)} alt={b.title || 'Category banner'} />
                                    <div className="category-banner-overlay">
                                        <span className="category-banner-badge">
                                            Explore Series <ArrowUpRight size={14} />
                                        </span>
                                    </div>
                                </div>
                                <div className="category-banner-footer">
                                    <span className="category-banner-title">{b.title}</span>
                                    <span className="category-banner-action-icon">
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="category-swiper-outer">
                        <Swiper
                            onSwiper={setSwiperInstance}
                            modules={[Navigation, Pagination, Autoplay]}
                            autoplay={{
                                delay: 3500,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            }}
                            loop={visible.length > 4}
                            speed={650}
                            spaceBetween={20}
                            slidesPerView={1.25}
                            breakpoints={{
                                320: { slidesPerView: 1.25, spaceBetween: 14 },
                                480: { slidesPerView: 1.6, spaceBetween: 16 },
                                640: { slidesPerView: 2.2, spaceBetween: 18 },
                                860: { slidesPerView: 3, spaceBetween: 20 },
                                1150: { slidesPerView: 3.8, spaceBetween: 22 },
                                1320: { slidesPerView: 4, spaceBetween: 24 }
                            }}
                            pagination={{
                                clickable: true,
                                el: '.category-swiper-pagination-dots',
                                bulletClass: 'cat-dot',
                                bulletActiveClass: 'cat-dot-active'
                            }}
                            className="category-banners-swiper"
                        >
                            {visible.map((b, i) => (
                                <SwiperSlide key={b._id || i} className="category-banner-swiper-slide">
                                    <Link
                                        to={b.link || `/category/${b.category || ''}`}
                                        className="category-banner-card"
                                    >
                                        <div className="category-banner-img">
                                            <img
                                                src={withVersion(b.image, b._version)}
                                                alt={b.title || 'Category banner'}
                                                loading="lazy"
                                            />
                                            <div className="category-banner-overlay">
                                                <span className="category-banner-badge">
                                                    Explore <ArrowUpRight size={13} />
                                                </span>
                                            </div>
                                        </div>
                                        <div className="category-banner-footer">
                                            <span className="category-banner-title">{b.title}</span>
                                            <span className="category-banner-action-icon">
                                                <ArrowRight size={15} />
                                            </span>
                                        </div>
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <div className="category-swiper-pagination-dots"></div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryBanners;
