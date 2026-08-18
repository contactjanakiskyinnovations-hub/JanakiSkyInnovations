import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Percent, Tag, ShieldCheck, Flame, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Offers.css';
import Seo from '../../utils/seo';

const Offers = () => {
    const [copiedCode, setCopiedCode] = useState('');
    const [dealProducts, setDealProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cmsData, setCmsData] = useState(null);

    const defaultCoupons = [
        {
            code: 'SKYDRONE10',
            discount: '10% OFF',
            title: 'Storewide Drone Discount',
            description: 'Apply at checkout on any Drone model in stock.',
            expiry: 'Expires 31 Dec 2026'
        },
        {
            code: 'AGRIFLIGHT15',
            discount: '15% OFF',
            title: 'Agriculture Drones Exclusive',
            description: 'Save big on precision crop spraying payloads.',
            expiry: 'Expires 30 Nov 2026'
        },
        {
            code: 'FIBERLINK5',
            discount: '5% OFF',
            title: 'Electronic Accessories Deals',
            description: 'Get discounts on Arduino, Sensors, and toolkits.',
            expiry: 'Expires 31 Oct 2026'
        }
    ];

    useEffect(() => {
        const fetchDeals = async () => {
            setLoading(true);
            try {
                // Fetch first 4 products to showcase as flash deals
                const { data: productsData } = await api.get('/api/products?pageNumber=1&limit=4');
                setDealProducts(productsData.products);

                // Fetch live CMS data
                const { data: cmsData } = await api.get('/api/cms');
                setCmsData(cmsData);
            } catch (err) {
                console.error('Failed to load deals products or CMS data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();

        // Refresh CMS data every 30 seconds for real-time updates
        const interval = setInterval(async () => {
            try {
                const { data: cmsData } = await api.get('/api/cms');
                setCmsData(cmsData);
            } catch (err) {
                console.error('Failed to refresh CMS data:', err);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const activeCoupons = cmsData?.coupons?.length > 0 ? cmsData.coupons : defaultCoupons;
    const bundles = cmsData?.offers?.bundleDeals?.length > 0 ? cmsData.offers.bundleDeals : [
        {
            title: 'Agri-Spray Complete Bundle',
            items: ['1x Janaki Agriculture Drone (10L)', '2x Smart Flight Batteries', '1x Toolkit & Storage Box'],
            price: '₹1,45,000',
            originalPrice: '₹1,75,000',
            discount: 'Save ₹30,000',
            image: 'https://images.unsplash.com/photo-1532509170117-98ef7500b411?q=80&w=2070&auto=format&fit=crop'
        },
        {
            title: 'FPV Pilot Starter Kit',
            items: ['1x Janaki FPV Racer', '1x FPV Goggles Pro', '1x 2.4GHz Controller Link'],
            price: '₹34,999',
            originalPrice: '₹42,000',
            discount: 'Save ₹7,001',
            image: 'https://images.unsplash.com/photo-1597847494283-a27825b84365?q=80&w=1168&auto=format&fit=crop'
        }
    ];

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    const offersHeroTitle = cmsData?.offers?.heroTitle || 'Flash Sale & Coupons';
    const offersHeroSubtitle = cmsData?.offers?.heroSubtitle || 'Unlock high-performance drone tech with active coupon codes, bundled sets, and seasonal flight reductions.';

    return (
        <div className="offers-page">
            <Seo title="Offers & Coupons – Drone Deals in India" description="Flash sales, coupon codes and bundle deals on drones and electronics. Save more with Janaki Sky Innovations offers." path="/offers" />
            {/* Hero Section */}
            <div className="offers-hero">
                <div className="offers-hero-overlay"></div>
                <div className="container hero-content-offers">
                    <span className="badge-offers">
                        <Flame size={14} style={{ fill: 'currentColor' }} />
                        <span>Exclusive Deals</span>
                    </span>
                    <h1>{offersHeroTitle}</h1>
                    <p>{offersHeroSubtitle}</p>
                </div>
            </div>

            <div className="container py-60">
                {/* Coupons Section */}
                <div className="section-header-center">
                    <h2>Active Coupon Codes</h2>
                    <p>Click on any coupon code box below to instantly copy it and apply it at your storefront checkout.</p>
                </div>

                <div className="coupons-grid">
                    {activeCoupons.map((coupon, idx) => (
                        <div key={idx} className="coupon-card">
                            <div className="coupon-discount-badge">
                                <Percent size={18} />
                                <span>{coupon.discount}</span>
                            </div>
                            <h3>{coupon.title}</h3>
                            <p>{coupon.description}</p>
                            
                            <div className="coupon-interactive-box" onClick={() => copyToClipboard(coupon.code)}>
                                <span className="code-text">{coupon.code}</span>
                                <span className="copy-action">
                                    {copiedCode === coupon.code ? (
                                        <>
                                            <Check size={16} className="check-icon" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            <span>Copy Code</span>
                                        </>
                                    )}
                                </span>
                            </div>
                            <div className="coupon-expiry">
                                <Tag size={12} />
                                <span>{coupon.expiry}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bundle Deals Section */}
                <div className="section-header-center mt-60">
                    <h2>Custom Tech Bundle Deals</h2>
                    <p>Hand-matched drone payloads and flight accessories selected by our systems engineers for immediate operations.</p>
                </div>

                <div className="bundles-grid">
                    {bundles.map((bundle, idx) => (
                        <div key={idx} className="bundle-card shadow-sm">
                            <div className="bundle-img-box">
                                <img src={bundle.image} alt={bundle.title} />
                                <span className="bundle-discount-floating">{bundle.discount}</span>
                            </div>
                            <div className="bundle-info-box">
                                <h3>{bundle.title}</h3>
                                <ul className="bundle-items-list">
                                    {bundle.items.map((item, iIdx) => (
                                        <li key={iIdx}>
                                            <ShieldCheck size={16} />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="bundle-price-row">
                                    <div className="price-details">
                                        <span className="price-label">Bundle Price</span>
                                        <span className="price-val">{bundle.price}</span>
                                        <span className="price-original-smashed">{bundle.originalPrice}</span>
                                    </div>
                                    <button className="primary-btn bundle-shop-btn">Inquire Deal</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Flash Sale Products */}
                <div className="section-header-center mt-60">
                    <h2>Active Deals Products</h2>
                    <p>Shop these selected high-fidelity items directly from our live MongoDB inventory with active coupon compatibility.</p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <Loader2 className="spin" size={40} color="var(--primary-orange)" />
                    </div>
                ) : dealProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '16px' }}>
                        <p style={{ color: '#94a3b8' }}>No deals items currently listed in flash sales.</p>
                    </div>
                ) : (
                    <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                        {dealProducts.map(product => (
                            <ProductCard key={product._id || product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers;
