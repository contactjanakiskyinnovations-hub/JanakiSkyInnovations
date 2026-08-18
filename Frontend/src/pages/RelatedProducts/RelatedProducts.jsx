import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import Seo from '../../utils/seo';

const RelatedProducts = () => {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/products/${id}/related?limit=24`);
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch related products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedProducts();
        window.scrollTo(0, 0);
    }, [id]);

    return (
        <div className="related-products-page" style={{ padding: '60px 0' }}>
            <Seo title="Related Products – Similar Drones & Electronics" description="Explore products selected for their category, brand, features and price range at Janaki Sky Innovations." path={`/product/${id}/related`} />
            <div className="container">
                <Link to={`/product/${id}`} className="back-link">← Back to product</Link>
                <h1 style={{ margin: '20px 0 8px' }}>More Related Products</h1>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>Explore products selected for their category, brand, features, and price range.</p>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Loader2 className="spin" size={40} color="var(--primary-orange)" /></div>
                ) : products.length > 0 ? (
                    <>
                        <div className="product-grid-view">
                            {products.map(product => <ProductCard key={product._id} product={product} />)}
                        </div>
                        {products.length < 4 && (
                            <div style={{ marginTop: '32px', textAlign: 'center', padding: '28px', background: '#fff7ed', borderRadius: '14px' }}>
                                <h3>That’s all the close matches for now.</h3>
                                <p style={{ color: '#64748b' }}>More products will appear here as the catalogue grows.</p>
                                <Link to="/all-categories" className="view-all-btn">Explore All Products</Link>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff7ed', borderRadius: '14px' }}>
                        <h3>We couldn’t find related products yet.</h3>
                        <p style={{ color: '#64748b' }}>Explore the complete catalogue to find what you need.</p>
                        <Link to="/all-categories" className="view-all-btn">Explore All Products</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedProducts;
