import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './HeroSlider.css';

const HeroSlider = () => {
    const slides = [
        {
            id: 1,
            type: 'diamond-grid',
            title: 'RJX CNC machining services',
            subtitle: 'Build Your Own FPV Drone',
            btnText: 'Shop Now',
            gridImages: [
                'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1521671713035-0f6fc3a0fd04?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1524143878510-e3b8d6312402?q=80&w=2070&auto=format&fit=crop'
            ]
        },
        {
            id: 2,
            type: 'circular-grid',
            title: 'Carbon fiber tube',
            points: ['High strength', 'Lightweight', 'Corrosion resistance'],
            gridImages: [
                'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2070&auto=format&fit=crop', // item-0
                'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop', // item-1
                'https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop', // item-2
                'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop', // item-3
                'https://images.unsplash.com/photo-1521671713035-0f6fc3a0fd04?q=80&w=2070&auto=format&fit=crop', // item-4
                'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop', // item-5
                'https://images.unsplash.com/photo-1524143878510-e3b8d6312402?q=80&w=2070&auto=format&fit=crop', // item-6
                'https://images.unsplash.com/photo-1563207153-f403bf289096?q=80&w=2071&auto=format&fit=crop'  // item-7
            ]
        },
        {
            id: 3,
            type: 'diamond-grid',
            title: 'Advanced FPV Drones',
            subtitle: 'Professional Grade Racing',
            btnText: 'Explore Collection',
            gridImages: [
                'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1521671713035-0f6fc3a0fd04?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2070&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1524143878510-e3b8d6312402?q=80&w=2070&auto=format&fit=crop'
            ]
        }
    ];

    return (
        <section className="hero-slider full-width">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation={true}
                pagination={{ clickable: true }}
                autoplay={{ delay: 6000 }}
                loop={true}
                className="mySwiper"
            >
                {slides.map(slide => (
                    <SwiperSlide key={slide.id}>
                        <div className="slide-wrapper">
                            <div className="container slide-inner">
                                <div className="slide-content-left">
                                    <div className="text-overlay">
                                        <div className="accent-line"></div>
                                        <h2>{slide.title}</h2>
                                        {slide.points ? (
                                            <ul className="benefit-points">
                                                {slide.points.map((p, i) => (
                                                    <li key={i}><span className="bullet"></span> {p}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="mini-cards">
                                                <div className="mini-card"><img src="https://images.unsplash.com/photo-1563207153-f403bf289096?q=80&w=2071&auto=format&fit=crop" alt="CNC 1" /></div>
                                                <div className="mini-card"><img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" alt="CNC 2" /></div>
                                                <div className="mini-card"><img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop" alt="CNC 3" /></div>
                                            </div>
                                        )}
                                        {slide.btnText && <button className="slide-btn-primary">{slide.btnText}</button>}
                                    </div>
                                </div>
                                <div className="slide-content-right">
                                    {slide.type === 'diamond-grid' ? (
                                        <div className="image-diamond-grid">
                                            {slide.gridImages.map((img, idx) => (
                                                <div key={idx} className={`diamond-item item-${idx}`}>
                                                    <div className="diamond-inner">
                                                        <img src={img} alt={`Product ${idx}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="circular-wheel-grid">
                                            <div className="wheel-center">
                                                <div className="wheel-inner">
                                                    <h2>20+</h2>
                                                    <p>years experience</p>
                                                </div>
                                            </div>
                                            {slide.gridImages.map((img, idx) => (
                                                <div key={idx} className={`wheel-item item-${idx}`}>
                                                    <img src={img} alt={`Wheel Product ${idx}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
