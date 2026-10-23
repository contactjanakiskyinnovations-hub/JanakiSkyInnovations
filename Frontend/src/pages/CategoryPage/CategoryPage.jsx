import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductFilterSort from '../../components/ProductFilterSort/ProductFilterSort';
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import '../../components/ViewToggle/ViewToggle.css';
import api from '../../utils/api';
import { Loader2, Layers, ChevronRight, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import './CategoryPage.css';
import Seo, { buildItemListSchema, humanize } from '../../utils/seo';

/* ── Rich Emoji map for sub-categories ── */
const SUB_EMOJIS = {
    'dji': '🛸',
    'autel': '✈️',
    'flower': '🌸',
    'fpv': '🥽',
    'agriculture': '🌾',
    'payload': '📦',
    'surveillance': '🛡️',
    'cleaning': '🧼',
    'rescue': '🚁',
    'disaster': '🚁',
    'water': '🌊',
    'underwater': '🌊',
    'fire': '🚒',
    'firefighting': '🚒',
    'tethered': '⚓',
    'drone': '✈️',
    'robot': '🤖',
    'basic components': '🔧',
    'led': '💡',
    'potentiometer': '🎛️',
    'switch': '🔘',
    'integrated circuit': '🖥️',
    'ic': '🖥️',
    'connector': '🔌',
    'breadboard': '📋',
    'buzzer': '🔔',
    'heat sink': '🌡️',
    'stm32': '💻',
    'development': '🔩',
    'arduino': '🤖',
    'raspberry': '🍓',
    'relay': '⚡',
    'breakout': '📟',
    'logic': '🔄',
    'sensor': '🧪',
    'accelerometer': '📐',
    'gyro': '📐',
    'biomedical': '💓',
    'camera': '📷',
    'esp': '📡',
    'wifi': '📶',
    'servo': '⚙️',
    'motor': '⚙️',
    'wheel': '🚗',
    'chassis': '🚗',
    'display': '📱',
    'screen': '📱',
    'wire': '🔌',
    'cable': '🔌',
    'screw': '🔩',
    'nut': '⚙️',
    'bolt': '🔩',
    'spacer': '🏗️',
    '3d': '🖨️',
    'printer': '🖨️',
    'filament': '🖨️',
    'battery': '🔋',
    'power': '⚡',
    'tools': '🔧'
};

const getSubEmoji = (name) => {
    const lower = String(name || '').toLowerCase();
    const match = Object.keys(SUB_EMOJIS).find(k => lower.includes(k));
    return match ? SUB_EMOJIS[match] : '✈️';
};

const slugifyKey = (v) => String(v || '').trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
const toSlug = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CategoryPage = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Direct mode check: from navbar or explicit ?direct=1
    const isDirect = searchParams.get('direct') === '1' || searchParams.get('from') === 'nav';

    const [allCategories, setAllCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
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

    // CMS-managed category banners
    const [cmsBanners, setCmsBanners] = useState([]);
    const [cmsImageVersion, setCmsImageVersion] = useState(0);
    const cmsFetchInFlight = useRef(false);

    // Fetch CMS banners
    const fetchCms = useCallback(async () => {
        if (cmsFetchInFlight.current) return;
        cmsFetchInFlight.current = true;
        try {
            const { data } = await api.get('/api/cms');
            const banners = Array.isArray(data?.categoryBanners) ? data.categoryBanners : [];
            const version = data?.imageVersion || 0;
            setCmsBanners(banners);
            setCmsImageVersion(version);
        } catch (error) {
            // Keep fallback
        } finally {
            cmsFetchInFlight.current = false;
        }
    }, []);

    // Fetch categories hierarchy from DB
    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await api.get('/api/categories');
            if (Array.isArray(data)) {
                setAllCategories(data);
            }
        } catch (error) {
            console.error('Failed to load categories hierarchy:', error);
        }
    }, []);

    useEffect(() => {
        fetchCms();
        fetchCategories();
    }, [fetchCms, fetchCategories]);

    // Resolve matching category & hierarchy from DB
    const activeHierarchy = useMemo(() => {
        if (!id || !allCategories.length) {
            return { category: null, subCategory: null, subSubCategory: null };
        }

        const target = slugifyKey(id);
        const targetSlug = toSlug(id);
        const targetBase = targetSlug.replace(/-products$/, '');

        // 1. Direct match on Category slug or name
        let matchedCat = allCategories.find(c => {
            const cSlug = toSlug(c.slug || c.name);
            const cBase = cSlug.replace(/-products$/, '');
            return cSlug === targetSlug || cBase === targetBase || slugifyKey(c.name) === target;
        });

        let matchedSub = null;
        let matchedSubSub = null;

        // 2. If id corresponds to a sub-category directly (e.g. /category/dji-drones)
        if (!matchedCat) {
            for (const cat of allCategories) {
                const sub = (cat.subCategories || []).find(s => 
                    toSlug(s.name) === targetSlug || slugifyKey(s.name) === target
                );
                if (sub) {
                    matchedCat = cat;
                    matchedSub = sub.name;
                    break;
                }
            }
        }

        // 3. If id corresponds to a sub-sub-category directly (e.g. /category/mini-series)
        if (!matchedCat) {
            for (const cat of allCategories) {
                for (const sub of (cat.subCategories || [])) {
                    const ssub = (sub.subSubCategories || []).find(ss => 
                        toSlug(ss) === targetSlug || slugifyKey(ss) === target
                    );
                    if (ssub) {
                        matchedCat = cat;
                        matchedSub = sub.name;
                        matchedSubSub = ssub;
                        break;
                    }
                }
                if (matchedCat) break;
            }
        }

        return {
            category: matchedCat || null,
            subCategory: matchedSub || null,
            subSubCategory: matchedSubSub || null
        };
    }, [id, allCategories]);

    const activeCategory = activeHierarchy.category;

    // Active sub and subsub from URL or hierarchy match
    const currentSub = searchParams.get('sub') || (isDirect ? activeHierarchy.subCategory : '') || '';
    const currentSubSub = searchParams.get('subsub') || (isDirect ? activeHierarchy.subSubCategory : '') || '';

    // Find the currently selected sub-category object
    const selectedSubObj = useMemo(() => {
        if (!activeCategory || !currentSub) return null;
        return (activeCategory.subCategories || []).find(
            s => s.name.toLowerCase() === currentSub.toLowerCase()
        ) || null;
    }, [activeCategory, currentSub]);

    // Banner image resolution
    const { bannerImage, bannerLink } = useMemo(() => {
        const target = slugifyKey(id);
        const catTarget = activeCategory ? slugifyKey(activeCategory.slug || activeCategory.name) : target;
        
        let match = cmsBanners.find(b => {
            const bKey = slugifyKey(b?.category);
            return (bKey === target || bKey === catTarget) && b?.isActive !== false;
        });

        if (!match || !match.image) {
            if (activeCategory?.image) {
                return { bannerImage: activeCategory.image, bannerLink: '' };
            }
            return { bannerImage: '', bannerLink: '' };
        }

        const url = match.image;
        const versionedUrl = cmsImageVersion
            ? url + (url.includes('?') ? '&' : '?') + `v=${cmsImageVersion}`
            : url;
        return { bannerImage: versionedUrl, bannerLink: (match.link || '').startsWith('/') ? match.link : '' };
    }, [cmsBanners, id, cmsImageVersion, activeCategory]);

    // Reset pagination on category or filter change
    useEffect(() => {
        setPage(1);
    }, [id, currentSub, currentSubSub]);

    // ── Drill-down Decision: Should products be displayed on this step? ──
    // Rule:
    // 1. If isDirect (from navbar) -> always show products
    // 2. If category has no subcategories -> show products
    // 3. If in Level 1 (no sub selected) -> DO NOT show products (show related sub-categories only)
    // 4. If in Level 2 (sub selected):
    //    - If sub has sub-sub-categories AND no sub-sub selected -> DO NOT show products (show sub-subcategories only)
    //    - If sub has NO sub-sub-categories -> show all products for that subcategory
    // 5. If in Level 3 (sub-sub selected) -> show products for that sub-sub-category
    const hasSubCategories = activeCategory && Array.isArray(activeCategory.subCategories) && activeCategory.subCategories.length > 0;
    const hasSubSubCategories = selectedSubObj && Array.isArray(selectedSubObj.subSubCategories) && selectedSubObj.subSubCategories.length > 0;

    const shouldShowProducts = Boolean(
        isDirect ||
        !hasSubCategories ||
        (currentSub && (!hasSubSubCategories || currentSubSub))
    );

    // Fetch Products only when products are supposed to be displayed
    useEffect(() => {
        if (!shouldShowProducts) {
            setProducts([]);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchCategoryProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();

                if (currentSubSub) {
                    params.append('subSubCategory', currentSubSub);
                    if (activeCategory?.name) params.append('category', activeCategory.name);
                    if (currentSub) params.append('subCategory', currentSub);
                } else if (currentSub) {
                    params.append('subCategory', currentSub);
                    if (activeCategory?.name) params.append('category', activeCategory.name);
                } else if (activeCategory?.name) {
                    params.append('category', activeCategory.name);
                } else {
                    params.append('category', id);
                }

                params.append('pageNumber', page);
                params.append('limit', 12);
                if (filterState.sort) params.append('sortBy', filterState.sort);
                if (filterState.minPrice) params.append('minPrice', filterState.minPrice);
                if (filterState.maxPrice) params.append('maxPrice', filterState.maxPrice);
                if (filterState.minRating) params.append('minRating', filterState.minRating);
                if (filterState.name) params.append('name', filterState.name);

                const { data } = await api.get(`/api/products?${params.toString()}`);
                if (isMounted) {
                    setProducts(data.products || []);
                    setPages(data.pages || 1);
                }
            } catch (error) {
                console.error('Failed to fetch category products:', error);
                if (isMounted) setProducts([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCategoryProducts();
        return () => { isMounted = false; };
    }, [shouldShowProducts, id, activeCategory?.name, currentSub, currentSubSub, page, filterState]);

    // ── Drilldown Handlers ──
    const handleSubClick = (subName) => {
        setSearchParams({ sub: subName });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubSubClick = (subSubName) => {
        setSearchParams({ sub: currentSub, subsub: subSubName });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToSubs = () => {
        setSearchParams({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToSubSubs = () => {
        setSearchParams({ sub: currentSub });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBypassToProducts = () => {
        const nextParams = {};
        if (currentSub) nextParams.sub = currentSub;
        if (currentSubSub) nextParams.subsub = currentSubSub;
        nextParams.direct = '1';
        setSearchParams(nextParams);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Derived headings
    const heroTitle = activeCategory?.name || (id ? id.split('-').join(' ') : 'Premium Products');
    const productsTitle = currentSubSub 
        ? currentSubSub 
        : (currentSub ? currentSub : heroTitle);

    return (
        <div className="category-page">
            <Seo
                title={`${humanize(productsTitle)} – Buy Online in India`}
                description={`Shop ${humanize(productsTitle)} at Janaki Sky Innovations – India's biggest drone & electronics store. Genuine products, best prices and fast delivery.`}
                path={`/category/${id}`}
                jsonLd={buildItemListSchema(`${humanize(productsTitle)} Products`, products, (p) => `/product/${p._id}`)}
            />

            {/* Category Hero Banner (No overlaid text - clean visual banner) */}
            {bannerImage && (
                <div 
                    className="category-hero" 
                    style={{ backgroundImage: `url(${bannerImage})` }}
                >
                    {bannerLink && <Link to={bannerLink} className="category-hero-link" title={bannerLink} aria-label="Shop category" />}
                </div>
            )}

            <div className="container" style={{ padding: '30px 0 60px' }}>

                {/* ═══════════════════════════════════════════════════════════════════
                    LEVEL 1: CATEGORY CLICKED → SHOW RELATED SUB-CATEGORIES ONLY
                    ═══════════════════════════════════════════════════════════════════ */}
                {!isDirect && hasSubCategories && !currentSub && (
                    <section className="category-hierarchy-container" aria-label="Sub Categories">
                        <div className="category-hierarchy-header">
                            <div className="category-hierarchy-title-group">
                                <h2 className="category-hierarchy-title">
                                    <Layers size={22} color="var(--primary-orange, #ff8f00)" />
                                    <span>Categories in {activeCategory.name}</span>
                                </h2>
                                <div className="category-hierarchy-crumb">
                                    <Link to="/">Home</Link>
                                    <ChevronRight size={13} />
                                    <Link to="/all-categories">All Categories</Link>
                                    <ChevronRight size={13} />
                                    <span className="crumb-active">{activeCategory.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid of Sub-Category Cards (matching customer-facing cards in image) */}
                        <div className="category-hierarchy-grid">
                            {activeCategory.subCategories.map((sub, idx) => {
                                const subSubCount = (sub.subSubCategories || []).length;
                                return (
                                    <button
                                        key={sub._id || idx}
                                        type="button"
                                        className="cat-hierarchy-card"
                                        onClick={() => handleSubClick(sub.name)}
                                    >
                                        <div className="cat-hierarchy-card-top">
                                            <span className="cat-hierarchy-card-emoji">{getSubEmoji(sub.name)}</span>
                                            <span className="cat-hierarchy-card-status">
                                                {subSubCount > 0 ? `${subSubCount} TYPES` : 'BROWSE'}
                                            </span>
                                        </div>
                                        <span className="cat-hierarchy-card-name">{sub.name}</span>
                                        <span className="cat-hierarchy-card-meta">
                                            {subSubCount > 0
                                                ? sub.subSubCategories.slice(0, 3).join(', ') + (subSubCount > 3 ? '...' : '')
                                                : 'Explore dedicated products'
                                            }
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="cat-bypass-wrap">
                            <button 
                                type="button" 
                                className="cat-bypass-link" 
                                onClick={handleBypassToProducts}
                            >
                                <span>Or view all {activeCategory.name} products directly</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    LEVEL 2: SUB-CATEGORY CLICKED → SHOW SUB-SUBCATEGORIES ONLY (IF PRESENT)
                    ═══════════════════════════════════════════════════════════════════ */}
                {!isDirect && currentSub && hasSubSubCategories && !currentSubSub && (
                    <section className="category-hierarchy-container" aria-label="Sub-Sub Categories">
                        <button 
                            type="button" 
                            className="cat-drilldown-back-btn" 
                            onClick={handleBackToSubs}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to {activeCategory?.name || 'Category'} Sub-Categories</span>
                        </button>

                        <div className="category-hierarchy-header" style={{ borderBottom: 'none', marginBottom: '14px' }}>
                            <div className="category-hierarchy-title-group">
                                <h2 className="category-hierarchy-title">
                                    <Tag size={22} color="var(--primary-orange, #ff8f00)" />
                                    <span>Types in {currentSub}</span>
                                </h2>
                                <div className="category-hierarchy-crumb">
                                    <Link to="/">Home</Link>
                                    <ChevronRight size={13} />
                                    <button type="button" className="crumb-btn" onClick={handleBackToSubs}>
                                        {activeCategory?.name}
                                    </button>
                                    <ChevronRight size={13} />
                                    <span className="crumb-active">{currentSub}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid of Sub-Sub-Category Cards */}
                        <div className="cat-subsub-grid">
                            {selectedSubObj.subSubCategories.map((ssub, sidx) => (
                                <button
                                    key={sidx}
                                    type="button"
                                    className="cat-subsub-card"
                                    onClick={() => handleSubSubClick(ssub)}
                                >
                                    <div className="cat-subsub-card-icon">
                                        <span>🔖</span>
                                    </div>
                                    <div className="cat-subsub-card-body">
                                        <span className="cat-subsub-card-title">{ssub}</span>
                                        <span className="cat-subsub-card-hint">Browse products</span>
                                    </div>
                                    <ChevronRight size={18} className="cat-subsub-card-arrow" />
                                </button>
                            ))}
                        </div>

                        <div className="cat-bypass-wrap">
                            <button 
                                type="button" 
                                className="cat-bypass-link" 
                                onClick={handleBypassToProducts}
                            >
                                <span>Or view all {currentSub} products directly</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    LEVEL 3 / DIRECT: PRODUCTS DISPLAYED AT THE LAST
                    ═══════════════════════════════════════════════════════════════════ */}
                {shouldShowProducts && (
                    <>
                        {/* Back button when drilled down to product view */}
                        {!isDirect && currentSubSub && (
                            <button 
                                type="button" 
                                className="cat-drilldown-back-btn" 
                                onClick={handleBackToSubSubs}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to {currentSub} Types</span>
                            </button>
                        )}
                        {!isDirect && currentSub && !hasSubSubCategories && (
                            <button 
                                type="button" 
                                className="cat-drilldown-back-btn" 
                                onClick={handleBackToSubs}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to {activeCategory?.name || 'Category'} Sub-Categories</span>
                            </button>
                        )}

                        {/* Products Header */}
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', textTransform: 'capitalize' }}>
                                    Products in {productsTitle}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
                                    Showing {products.length} product{products.length !== 1 ? 's' : ''} available
                                </p>
                            </div>
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
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                                    No products found in {productsTitle}.
                                </h4>
                                <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
                                    Try selecting another category or check back later!
                                </p>
                                {currentSub && (
                                    <button
                                        type="button"
                                        className="cat-drilldown-back-btn"
                                        onClick={handleBackToSubs}
                                        style={{ margin: '0 auto' }}
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Browse other {activeCategory?.name || 'category'} sub-categories</span>
                                    </button>
                                )}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
