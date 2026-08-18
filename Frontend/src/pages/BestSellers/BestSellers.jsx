import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductFilterSort from '../../components/ProductFilterSort/ProductFilterSort';
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import '../../components/ViewToggle/ViewToggle.css';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';
import Seo from '../../utils/seo';

const BestSellers = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const [filterState, setFilterState] = useState({
        sort: 'rating',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        name: ''
    });

    useEffect(() => {
        const fetchBestSellers = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('pageNumber', page);
                params.append('limit', 8);
                params.append('collection', 'best-sellers');
                params.append('sortBy', filterState.sort || 'best-sellers');
                if (filterState.minPrice) params.append('minPrice', filterState.minPrice);
                if (filterState.maxPrice) params.append('maxPrice', filterState.maxPrice);
                if (filterState.minRating) params.append('minRating', filterState.minRating);
                if (filterState.name) params.append('name', filterState.name);

                const { data } = await api.get(`/api/products?${params.toString()}`);
                setProducts(data.products);
                setPages(data.pages);
            } catch (error) {
                console.error('Failed to fetch best sellers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBestSellers();
    }, [page, filterState]);

    return (
        <div className="best-sellers-page" style={{ padding: '60px 0' }}>
            <Seo title="Best Sellers – Most Loved Drones & Electronics" description="Most loved products by our community of 100k+ makers. Shop best-selling drones, robotics kits and electronics at Janaki Sky Innovations." path="/best-sellers" />
            <div className="container">
                <div style={{ marginBottom: '60px', borderLeft: '8px solid var(--primary-orange)', paddingLeft: '30px' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '10px' }}>BEST SELLERS</h1>
                    <p style={{ fontSize: '18px', color: '#666' }}>Most loved products by our community of 100k+ makers.</p>
                </div>

                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#333' }}>Top Loved This Week</h3>
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
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>No products found.</h4>
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

export default BestSellers;
