import React from 'react';
import './PromoBanners.css';

const PromoBanners = () => {
    return (
        <section className="promo-banners-section">
            <div className="promo-inner">
                <div className="promo-card animated-float">
                    <img
                        src="https://images.unsplash.com/photo-1713952160156-bb59cac789a9?q=80&w=1632&auto=format&fit=crop"
                        alt="Agriculture Drone"
                        className="promo-img"
                    />
                    <div className="promo-overlay">
                        <h2>Smart Agriculture</h2>
                        <p>Revolutionize your farming with precision spraying solutions.</p>
                        <button className="promo-btn">Explore Now</button>
                    </div>
                </div>

                <div className="promo-card animated-float-delayed">
                    <img
                        src="https://plus.unsplash.com/premium_photo-1664478063149-295e8449a105?q=80&w=1169&auto=format&fit=crop"
                        alt="FPV Racing Drone"
                        className="promo-img"
                    />
                    <div className="promo-overlay">
                        <h2>High-Speed FPV</h2>
                        <p>Experience the thrill of ultimate speed and control.</p>
                        <button className="promo-btn">View Models</button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromoBanners;
