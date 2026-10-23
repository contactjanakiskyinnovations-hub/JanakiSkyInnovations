import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Package, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../../components/QuickCategories/QuickCategories';
import api from '../../utils/api';
import Seo from '../../utils/seo';
import './SubCategoryPage.css';

/* ── Emoji fallback map for sub-categories ── */
const EMOJI_MAP = {
    'basic components': '🔧', 'led': '💡', 'potentiometers': '🎛️', 'switch': '🔘',
    'integrated circuit': '🖥️', 'connector': '🔌', 'prototyping breadboards': '📋',
    'buzzers': '🔔', 'aluminium heat sinks': '🌡️', 'stm32': '💻',
    'development board accessories': '🔩', 'compatible arduino boards': '🤖',
    'arduino boards': '🟦', 'arduino case': '📦', 'raspberry pi boards': '🍓',
    'raspberry pi cases': '📦', 'relay': '⚡', 'breakout boards': '📟',
    'logic level converters': '🔄', 'sensor kits': '🧪', 'accelerometers': '📐',
    'biomedical sensors': '💓', 'camera sensors': '📷', 'esp modules': '📡',
    'wifi': '📶', 'xt30': '🔌', 'xt60': '🔌', 'jst connector': '⚙️',
    'general connector': '🔗', 'servo motor': '⚙️', 'payload mechanism': '🏗️',
    'control': '🎮', 'bo motors': '⚙️', 'gear motors': '🔩', 'robot wheels': '🚗',
    'capacitive touch screen': '📱', 'silicon wire': '🔌', 'socket head': '🔩',
    'button head': '🔩', 'nyloc nuts': '⚙️', 'hex spacers': '🏗️',
    'plain washer': '⭕', 'pla': '🖨️', 'petg': '🖨️', 'abs': '🖨️',
    'silk pla': '✨', 'wood pla': '🌲', 'asa': '🖨️', 'lipo': '🔋',
    'li-ion': '🔋', 'power distribution': '⚡', 'voltage regulators': '🔌',
    'ready-to-fly': '✈️', 'drone frames': '🏗️', 'flight controllers': '🕹️',
    'propellers': '🌀', 'brushless motors': '⚙️', 'esc': '⚡',
    'drone cameras': '📷', 'drone accessories': '🔧', 'fpv cameras': '📷',
    'fpv goggles': '🥽', 'video transmitters': '📡', 'fpv frames': '🏗️',
    'rc controllers': '🎮', 'fpv motors': '⚙️', 'action cameras': '🎥',
    'thermal cameras': '🌡️', 'gimbal cameras': '📷', 'camera accessories': '🔧',
    'sprayer drones': '💧', 'mapping drones': '🗺️', 'agri accessories': '🌾',
    'surveillance drones': '🛡️', 'rescue drones': '🚁', 'defence accessories': '🎖️',
    'payload': '📦', 'agriculture': '🌾', 'dji': '🛸'
};

const getEmoji = (name) => {
    const key = (name || '').toLowerCase();
    const found = Object.keys(EMOJI_MAP).find(k => key.includes(k));
    return found ? EMOJI_MAP[found] : '📂';
};

const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const SubCategoryPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subCategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const catMeta = CATEGORIES.find(c => c.id === id);
    const catName = catMeta?.label || id?.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    useEffect(() => {
        const fetchSubs = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/api/categories');
                const list = Array.isArray(data) ? data : [];
                const target = slugify(id || '');
                const targetBase = target.replace(/-products$/, '');
                const match = list.find(c => {
                    const cSlug = slugify(c.slug || c.name || '');
                    const cBase = cSlug.replace(/-products$/, '');
                    return cSlug === target || cBase === targetBase || slugify(c.name || '') === target;
                });
                if (match && Array.isArray(match.subCategories)) {
                    setSubCategories(match.subCategories.map(s => ({
                        name: s.name,
                        items: s.subSubCategories || [],
                        emoji: getEmoji(s.name)
                    })));
                } else {
                    setSubCategories([]);
                }
            } catch (err) {
                console.error('Failed to load sub-categories:', err);
                setSubCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSubs();
    }, [id]);

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
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <Loader2 className="spin" size={36} color="var(--primary-orange)" />
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default SubCategoryPage;
