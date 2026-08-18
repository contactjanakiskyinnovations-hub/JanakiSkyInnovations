import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductFilterSort from '../../components/ProductFilterSort/ProductFilterSort';
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import '../../components/ViewToggle/ViewToggle.css';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';
import Seo from '../../utils/seo';

const NewArrivals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const [filterState, setFilterState] = useState({
        sort: 'newest',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        name: ''
    });

    useEffect(() => {
        const fetchNewArrivals = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('pageNumber', page);
                params.append('limit', 8);
                params.append('collection', 'new-arrivals');
                params.append('sortBy', filterState.sort || 'newest');
                if (filterState.minPrice) params.append('minPrice', filterState.minPrice);
                if (filterState.maxPrice) params.append('maxPrice', filterState.maxPrice);
                if (filterState.minRating) params.append('minRating', filterState.minRating);
                if (filterState.name) params.append('name', filterState.name);
                const { data } = await api.get(`/api/products?${params.toString()}`);
                setProducts(data.products);
                setPages(data.pages);
            } catch (error) {
                console.error('Failed to fetch new arrivals:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, [page, filterState]);

    return (
        <div className="new-arrivals-page" style={{ padding: '60px 0' }}>
            <Seo title="New Arrivals – Latest Drones & Electronics" description="Be the first to get the latest drone technology and robotics components. Shop new arrivals at Janaki Sky Innovations." path="/new-arrivals" />
            <div className="container">
                <div style={{
                    background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    padding: '80px 40px',
                    borderRadius: '24px',
                    color: 'white',
                    marginBottom: '60px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                }}>
                    <h1 style={{ fontSize: '52px', fontWeight: '800', marginBottom: '15px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>NEW ARRIVALS</h1>
                    <p style={{ fontSize: '20px', opacity: '0.95', maxWidth: '600px', margin: '0 auto', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Be the first to get the latest drone technology and robotics components.</p>
                </div>

                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderLeft: '8px solid var(--primary-orange)', paddingLeft: '20px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#333' }}>Just Landed</h3>
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

export default NewArrivals;
