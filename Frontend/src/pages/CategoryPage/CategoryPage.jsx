import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductFilterSort from '../../components/ProductFilterSort/ProductFilterSort';
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import '../../components/ViewToggle/ViewToggle.css';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';
import './CategoryPage.css';
import Seo, { buildItemListSchema, humanize } from '../../utils/seo';

const CategoryPage = () => {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const [filterState, setFilterState] = useState({
        sort: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        name: ''
    });

    // CMS-managed category banner - robust revalidation: fetch on mount, on tab focus,
    // and every 20s so banners added in Admin CMS appear without a manual refresh.
    const [cmsBanners, setCmsBanners] = useState([]);
    const [cmsImageVersion, setCmsImageVersion] = useState(0);
    const cmsFetchInFlight = useRef(false);
    const cmsLastVersion = useRef(0);
    const cmsLastJson = useRef('');

    const fetchCms = useCallback(async () => {
        if (cmsFetchInFlight.current) return;
        cmsFetchInFlight.current = true;
        try {
            const { data } = await api.get('/api/cms');
            const banners = Array.isArray(data?.categoryBanners) ? data.categoryBanners : [];
            const version = data?.imageVersion || 0;
            const json = JSON.stringify(banners);
            if (json !== cmsLastJson.current || version !== cmsLastVersion.current) {
                cmsLastJson.current = json;
                cmsLastVersion.current = version;
                setCmsBanners(banners);
                setCmsImageVersion(version);
            }
        } catch (error) {
            console.error('Failed to load category banners:', error);
        } finally {
            cmsFetchInFlight.current = false;
        }
    }, []);

    useEffect(() => {
        fetchCms();
        window.addEventListener('focus', fetchCms);
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') fetchCms();
        }, 20000);
        return () => {
            window.removeEventListener('focus', fetchCms);
            clearInterval(timer);
        };
    }, [fetchCms]);

    // Normalize a slug/name so case, hyphens and spaces all match.
    const slugifyKey = (v) => String(v || '').trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

    const { bannerImage, bannerLink } = useMemo(() => {
        const target = slugifyKey(id);
        if (!target) return { bannerImage: '', bannerLink: '' };
        const match = cmsBanners.find(b => slugifyKey(b?.category) === target && (b?.isActive !== false));
        if (!match || !match.image) return { bannerImage: '', bannerLink: '' };
        const url = match.image;
        const versionedUrl = cmsImageVersion
            ? url + (url.includes('?') ? '&' : '?') + `v=${cmsImageVersion}`
            : url;
        return { bannerImage: versionedUrl, bannerLink: (match.link || '').startsWith('/') ? match.link : '' };
    }, [cmsBanners, id, cmsImageVersion]);

    useEffect(() => {
        setPage(1); // reset to page 1 on category change
    }, [id]);

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('category', id);
                params.append('pageNumber', page);
                params.append('limit', 8);
                if (filterState.sort) params.append('sortBy', filterState.sort);
                if (filterState.minPrice) params.append('minPrice', filterState.minPrice);
                if (filterState.maxPrice) params.append('maxPrice', filterState.maxPrice);
                if (filterState.minRating) params.append('minRating', filterState.minRating);
                if (filterState.name) params.append('name', filterState.name);
                const { data } = await api.get(`/api/products?${params.toString()}`);
                setProducts(data.products);
                setPages(data.pages);
            } catch (error) {
                console.error('Failed to fetch category products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryProducts();
    }, [id, page, filterState]);

    return (
        <div className="category-page">
            <Seo
                title={`${humanize(id)} – Buy Online in India`}
                description={`Shop ${humanize(id)} at Janaki Sky Innovations – India's biggest drone & electronics store. Genuine products, best prices and fast delivery.`}
                path={`/category/${id}`}
                jsonLd={buildItemListSchema(`${humanize(id)} Products`, products, (p) => `/product/${p._id}`)}
            />

            {/* Category Hero Banner */}
            <div 
                className="category-hero" 
                style={{ backgroundImage: `url(${bannerImage})` }}
            >
                {bannerLink && <Link to={bannerLink} className="category-hero-link" title={bannerLink} aria-label="Shop category" />}
                <div className="category-hero-content">
                    <h1 style={{ textTransform: 'capitalize' }}>{id ? id.split('-').join(' ') : 'Premium Products'}</h1>
                    <p>Be the first to get the latest {id ? id.split('-').join(' ') : 'drone and robotics'} technology and advanced solutions.</p>
                </div>
            </div>

            <div className="container" style={{ padding: '60px 0' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#333' }}>
                        Products in {id ? id.split('-').join(' ') : 'this category'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ViewToggle view={viewMode} onViewChange={setViewMode} />
                        <ProductFilterSort 
                            currentFilters={filterState} 
                            onFilterChange={(newFilters) => { setFilterState(newFilters); setPage(1); }} 
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                        <Loader2 className="spin" size={40} color="var(--primary-orange)" />
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>No products found in this category.</h4>
                        <p style={{ color: '#94a3b8' }}>Try exploring other categories or check back later!</p>
                    </div>
                ) : (
                    <>
                        <div className={viewMode === 'list' ? 'product-list-view' : 'product-grid-view'}>
                            {products.map(product => (
                                <ProductCard key={product._id || product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {pages > 1 && (
                            <div className="storefront-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                                <button 
                                    className="pagination-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: page === 1 ? '#f1f5f9' : 'white',
                                        color: page === 1 ? '#94a3b8' : '#334155',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Previous
                                </button>
                                {[...Array(pages).keys()].map((x) => (
                                    <button
                                        key={x + 1}
                                        onClick={() => setPage(x + 1)}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: page === x + 1 ? 'var(--primary-orange)' : 'white',
                                            color: page === x + 1 ? 'white' : '#334155',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            minWidth: '44px'
                                        }}
                                    >
                                        {x + 1}
                                    </button>
                                ))}
                                <button 
                                    className="pagination-btn"
                                    disabled={page === pages}
                                    onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: page === pages ? '#f1f5f9' : 'white',
                                        color: page === pages ? '#94a3b8' : '#334155',
                                        cursor: page === pages ? 'not-allowed' : 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
