import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import {
    Layers, Cpu, Award, Package, Activity, Wifi, Link,
    Settings, Cog, Monitor, Cable, Wrench, Printer, Battery,
    Plane, Zap, Camera, Shield, Wind, Radio
} from 'lucide-react';
import './QuickCategories.css';

/* ── Category data (mirrors AllCategories hierarchy) ── */
const CATEGORIES = [
    {
        id: 'drones',
        label: 'Drones',
        icon: Plane,
        color: '#ff8f00',
        image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'fpv-drone-accessories',
        label: 'FPV Racing',
        icon: Zap,
        color: '#e11d48',
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'electronics',
        label: 'Electronics',
        icon: Layers,
        color: '#7c3aed',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'developments-boards',
        label: 'Dev Boards',
        icon: Cpu,
        color: '#0ea5e9',
        image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'arduino',
        label: 'Arduino',
        icon: Award,
        color: '#00979d',
        image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'raspberry-pi',
        label: 'Raspberry Pi',
        icon: Package,
        color: '#c2185b',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'sensors',
        label: 'Sensors',
        icon: Activity,
        color: '#16a34a',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'cameras',
        label: 'Cameras',
        icon: Camera,
        color: '#b45309',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'iot-wireless-modules',
        label: 'IoT & Wireless',
        icon: Wifi,
        color: '#0891b2',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'connector',
        label: 'Connectors',
        icon: Link,
        color: '#475569',
        image: 'https://images.unsplash.com/photo-1581092334247-ddef2a41a85b?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'servo-motor-accessories',
        label: 'Servo Motors',
        icon: Settings,
        color: '#d97706',
        image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'motor-mechanical-parts',
        label: 'Motors & Parts',
        icon: Cog,
        color: '#dc2626',
        image: 'https://images.unsplash.com/photo-1565400971691-3a1d41d0f14a?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'display-modules',
        label: 'Displays',
        icon: Monitor,
        color: '#7c3aed',
        image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'silicon-wire-cable',
        label: 'Wires & Cables',
        icon: Cable,
        color: '#0f766e',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: '3d-printers-parts',
        label: '3D Printers',
        icon: Printer,
        color: '#6d28d9',
        image: 'https://images.unsplash.com/photo-1617777938240-9a1d8e51a47d?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'battery-power-supply',
        label: 'Batteries',
        icon: Battery,
        color: '#b91c1c',
        image: 'https://images.unsplash.com/photo-1620714223084-8fcacc2dfd4d?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'screw-nut-bolt',
        label: 'Screws & Bolts',
        icon: Wrench,
        color: '#64748b',
        image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'electronic-modules',
        label: 'E. Modules',
        icon: Radio,
        color: '#0284c7',
        image: 'https://images.unsplash.com/photo-1595075879165-e0adaa64cfad?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'defence-drones',
        label: 'Defence Drones',
        icon: Shield,
        color: '#1e3a5f',
        image: 'https://images.unsplash.com/photo-1583336663277-620dc1996580?w=200&q=75&auto=format&fit=crop',
    },
    {
        id: 'agriculture-drones',
        label: 'Agri Drones',
        icon: Wind,
        color: '#15803d',
        image: 'https://images.unsplash.com/photo-1584715787012-4e6e65a0a40e?w=200&q=75&auto=format&fit=crop',
    },
];

const QuickCategories = () => {
    const navigate = useNavigate();

    const handleClick = (catId) => {
        navigate(`/categories/${catId}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="quick-cat-section">
            <div className="quick-cat-inner">
                {/* Header */}
                <div className="quick-cat-header">
                    <h2 className="quick-cat-title">Shop by Category</h2>
                    <button
                        className="quick-cat-view-all"
                        onClick={() => { navigate('/all-categories'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                        View All
                    </button>
                </div>

                {/* Horizontal icon strip */}
                <Swiper
                    modules={[Autoplay, FreeMode]}
                    freeMode={{ enabled: true, momentum: true }}
                    autoplay={{
                        delay: 0,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                        reverseDirection: false,
                    }}
                    speed={4000}
                    loop={true}
                    slidesPerView="auto"
                    spaceBetween={14}
                    className="quick-cat-swiper"
                >
                    {[...CATEGORIES, ...CATEGORIES].map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                            <SwiperSlide key={`${cat.id}-${idx}`} className="quick-cat-slide">
                                <button
                                    className="quick-cat-card"
                                    onClick={() => handleClick(cat.id)}
                                    title={cat.label}
                                    type="button"
                                >
                                    {/* Circular image with icon overlay */}
                                    <div
                                        className="quick-cat-img-wrap"
                                        style={{ '--cat-color': cat.color }}
                                    >
                                        <img
                                            src={cat.image}
                                            alt={cat.label}
                                            className="quick-cat-img"
                                            loading="lazy"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div className="quick-cat-icon-bg">
                                            <Icon size={34} strokeWidth={1.8} />
                                        </div>
                                    </div>
                                    <span className="quick-cat-label">{cat.label}</span>
                                </button>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        </section>
    );
};

export default QuickCategories;
export { CATEGORIES };
