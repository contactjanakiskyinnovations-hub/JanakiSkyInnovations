import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';
import './CategoryBanners.css';

// Append a cache-busting `?v=` (or `&v=`) query param so overwritten CMS images
// (re-uploaded into the same ImageKit slot) bypass CDN + browser stale caches.
const withVersion = (url, version) => {
    if (!url) return '';
    if (!version) return url;
    return url + (url.includes('?') ? '&' : '?') + `v=${version}`;
};

// Renders the CMS-managed category banners. If a `category` prop is supplied
// (e.g. on a CategoryPage) only banners matching that category slug are shown;
// otherwise all active banners are rendered as a grid (e.g. on Home).
const CategoryBanners = ({ category, title }) => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 className="spin" size={32} color="var(--primary-orange)" />
            </div>
        );
    }
    if (!visible.length) return null;

    const isSingle = visible.length === 1;
    return (
        <section className="category-banners-section">
            {title && <h2 className="section-title-clean">{title}</h2>}
            <div className={`category-banners-grid ${isSingle ? 'single' : ''}`}>
                {visible.map((b, i) => (
                    <Link
                        key={b._id || i}
                        to={b.link || `/category/${b.category || ''}`}
                        className="category-banner-card"
                    >
                        <div className="category-banner-img">
                            <img src={withVersion(b.image, b._version)} alt={b.title || 'Category banner'} />
                        </div>
                        {b.title && <span className="category-banner-title">{b.title}</span>}
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryBanners;
