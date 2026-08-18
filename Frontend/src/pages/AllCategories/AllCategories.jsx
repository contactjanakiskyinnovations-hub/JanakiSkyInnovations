import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Cpu, Settings, Award, Layers, Search, ArrowRight, Activity, Wifi, Link, Cog, Monitor, Cable, Wrench, Printer, Battery, Loader2 } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel';
import api from '../../utils/api';
import './AllCategories.css';
import Seo from '../../utils/seo';

const AllCategories = () => {
    const [activeMainCategory, setActiveMainCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(true);

    // Define the hierarchy
    const categoryHierarchy = [
        {
            id: 'electronics',
            name: 'Electronics',
            icon: <Layers size={24} />,
            description: 'The foundation of every project - Basic components, LEDs, ICs, and more.',
            subCategories: [
                {
                    name: 'Basic Components',
                    subSubCategories: ['Resistors', 'Oscillator', 'Diode', 'Transistor', 'Capacitor']
                },
                {
                    name: 'LED',
                    subSubCategories: ['LED', 'Through-Hole LEDs']
                },
                {
                    name: 'Potentiometers',
                    subSubCategories: []
                },
                {
                    name: 'Switch',
                    subSubCategories: ['DPDT Switch', 'Push Button Switches', 'Joystick Switches', 'Slide Switches']
                },
                {
                    name: 'Integrated Circuit (IC)',
                    subSubCategories: ['CD4X IC Series', '74HC IC Series', 'Clock and Timer IC', 'Motor Driver IC', 'Atmega IC', 'IC Base']
                },
                {
                    name: 'Connector',
                    subSubCategories: ['Berg Strip']
                },
                {
                    name: 'Prototyping Breadboards',
                    subSubCategories: []
                },
                {
                    name: 'Buzzers & Siren',
                    subSubCategories: []
                },
                {
                    name: 'Transformers',
                    subSubCategories: []
                },
                {
                    name: 'Aluminium Heat Sinks',
                    subSubCategories: []
                }
            ]
        },
        {
            id: 'developments-boards',
            name: 'Developments Boards',
            icon: <Cpu size={24} />,
            description: 'High-performance development boards and microcontroller platforms.',
            subCategories: [
                { name: 'STM32 Microcontroller Boards', subSubCategories: [] },
                { name: 'Development Board Accessories', subSubCategories: [] }
            ]
        },
        {
            id: 'arduino',
            name: 'Arduino',
            icon: <Award size={24} />,
            description: 'The world\'s most popular open-source electronics platform.',
            subCategories: [
                { name: 'Compatible Arduino Boards', subSubCategories: [] },
                { name: 'Arduino Boards', subSubCategories: [] },
                { name: 'Arduino Case & USB Cable', subSubCategories: [] }
            ]
        },
        {
            id: 'raspberry-pi',
            name: 'Raspberry Pi',
            icon: <Package size={24} />,
            description: 'Credit-card sized computers for endless possibilities.',
            subCategories: [
                { name: 'Raspberry Pi Boards', subSubCategories: [] },
                { name: 'Raspberry Pi Cases', subSubCategories: [] }
            ]
        },
        {
            id: 'electronic-modules',
            name: 'Electronic Modules',
            icon: <Layers size={24} />,
            description: 'Pre-assembled modules to simplify your circuit design.',
            subCategories: [
                {
                    name: 'Relay',
                    subSubCategories: ['5V Relay Modules', '12V Relay Modules']
                },
                { name: 'Breakout Boards', subSubCategories: [] },
                { name: 'Logic Level Converters', subSubCategories: [] }
            ]
        },
        {
            id: 'sensors',
            name: 'Sensors',
            icon: <Activity size={24} />,
            description: 'Interact with the physical world using advanced sensing technology.',
            subCategories: [
                { name: 'Sensor Kits', subSubCategories: [] },
                { name: 'Accelerometers & Gyro Sensors', subSubCategories: [] },
                { name: 'Biomedical Sensors', subSubCategories: [] },
                { name: 'Camera Sensors', subSubCategories: [] }
            ]
        },
        {
            id: 'iot-wireless-modules',
            name: 'IoT & Wireless Modules',
            icon: <Wifi size={24} />,
            description: 'Connect your projects to the internet and communicate wirelessly.',
            subCategories: [
                { name: 'ESP Modules', subSubCategories: [] },
                { name: 'Wifi Switch & Antenna', subSubCategories: [] }
            ]
        },
        {
            id: 'connector',
            name: 'Connector',
            icon: <Link size={24} />,
            description: 'High-quality connectors for secure and reliable connections.',
            subCategories: [
                { name: 'XT30', subSubCategories: [] },
                { name: 'XT60', subSubCategories: [] },
                { name: 'General Connector', subSubCategories: [] },
                { name: 'JST Connector', subSubCategories: [] }
            ]
        },
        {
            id: 'servo-motor-accessories',
            name: 'Servo Motor & Accessorise',
            icon: <Settings size={24} />,
            description: 'Precise motion control for your robotic and drone projects.',
            subCategories: [
                { name: 'Servo Motor', subSubCategories: [] },
                { name: 'Servo Motor Tester', subSubCategories: [] },
                { name: 'Payload Mechanism', subSubCategories: [] },
                { name: 'Control Hurn', subSubCategories: [] }
            ]
        },
        {
            id: 'motor-mechanical-parts',
            name: 'Motor & Mechanical Parts',
            icon: <Cog size={24} />,
            description: 'Drive systems, gears, and mechanical components.',
            subCategories: [
                { name: 'BO Motors', subSubCategories: [] },
                { name: 'Gear Motors', subSubCategories: [] },
                { name: 'Robot Wheels, Chassis', subSubCategories: [] }
            ]
        },
        {
            id: 'display-modules',
            name: 'Display Modules',
            icon: <Monitor size={24} />,
            description: 'Visual interfaces for your electronic projects.',
            subCategories: [
                { name: 'Capacitive Touch Screen', subSubCategories: [] }
            ]
        },
        {
            id: 'silicon-wire-cable',
            name: 'Silicon wire & Cable',
            icon: <Cable size={24} />,
            description: 'Flexible and heat-resistant wiring for high-current applications.',
            subCategories: [
                { name: 'Silicon wire', subSubCategories: [] }
            ]
        },
        {
            id: 'screw-nut-bolt',
            name: 'Screw, Nut, Bolt, Washer, Specer',
            icon: <Wrench size={24} />,
            description: 'Essential hardware for assembly and mounting.',
            subCategories: [
                {
                    name: 'Hex(Allen)',
                    subSubCategories: ['Socket Head', 'Button Head', 'Allen Countersunk(CSK)', 'Nyloc Nuts', 'Hex Nu', 'Plain Washer', 'Brass Inserts', 'Hex Spacers(Brass)', 'Hex Spacers(Nylon)']
                }
            ]
        },
        {
            id: '3d-printers-parts',
            name: '3D Printers Parts',
            icon: <Printer size={24} />,
            description: 'Filaments and components for 3D printing enthusiasts.',
            subCategories: [
                {
                    name: 'Filaments',
                    subSubCategories: ['PLA+', 'PETG', 'ABS', 'Silk PLA', 'Wood PLA', 'ASA']
                }
            ]
        },
        {
            id: 'battery-power-supply',
            name: 'Battery & Power Supply',
            icon: <Battery size={24} />,
            description: 'Reliable power sources for your portable electronics.',
            subCategories: [
                { name: 'B1', subSubCategories: [] }
            ]
        }
    ];

    useEffect(() => {
        if (!activeMainCategory) {
            setActiveMainCategory(categoryHierarchy[0]);
        }
    }, []);

    // Fetch trending products from live API instead of static mock data
    useEffect(() => {
        const fetchTrendingProducts = async () => {
            setRelatedLoading(true);
            try {
                const { data } = await api.get('/api/products?limit=10');
                setTrendingProducts(data.products || []);
            } catch (error) {
                console.error('Failed to fetch trending products:', error);
                setTrendingProducts([]);
            } finally {
                setRelatedLoading(false);
            }
        };
        fetchTrendingProducts();
    }, []);

    const filteredCategories = categoryHierarchy.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subCategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="all-categories-page">
            <Seo title="All Categories – Shop Drones, Electronics & Robotics" description="Explore the complete category tree of Janaki Sky Innovations – drones, electronics, Arduino, sensors, motors, tools and more." path="/all-categories" />
            <div className="categories-hero">
                <div className="container">
                    <div className="hero-banner">
                        <h1>ALL CATEGORIES</h1>
                        <p>India's Biggest Drone Store - Explore our 5000+ items across all categories.</p>
                    </div>
                </div>
            </div>

            <div className="container explorer-container">

                <div className="category-search-container">
                    <div className="category-search-wrapper">
                        <Search size={20} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search for a category or sub-category..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="explorer-layout">
                    {/* Sidebar: Main Categories */}
                    <aside className="main-cat-sidebar">
                        {filteredCategories.map((cat) => (
                            <button 
                                key={cat.id}
                                className={`main-cat-item ${activeMainCategory?.id === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveMainCategory(cat)}
                            >
                                <span className="cat-icon">{cat.icon}</span>
                                <span className="cat-name">{cat.name}</span>
                                <ChevronRight size={16} className="arrow" />
                            </button>
                        ))}
                    </aside>

                    {/* Main Content: Sub and Sub-Sub Categories */}
                    <main className="sub-cat-content">
                        {activeMainCategory && (
                            <>
                                <div className="content-header">
                                    <h2>{activeMainCategory.name}</h2>
                                    <p>{activeMainCategory.description}</p>
                                </div>

                                <div className="sub-cat-grid">
                                    {activeMainCategory.subCategories.map((sub, idx) => (
                                        <div key={idx} className="sub-cat-card">
                                            <h3>{sub.name}</h3>
                                            {sub.subSubCategories.length > 0 ? (
                                                <ul className="sub-sub-list">
                                                    {sub.subSubCategories.map((ssub, sidx) => (
                                                        <li key={sidx}>
                                                            <RouterLink to={`/category/${ssub.toLowerCase().replace(/\s+/g, '-')}`}>
                                                                {ssub}
                                                            </RouterLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="direct-items-msg">Direct selection of products available for this category.</p>
                                            )}
                                            <RouterLink to={`/category/${sub.name.toLowerCase().replace(/\s+/g, '-')}`} className="view-all-link">
                                                Explore All <ArrowRight size={14} />
                                            </RouterLink>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Related Items Section */}
            {relatedLoading ? (
                <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader2 className="spin" size={32} color="var(--primary-orange)" />
                </div>
            ) : trendingProducts.length > 0 ? (
                <ProductCarousel 
                    title="Trending in these categories" 
                    products={trendingProducts} 
                    fullWidth={false} 
                />
            ) : null}
        </div>
    );
};

export default AllCategories;
