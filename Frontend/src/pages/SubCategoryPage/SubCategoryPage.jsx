import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Package } from 'lucide-react';
import { CATEGORIES } from '../../components/QuickCategories/QuickCategories';
import Seo from '../../utils/seo';
import './SubCategoryPage.css';

/* ── Sub-category data (mirrors AllCategories hierarchy) ── */
const SUB_CATEGORY_MAP = {
    'electronics': [
        { name: 'Basic Components',        items: ['Resistors', 'Oscillator', 'Diode', 'Transistor', 'Capacitor'],     emoji: '🔧' },
        { name: 'LED',                      items: ['LED', 'Through-Hole LEDs'],                                          emoji: '💡' },
        { name: 'Potentiometers',           items: [],                                                                     emoji: '🎛️' },
        { name: 'Switch',                   items: ['DPDT Switch', 'Push Button Switches', 'Joystick Switches', 'Slide Switches'], emoji: '🔘' },
        { name: 'Integrated Circuit (IC)',  items: ['CD4X IC Series', '74HC IC Series', 'Motor Driver IC', 'Atmega IC'], emoji: '🖥️' },
        { name: 'Connector',                items: ['Berg Strip'],                                                         emoji: '🔌' },
        { name: 'Prototyping Breadboards',  items: [],                                                                     emoji: '📋' },
        { name: 'Buzzers & Siren',          items: [],                                                                     emoji: '🔔' },
        { name: 'Aluminium Heat Sinks',     items: [],                                                                     emoji: '🌡️' },
    ],
    'developments-boards': [
        { name: 'STM32 Microcontroller Boards', items: [], emoji: '💻' },
        { name: 'Development Board Accessories', items: [], emoji: '🔩' },
    ],
    'arduino': [
        { name: 'Compatible Arduino Boards', items: [], emoji: '🤖' },
        { name: 'Arduino Boards',            items: [], emoji: '🟦' },
        { name: 'Arduino Case & USB Cable',  items: [], emoji: '📦' },
    ],
    'raspberry-pi': [
        { name: 'Raspberry Pi Boards', items: [], emoji: '🍓' },
        { name: 'Raspberry Pi Cases',  items: [], emoji: '📦' },
    ],
    'electronic-modules': [
        { name: 'Relay',                 items: ['5V Relay Modules', '12V Relay Modules'], emoji: '⚡' },
        { name: 'Breakout Boards',       items: [], emoji: '📟' },
        { name: 'Logic Level Converters', items: [], emoji: '🔄' },
    ],
    'sensors': [
        { name: 'Sensor Kits',                    items: [], emoji: '🧪' },
        { name: 'Accelerometers & Gyro Sensors',  items: [], emoji: '📐' },
        { name: 'Biomedical Sensors',             items: [], emoji: '💓' },
        { name: 'Camera Sensors',                 items: [], emoji: '📷' },
    ],
    'iot-wireless-modules': [
        { name: 'ESP Modules',          items: [], emoji: '📡' },
        { name: 'Wifi Switch & Antenna', items: [], emoji: '📶' },
    ],
    'connector': [
        { name: 'XT30',            items: [], emoji: '🔌' },
        { name: 'XT60',            items: [], emoji: '🔌' },
        { name: 'General Connector', items: [], emoji: '🔗' },
        { name: 'JST Connector',   items: [], emoji: '⚙️' },
    ],
    'servo-motor-accessories': [
        { name: 'Servo Motor',        items: [], emoji: '⚙️' },
        { name: 'Servo Motor Tester', items: [], emoji: '🔬' },
        { name: 'Payload Mechanism',  items: [], emoji: '🏗️' },
        { name: 'Control Hurn',       items: [], emoji: '🎮' },
    ],
    'motor-mechanical-parts': [
        { name: 'BO Motors',                   items: [], emoji: '⚙️' },
        { name: 'Gear Motors',                 items: [], emoji: '🔩' },
        { name: 'Robot Wheels, Chassis',       items: [], emoji: '🚗' },
    ],
    'display-modules': [
        { name: 'Capacitive Touch Screen', items: [], emoji: '📱' },
    ],
    'silicon-wire-cable': [
        { name: 'Silicon wire', items: [], emoji: '🔌' },
    ],
    'screw-nut-bolt': [
        { name: 'Socket Head',        items: [], emoji: '🔩' },
        { name: 'Button Head',        items: [], emoji: '🔩' },
        { name: 'Nyloc Nuts',         items: [], emoji: '⚙️' },
        { name: 'Hex Spacers (Brass)', items: [], emoji: '🏗️' },
        { name: 'Hex Spacers (Nylon)', items: [], emoji: '🏗️' },
        { name: 'Plain Washer',       items: [], emoji: '⭕' },
    ],
    '3d-printers-parts': [
        { name: 'PLA+ Filament',  items: [], emoji: '🖨️' },
        { name: 'PETG Filament',  items: [], emoji: '🖨️' },
        { name: 'ABS Filament',   items: [], emoji: '🖨️' },
        { name: 'Silk PLA',       items: [], emoji: '✨' },
        { name: 'Wood PLA',       items: [], emoji: '🌲' },
        { name: 'ASA Filament',   items: [], emoji: '🖨️' },
    ],
    'battery-power-supply': [
        { name: 'LiPo Batteries',       items: [], emoji: '🔋' },
        { name: 'Li-ion Batteries',     items: [], emoji: '🔋' },
        { name: 'Power Distribution Boards', items: [], emoji: '⚡' },
        { name: 'Voltage Regulators',   items: [], emoji: '🔌' },
    ],
    'drones': [
        { name: 'Ready-to-Fly Drones',  items: [], emoji: '✈️' },
        { name: 'Drone Frames',         items: [], emoji: '🏗️' },
        { name: 'Flight Controllers',   items: [], emoji: '🕹️' },
        { name: 'Propellers',           items: [], emoji: '🌀' },
        { name: 'Brushless Motors',     items: [], emoji: '⚙️' },
        { name: 'ESC (Electronic Speed Controllers)', items: [], emoji: '⚡' },
        { name: 'Drone Cameras',        items: [], emoji: '📷' },
        { name: 'Drone Accessories',    items: [], emoji: '🔧' },
    ],
    'fpv-drone-accessories': [
        { name: 'FPV Cameras',          items: [], emoji: '📷' },
        { name: 'FPV Goggles',          items: [], emoji: '🥽' },
        { name: 'Video Transmitters',   items: [], emoji: '📡' },
        { name: 'FPV Frames',           items: [], emoji: '🏗️' },
        { name: 'RC Controllers',       items: [], emoji: '🎮' },
        { name: 'FPV Motors',           items: [], emoji: '⚙️' },
    ],
    'cameras': [
        { name: 'Action Cameras',       items: [], emoji: '🎥' },
        { name: 'Thermal Cameras',      items: [], emoji: '🌡️' },
        { name: 'Gimbal Cameras',       items: [], emoji: '📷' },
        { name: 'Camera Accessories',   items: [], emoji: '🔧' },
    ],
    'agriculture-drones': [
        { name: 'Sprayer Drones',       items: [], emoji: '💧' },
        { name: 'Mapping Drones',       items: [], emoji: '🗺️' },
        { name: 'Agri Accessories',     items: [], emoji: '🌾' },
    ],
    'defence-drones': [
        { name: 'Surveillance Drones',  items: [], emoji: '🛡️' },
        { name: 'Rescue Drones',        items: [], emoji: '🚁' },
        { name: 'Defence Accessories',  items: [], emoji: '🎖️' },
    ],
};

const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const SubCategoryPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const catMeta = CATEGORIES.find(c => c.id === id);
    const subCategories = SUB_CATEGORY_MAP[id] || [];
    const catName = catMeta?.label || id?.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    const handleSubClick = (subName) => {
        const slug = slugify(subName);
        navigate(`/category/${slug}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="subcat-page">
            <Seo
                title={`${catName} – Browse Sub-Categories`}
                description={`Explore all sub-categories under ${catName} at Janaki Sky Innovations.`}
                path={`/categories/${id}`}
            />

            {/* Hero banner */}
            <div
                className="subcat-hero"
                style={catMeta?.image ? { backgroundImage: `url(${catMeta.image})` } : {}}
            >
                <div className="subcat-hero-overlay" />
                <div className="subcat-hero-content">
                    <button
                        className="subcat-back-btn"
                        onClick={() => navigate(-1)}
                        type="button"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h1 className="subcat-hero-title">{catName}</h1>
                    <p className="subcat-hero-crumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <Link to="/all-categories">Categories</Link>
                        <ChevronRight size={14} />
                        <span>{catName}</span>
                    </p>
                </div>
            </div>

            {/* Sub-categories grid */}
            <div className="subcat-body">
                <div className="subcat-count">
                    {subCategories.length} sub-categor{subCategories.length !== 1 ? 'ies' : 'y'} found
                </div>

                {subCategories.length === 0 ? (
                    <div className="subcat-empty">
                        <Package size={52} strokeWidth={1.2} />
                        <h3>No sub-categories yet</h3>
                        <p>Products are listed directly in this category.</p>
                        <button
                            className="subcat-direct-btn"
                            onClick={() => { navigate(`/category/${id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            View Products <ChevronRight size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="subcat-grid">
                        {subCategories.map((sub, idx) => (
                            <button
                                key={idx}
                                className="subcat-card"
                                onClick={() => handleSubClick(sub.name)}
                                type="button"
                            >
                                <div className="subcat-card-top">
                                    <span className="subcat-card-emoji">{sub.emoji}</span>
                                    <span className="subcat-card-arrow">
                                        <ChevronRight size={18} />
                                    </span>
                                </div>
                                <div className="subcat-card-body">
                                    <span className="subcat-card-name">{sub.name}</span>
                                    {sub.items.length > 0 ? (
                                        <span className="subcat-card-items">
                                            {sub.items.slice(0, 3).join(', ')}{sub.items.length > 3 ? '...' : ''}
                                        </span>
                                    ) : (
                                        <span className="subcat-card-items">
                                            Explore specialized models & parts
                                        </span>
                                    )}
                                </div>
                                <div className="subcat-card-action">
                                    <span>Browse Products</span>
                                    <ChevronRight size={14} />
                                </div>
                            </button>
                        ))}

                        {/* "View all products" card at end */}
                        <button
                            className="subcat-card subcat-card--all"
                            onClick={() => { navigate(`/category/${id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            type="button"
                        >
                            <div className="subcat-card-top">
                                <span className="subcat-card-emoji">📦</span>
                                <span className="subcat-card-arrow">
                                    <ChevronRight size={18} />
                                </span>
                            </div>
                            <div className="subcat-card-body">
                                <span className="subcat-card-name">All {catName}</span>
                                <span className="subcat-card-items">
                                    Browse all products and items in this category
                                </span>
                            </div>
                            <div className="subcat-card-action">
                                <span>View Full Fleet</span>
                                <ChevronRight size={14} />
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubCategoryPage;
