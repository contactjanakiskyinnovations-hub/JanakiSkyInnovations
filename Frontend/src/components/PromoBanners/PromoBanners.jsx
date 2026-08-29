import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PromoBanners.css';

const DEFAULT_BANNERS = [
    {
        image: 'https://images.unsplash.com/photo-1713952160156-bb59cac789a9?q=80&w=1632&auto=format&fit=crop',
        title: 'Smart Agriculture',
        description: 'Revolutionize your farming with precision spraying solutions.',
        link: '/category/drones',
        btnText: 'Explore Now'
    },
    {
        image: 'https://plus.unsplash.com/premium_photo-1664478063149-295e8449a105?q=80&w=1169&auto=format&fit=crop',
        title: 'High-Speed FPV',
        description: 'Experience the thrill of ultimate speed and control.',
        link: '/category/fpv-drone-accessories',
        btnText: 'View Models'
    }
];

const PromoBanners = ({ cmsBanners }) => {
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

    // Use CMS banners if available (and have images), else fall back to defaults
    const banners = (cmsBanners && cmsBanners.length > 0 && cmsBanners.some(b => b.image))
        ? cmsBanners.filter(b => b.image)
        : DEFAULT_BANNERS;

    return (
        <section className="promo-banners-section">
            <div className="promo-inner">
                {banners.map((banner, idx) => (
                    <div
                        key={idx}
                        className={`promo-card ${idx % 2 === 0 ? 'animated-float' : 'animated-float-delayed'}`}
                        onClick={() => handleNavigate(banner.link)}
                    >
                        <img
                            src={banner.image}
                            alt={banner.title || `Promo ${idx + 1}`}
                            className="promo-img"
                        />
                        <div className="promo-overlay">
                            {banner.title && <h2>{banner.title}</h2>}
                            {banner.description && <p>{banner.description}</p>}
                            <button
                                type="button"
                                className="promo-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(banner.link);
                                }}
                            >
                                {banner.btnText || 'Explore Now'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default PromoBanners;
