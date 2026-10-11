import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { 
    Shield, 
    Hammer, 
    MapPin, 
    Wind, 
    Sparkles, 
    ChevronLeft, 
    ChevronRight, 
    ArrowRight, 
    CheckCircle2 
} from 'lucide-react';
import './HomeServicesSlider.css';

// High-fidelity fallback services if none are configured in CMS
const DEFAULT_SERVICES = [
    {
        title: 'Industrial & Agricultural UAV Spraying',
        category: 'Agricultural Drones',
        iconName: 'Wind',
        description: 'Automated precision crop spraying, multispectral orchard mapping, and pest control using heavy-payload multi-rotor UAV systems.',
        features: ['Up to 25L Payload Tanks', 'Autonomous GPS Waypoints', '98% Drift Reduction Tech'],
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Aerial Cinematography & Flower Showering',
        category: 'Events & Celebrations',
        iconName: 'Sparkles',
        description: 'Spectacular floral showers for grand celebrations, religious ceremonies, and cinematic 4K FPV aerial media capture.',
        features: ['Automated Flower Dispersion Mechanism', 'Custom Height & Drop Scheduling', 'Redundant Safety Parachutes'],
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=2000&auto=format&fit=crop'
    },
    {
        title: 'Custom Drone Assembly & STEM Robotics',
        category: 'Engineering & DIY',
        iconName: 'Hammer',
        description: 'Bespoke carbon-fiber frame builds, brushless motor calibration, flight controller tuning, and institutional STEM lab kits.',
        features: ['Precision CNC Carbon Fiber', 'Custom ESC & Firmware Flash', 'Complete Bench Testing & QA'],
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Security, Surveillance & Mapping',
        category: 'Inspection & GIS',
        iconName: 'Shield',
        description: 'Thermal imaging, perimeter patrol, stockpile volume estimation, and high-accuracy LiDAR mapping for enterprise infrastructure.',
        features: ['Dual Thermal & 4K Optical Gimbals', 'AES-256 Encrypted Telemetry', 'RTK Centimeter Accuracy'],
        image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop'
    }
];

const iconMap = {
    'Shield': Shield,
    'Hammer': Hammer,
    'MapPin': MapPin,
    'Wind': Wind,
    'Sparkles': Sparkles
};

const HomeServicesSlider = ({ services = [] }) => {
    const [swiperInstance, setSwiperInstance] = useState(null);

    // Merge incoming CMS services with defaults if fewer than 3 items exist to guarantee a rich slider
    const effectiveServices = services && services.length >= 3 
        ? services 
        : (services && services.length > 0 ? [...services, ...DEFAULT_SERVICES.slice(services.length)] : DEFAULT_SERVICES);

    const getServiceIcon = (iconName) => {
        const IconComponent = iconMap[iconName] || Shield;
        return <IconComponent size={24} />;
    };

    return (
        <section className="home-services-slider-section">
            <div className="services-slider-inner">
                <div className="services-slider-header">
                    <div className="services-slider-title-group">
                        <span className="services-section-badge">Drone Solutions & Services</span>
                        <h2 className="services-slider-title">Our Premium Services</h2>
                        <p className="services-slider-subtitle">
                            Advanced aerial solutions engineered for industrial precision, agriculture, and celebratory excellence.
                        </p>
                    </div>

                    <div className="services-slider-controls">
                        <button
                            type="button"
                            className="service-nav-btn prev"
                            onClick={() => swiperInstance?.slidePrev()}
                            aria-label="Previous service"
                            title="Previous Service"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            className="service-nav-btn next"
                            onClick={() => swiperInstance?.slideNext()}
                            aria-label="Next service"
                            title="Next Service"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <Link to="/services" className="service-all-btn">
                            <span>All Services</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                <div className="services-swiper-outer">
                    <Swiper
                        onSwiper={setSwiperInstance}
                        modules={[Navigation, Pagination, Autoplay]}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true
                        }}
                        loop={effectiveServices.length > 3}
                        speed={700}
                        spaceBetween={24}
                        slidesPerView={1.15}
                        breakpoints={{
                            320: { slidesPerView: 1.15, spaceBetween: 16 },
                            600: { slidesPerView: 1.6, spaceBetween: 18 },
                            768: { slidesPerView: 2.1, spaceBetween: 22 },
                            1024: { slidesPerView: 2.8, spaceBetween: 24 },
                            1280: { slidesPerView: 3, spaceBetween: 28 }
                        }}
                        pagination={{
                            clickable: true,
                            el: '.services-swiper-pagination-dots',
                            bulletClass: 'service-dot',
                            bulletActiveClass: 'service-dot-active'
                        }}
                        className="services-swiper"
                    >
                        {effectiveServices.map((service, idx) => (
                            <SwiperSlide key={idx} className="services-swiper-slide">
                                <div className={`service-slider-card${service.image ? ' has-image' : ''}`}>
                                    {service.image ? (
                                        <div className="service-slider-img-wrap">
                                            <img
                                                src={service.image}
                                                alt={service.title}
                                                className="service-slider-img"
                                                loading="lazy"
                                            />
                                            <div className="service-slider-img-overlay"></div>
                                            {service.category && (
                                                <span className="service-category-tag">
                                                    {service.category}
                                                </span>
                                            )}
                                            <div className="service-icon-floating-badge">
                                                {getServiceIcon(service.iconName)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="service-slider-no-img-header">
                                            <div className="service-icon-box-fallback">
                                                {getServiceIcon(service.iconName)}
                                            </div>
                                            {service.category && (
                                                <span className="service-category-tag no-img">
                                                    {service.category}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="service-slider-body">
                                        <h3 className="service-slider-card-title">{service.title}</h3>
                                        <p className="service-slider-desc">{service.description}</p>

                                        {service.features && service.features.length > 0 && (
                                            <ul className="service-slider-feature-list">
                                                {service.features.slice(0, 3).map((feat, fIdx) => (
                                                    <li key={fIdx}>
                                                        <CheckCircle2 size={15} className="feature-check-icon" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <div className="service-slider-action-wrap">
                                            <Link
                                                to={service.category ? `/services?category=${encodeURIComponent(service.category)}` : '/services'}
                                                className="service-enquire-btn"
                                            >
                                                <span>Enquire Service</span>
                                                <ArrowRight size={15} className="service-btn-arrow" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div className="services-swiper-pagination-dots"></div>
                </div>
            </div>
        </section>
    );
};

export default HomeServicesSlider;
