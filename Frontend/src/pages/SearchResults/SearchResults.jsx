import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Loader2, PackageSearch, Tag } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductFilterSort from '../../components/ProductFilterSort/ProductFilterSort';
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import '../../components/ViewToggle/ViewToggle.css';
import api from '../../utils/api';
import './SearchResults.css';
import Seo from '../../utils/seo';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const keyword = searchParams.get('q') || '';

    const [products, setProducts] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [viewMode, setViewMode] = useState('grid');
    const [relatedViewMode, setRelatedViewMode] = useState('grid');

    const [filterState, setFilterState] = useState({
        sort: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        name: ''
    });

    const [relatedFilterState, setRelatedFilterState] = useState({
        sort: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        name: ''
    });

    const filteredRelatedProducts = useMemo(() => {
        let result = [...relatedProducts];
        if (relatedFilterState.name) {
            const kw = relatedFilterState.name.toLowerCase();
            result = result.filter(p => p.name?.toLowerCase().includes(kw));
        }
        if (relatedFilterState.minPrice) {
            result = result.filter(p => (p.discountPrice || p.price) >= Number(relatedFilterState.minPrice));
        }
        if (relatedFilterState.maxPrice) {
            result = result.filter(p => (p.discountPrice || p.price) <= Number(relatedFilterState.maxPrice));
        }
        if (relatedFilterState.minRating) {
            result = result.filter(p => (p.ratings || 0) >= Number(relatedFilterState.minRating));
        }
        if (relatedFilterState.sort === 'price_asc') {
            result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        } else if (relatedFilterState.sort === 'price_desc') {
            result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        } else if (relatedFilterState.sort === 'name_asc') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (relatedFilterState.sort === 'name_desc') {
            result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        } else if (relatedFilterState.sort === 'rating_desc') {
            result.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
        } else if (relatedFilterState.sort === 'newest') {
            result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        return result;
    }, [relatedProducts, relatedFilterState]);


    const fetchResults = useCallback(async (kw, pageNum, filters) => {
        if (!kw.trim()) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('keyword', kw);
            params.append('pageNumber', pageNum);
            if (filters.sort) params.append('sortBy', filters.sort);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.minRating) params.append('minRating', filters.minRating);
            if (filters.name) params.append('name', filters.name);

            const { data } = await api.get(`/api/products?${params.toString()}`);
            const results = data.products || [];
            setProducts(results);
            setPage(data.page || 1);
            setPages(data.pages || 1);
            setTotalResults(data.total || results.length || 0);

            // Fetch related products by the category of first result
            if (results.length > 0 && results[0].category) {
                const relRes = await api.get(
                    `/api/products?category=${encodeURIComponent(results[0].category)}&limit=8`
                );
                const mainIds = new Set(results.map(p => p._id));
                const related = (relRes.data.products || []).filter(p => !mainIds.has(p._id));
                setRelatedProducts(related.slice(0, 4));
            } else {
                setRelatedProducts([]);
            }
        } catch (err) {
            console.error('Search failed:', err);
            setProducts([]);
            setRelatedProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        fetchResults(keyword, 1, filterState);
    }, [keyword, filterState, fetchResults]);

    useEffect(() => {
        fetchResults(keyword, page, filterState);
    }, [page]);


    const handleClear = () => {
        navigate('/');
    };

    return (
        <div className="search-results-page">
            <Seo
                noindex
                title={keyword ? `Search Results for "${keyword}"` : 'Search Products'}
                description={keyword ? `Search results for "${keyword}" at Janaki Sky Innovations – India's biggest drone & electronics store.` : "Search the full Janaki Sky Innovations catalogue of drones, robotics and electronics."}
                path={keyword ? `/search?q=${encodeURIComponent(keyword)}` : '/search'}
            />
            <div className="sr-hero">
                <div className="container sr-hero-inner">
                    <div className="sr-hero-text">
                        {keyword ? (
                            <>
                                <p className="sr-label">Search Results for</p>
                                <h1 className="sr-query">
                                    &ldquo;{keyword}&rdquo;
                                    <button className="sr-clear-btn" onClick={handleClear} title="Clear search">
                                        <X size={18} />
                                    </button>
                                </h1>
                                {!loading && (
                                    <p className="sr-count">
                                        {totalResults > 0
                                            ? `Found ${totalResults} product${totalResults !== 1 ? 's' : ''}`
                                            : 'No products matched your search'}
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="sr-label">Search</p>
                                <h1 className="sr-query">Start typing to find products</h1>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="container sr-body">
                {/* Toolbar */}
                <div className="sr-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sr-toolbar-left">
                        <SlidersHorizontal size={16} style={{ color: 'var(--primary-orange)' }} />
                        <span>
                            {loading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''} on this page`}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ViewToggle view={viewMode} onViewChange={setViewMode} />
                        <ProductFilterSort 
                            currentFilters={filterState} 
                            onFilterChange={(newFilters) => { setFilterState(newFilters); setPage(1); }} 
                        />
                    </div>
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="sr-loading">
                        <Loader2 size={44} className="spin" style={{ color: 'var(--primary-orange)' }} />
                        <p>Searching across all products...</p>
                    </div>
                ) : !keyword.trim() ? (
                    <div className="sr-empty">
                        <Search size={60} style={{ opacity: 0.15 }} />
                        <h3>What are you looking for?</h3>
                        <p>Use the search bar above to find drones, components, tools and more.</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="sr-empty">
                        <PackageSearch size={60} style={{ opacity: 0.15, color: 'var(--primary-orange)' }} />
                        <h3>No results for &ldquo;{keyword}&rdquo;</h3>
                        <p>Try a different keyword, check the spelling, or browse our categories.</p>
                        <div className="sr-suggestions">
                            <p className="suggestions-label"><Tag size={14} /> Try searching for:</p>
                            {['Drone', 'Arduino', 'Sensors', 'FPV', 'Battery', 'Motor'].map(s => (
                                <Link key={s} to={`/search?q=${s}`} className="suggestion-chip">{s}</Link>
                            ))}
                        </div>
                        <Link to="/all-categories" className="sr-browse-btn">Browse All Categories</Link>
                    </div>
                ) : (
                    <>
                        <div className={viewMode === 'list' ? 'product-list-view' : 'sr-grid'}>
                            {products.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pages > 1 && (
                            <div className="sr-pagination">
                                <button
                                    className="sr-page-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                >
                                    Previous
                                </button>
                                {[...Array(pages).keys()].map(x => (
                                    <button
                                        key={x + 1}
                                        className={`sr-page-btn ${page === x + 1 ? 'active' : ''}`}
                                        onClick={() => setPage(x + 1)}
                                    >
                                        {x + 1}
                                    </button>
                                ))}
                                <button
                                    className="sr-page-btn"
                                    disabled={page === pages}
                                    onClick={() => setPage(p => Math.min(p + 1, pages))}
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {/* Related Products Section */}
                        {relatedProducts.length > 0 && (
                            <div className="sr-related" style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary-orange)', margin: '0 0 4px' }}>Discover More</p>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0', color: '#0f172a' }}>Related Products</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <ViewToggle view={relatedViewMode} onViewChange={setRelatedViewMode} />
                                        <ProductFilterSort 
                                            currentFilters={relatedFilterState} 
                                            onFilterChange={(newFilters) => setRelatedFilterState(newFilters)} 
                                        />
                                        <Link to="/all-categories" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-orange)', textDecoration: 'none', border: '1.5px solid var(--primary-orange)', padding: '8px 16px', borderRadius: '8px' }}>
                                            Browse All →
                                        </Link>
                                    </div>
                                </div>
                                <div className={relatedViewMode === 'list' ? 'product-list-view' : 'sr-grid'}>
                                    {filteredRelatedProducts.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                                            No related products match your selected filters.
                                        </div>
                                    ) : (
                                        filteredRelatedProducts.map(product => (
                                            <ProductCard key={product._id} product={product} />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
