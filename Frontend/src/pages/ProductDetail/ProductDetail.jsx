import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Loader2, CheckCircle2, ChevronRight, Info, Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductFilterSort from '../../components/ProductFilterSort/ProductFilterSort';
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import '../../components/ViewToggle/ViewToggle.css';
import WhatsappIcon from '../../components/icons/WhatsappIcon';
import './ProductDetail.css';
import { withVat, formatINR } from '../../utils/price';
import Seo, { buildProductSchema, buildBreadcrumbSchema } from '../../utils/seo';


const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart, toggleWishlist, wishlistItems, cartItems, updateQuantity } = useCart();
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState('');
    const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'comparison'
    const [quantity, setQuantity] = useState(1);
    const [relatedViewMode, setRelatedViewMode] = useState('grid');
    const [relatedFilterState, setRelatedFilterState] = useState({
        sort: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        name: ''
    });

    // Track cart item for this product (declared early to respect Rules of Hooks)
    const cartItem = cartItems.find(item => (item._id || item.id) === id);
    const isInCart = !!cartItem;
    const cartQty = cartItem?.quantity || 0;

    // Sync quantity stepper with cart when product loads or cart changes
    useEffect(() => {
        if (isInCart && cartQty > 0) {
            setQuantity(cartQty);
        }
    }, [isInCart, cartQty, id]);

    const filteredSimilarProducts = useMemo(() => {
        let result = [...similarProducts];
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
    }, [similarProducts, relatedFilterState]);

    useEffect(() => {
        const fetchProductAndSimilar = async () => {
            setLoading(true);
            try {
                // Fetch main product details
                const { data } = await api.get(`/api/products/${id}`);
                setProduct(data);
                setActiveImage(data.mainImage || (data.gallery && data.gallery[0]) || '/placeholder.png');

                // Fetch recommendations from optimized related endpoint
                const { data: recommended } = await api.get(`/api/products/${id}/related`);
                setSimilarProducts(recommended || []);
            } catch (error) {
                console.error('Failed to fetch product details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductAndSimilar();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="spin" size={40} color="var(--primary-orange)" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                <h2>Product not found</h2>
                <Link to="/" className="back-btn" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px', background: 'var(--primary-orange)', color: 'white', padding: '10px 24px', borderRadius: '8px' }}>Back to Home</Link>
            </div>
        );
    }

    const getWhatsAppNumber = () => {
        return '917742228345';
    };

    // Stock handling for product detail page
    const productStock = Number(product?.stock);
    const isOutOfStock = Number.isFinite(productStock) && productStock <= 0;

    const handleAddToCart = () => {
        if (isOutOfStock && !product.forcePreOrder) return;
        const maxQty = product.forcePreOrder ? 99 : productStock;
        if (isInCart) {
            // If already in cart, increase by 1
            if (quantity < maxQty) {
                updateQuantity(product._id, 1);
                setQuantity(prev => Math.min(prev + 1, maxQty));
            }
        } else {
            addToCart(product, quantity);
        }
    };

    const handleQuantityDecrease = () => {
        if (quantity <= 1 && !isInCart) return;
        if (isInCart) {
            // When in cart, updateQuantity will remove the item at 0
            updateQuantity(product._id, -1);
        }
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleQuantityIncrease = () => {
        const maxQty = product.forcePreOrder ? 99 : productStock;
        if (quantity >= maxQty) return;
        if (isInCart) {
            updateQuantity(product._id, 1);
        }
        setQuantity(prev => Math.min(prev + 1, maxQty));
    };

    const isWishlisted = wishlistItems.some(item => (item._id || item.id) === product?._id);

    const handleWishlistToggle = () => {
        toggleWishlist(product);
    };

    // Parse description for paragraph splitting or bullet points
    const renderDescription = () => {
        if (!product.description) return null;
        
        const lines = product.description.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map((line, idx) => {
            if (line.startsWith('●')) {
                const cleanLine = line.substring(1).trim();
                // Highlight headers if they have a dash/colon
                if (cleanLine.includes('–')) {
                    const parts = cleanLine.split('–');
                    return (
                        <div key={idx} className="overview-bullet-item">
                            <span className="bullet-dot"></span>
                            <p>
                                <strong>{parts[0].trim()}</strong> – {parts.slice(1).join('–').trim()}
                            </p>
                        </div>
                    );
                }
                return (
                    <div key={idx} className="overview-bullet-item">
                        <span className="bullet-dot"></span>
                        <p>{cleanLine}</p>
                    </div>
                );
            }
            return <p key={idx} className="overview-paragraph">{line}</p>;
        });
    };

    // Render In the Box items list
    const renderInTheBox = () => {
        if (!product.inTheBox) {
            return (
                <div className="empty-box-info">
                    <Info size={18} />
                    <span>Refer to the product manual for standard package details.</span>
                </div>
            );
        }
        
        const items = product.inTheBox.split('\n').map(l => l.trim()).filter(Boolean);
        return (
            <div className="in-box-grid">
                {items.map((item, idx) => {
                    const cleanItem = item.startsWith('●') ? item.substring(1).trim() : item;
                    return (
                        <div key={idx} className="in-box-item">
                            <CheckCircle2 className="in-box-icon" size={18} />
                            <span>{cleanItem}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const comparisonTable = product.comparisonTable;
    const hasComparisonTable = comparisonTable?.isEnabled && comparisonTable.rows?.length > 0;

    return (
        <div className="product-detail-page">
            {product ? (
                <Seo
                    title={product.name}
                    description={product.shortSummary || product.description}
                    image={product.mainImage || (product.gallery && product.gallery[0]) || ''}
                    path={`/product/${product._id}`}
                    ogType="product"
                    jsonLd={[
                        buildProductSchema(product),
                        buildBreadcrumbSchema([
                            { name: 'Home', path: '/' },
                            { name: product.category || 'Products', path: `/category/${String(product.category || 'products').toLowerCase().replace(/\s+/g, '-')}` },
                            { name: product.name, path: `/product/${product._id}` },
                        ]),
                    ]}
                />
            ) : (
                <Seo title="Product Details" path={`/product/${id}`} />
            )}
            <div className="container">
                <div className="product-main-info">
                    {/* Left Side: Product Gallery */}
                    <div className="product-gallery">
                        <div className="main-image-container">
                            <img src={activeImage} alt={product.name} />
                        </div>
                        {product.gallery && product.gallery.length > 1 && (
                            <div className="gallery-thumbnails">
                                {product.gallery.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`thumbnail-wrapper ${activeImage === img ? 'active' : ''}`}
                                        onClick={() => setActiveImage(img)}
                                    >
                                        <img src={img} alt={`${product.name} gallery ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Side: Product Order Form */}
                    <div className="product-details-content">
                        {product.isFeatured && <span className="new-tag">FEATURED TECH</span>}
                        <h1 className="product-title">{product.name}</h1>
                        <span className="product-detail-sku">SKU: {product.sku}</span>

                        <div className="rating-row">
                            <div className="stars">
                                {'★'.repeat(Math.floor(product.ratings || 5))}
                                {'☆'.repeat(5 - Math.floor(product.ratings || 5))}
                            </div>
                            <span className="reviews-count">({product.numReviews || 0} customer reviews)</span>
                        </div>

                        <div className="price-section">
                            {(product.oldPrice || (product.discountPrice > 0 && product.discountPrice < product.price)) && (
                                <span className="detail-old-price">{formatINR(withVat(product.oldPrice || product.price), { decimals: false })}</span>
                            )}
                            <div className="detail-current-price-row">
                                <span className="detail-current-price">{formatINR(withVat(product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price))}</span>
                                <span className="detail-gst-text">(VAT Included)</span>
                            </div>
                        </div>

                        <p className="short-summary">
                            {product.shortSummary || product.description}
                        </p>

                        {/* Stock availability indicator */}
                        <div className="detail-stock-status">
                            {product.forcePreOrder ? (
                                <span className="detail-stock-label preorder">
                                    <span className="stock-dot preorder"></span>
                                    Pre-Order — ships when stock arrives
                                </span>
                            ) : isOutOfStock ? (
                                <span className="detail-stock-label out">
                                    <span className="stock-dot out"></span>
                                    Currently Out of Stock
                                </span>
                            ) : (
                                <span className="detail-stock-label in">
                                    <span className="stock-dot in"></span>
                                    {productStock > 0 && productStock <= 5 
                                        ? `Only ${productStock} left in stock` 
                                        : 'In Stock & Ready to Ship'}
                                </span>
                            )}
                        </div>

                        <div className="product-action-buttons">
                            {isOutOfStock && !product.forcePreOrder ? (
                                <>
                                    <button className="buy-whatsapp-btn" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                                        <WhatsappIcon /> Out of Stock — Enquire on WhatsApp
                                    </button>
                                    <button 
                                        className={`wishlist-detail-btn ${isWishlisted ? 'active' : ''}`} 
                                        onClick={handleWishlistToggle}
                                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                    >
                                        <Heart size={20} fill={isWishlisted ? "var(--primary-orange)" : "none"} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Row 1: Buy Now (left) + Wishlist (right) */}
                                    <button className="buy-whatsapp-btn" onClick={() => { const msg = `Hi, I am interested in ${product.name} (SKU: ${product.sku})`; window.open(`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(msg)}`, '_blank'); }}>
                                        <WhatsappIcon /> Buy Now on WhatsApp
                                    </button>
                                    <button 
                                        className={`wishlist-detail-btn ${isWishlisted ? 'active' : ''}`} 
                                        onClick={handleWishlistToggle}
                                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                    >
                                        <Heart size={20} fill={isWishlisted ? "var(--primary-orange)" : "none"} />
                                    </button>

                                    {/* Row 2: Add to Cart (left/main) + Quantity stepper (right, below wishlist) */}
                                    <div className="detail-action-row-2">
                                        <button className="add-cart-detail-btn" onClick={handleAddToCart}>
                                            <ShoppingCart size={18} />
                                            {isInCart ? 'Add More to Cart' : 'Add to Cart'}
                                        </button>
                                        <div className="detail-quantity-stepper">
                                            <button 
                                                className="detail-qty-btn" 
                                                onClick={handleQuantityDecrease}
                                                title="Decrease quantity (removes at 0)"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="detail-qty-value">{quantity}</span>
                                            <button 
                                                className="detail-qty-btn" 
                                                onClick={handleQuantityIncrease}
                                                disabled={quantity >= (product.forcePreOrder ? 99 : productStock)}
                                                title="Increase quantity"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Restructured Two-Column Product Details section */}
                <div className="details-two-column-layout">
                    {/* Left Column: Product Overview and Box Accessories */}
                    <div className="left-details-column">
                        <div className="details-card">
                            <div className="card-header">
                                <h2>Product Overview</h2>
                            </div>
                            <div className="card-body overview-text">
                                {renderDescription()}
                            </div>
                        </div>

                        {product.keyFeatures?.trim() ? (
                            <div className="details-card key-features-card">
                                <div className="card-header">
                                    <h2>Key Features</h2>
                                </div>
                                <div className="card-body">
                                    <div className="key-features-list">
                                        {product.keyFeatures
                                            .split('\n')
                                            .map(f => f.trim())
                                            .filter(f => f.length > 0)
                                            .map((feature, idx) => {
                                                const cleanFeature = feature.startsWith('●') ? feature.substring(1).trim() : feature;
                                                if (!cleanFeature) return null;
                                                return (
                                                    <div key={idx} className="key-feature-item">
                                                        <span className="feature-number">{idx + 1}</span>
                                                        <p>{cleanFeature}</p>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="details-card accessories-card">
                            <div className="card-header">
                                <h2>Accessorise in the Box</h2>
                            </div>
                            <div className="card-body">
                                {renderInTheBox()}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tabbed Specifications & Comparison Table */}
                    <div className="right-details-column">
                        <div className="details-card interactive-tabs-card">
                            <div className="tabs-header-nav">
                                <button 
                                    className={`tab-nav-btn ${activeTab === 'specs' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('specs')}
                                >
                                    Specifications
                                </button>
                                {hasComparisonTable && (
                                    <button 
                                        className={`tab-nav-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('comparison')}
                                    >
                                        Comparison Table
                                    </button>
                                )}
                            </div>
                            
                            <div className="card-body tab-content-body">
                                {activeTab === 'specs' && (
                                    <div className="specs-tab-view animate-fade-in">
                                        <div className="specs-table-container">
                                            <table className="specs-premium-table">
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th>Specification</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td><strong>Model SKU</strong></td>
                                                        <td>{product.sku}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Main Category</strong></td>
                                                        <td>{product.category?.name || product.category || 'N/A'}</td>
                                                    </tr>
                                                    {product.subCategory && (
                                                        <tr>
                                                            <td><strong>Sub-Category</strong></td>
                                                            <td>{product.subCategory}</td>
                                                        </tr>
                                                    )}
                                                    {product.specifications && Object.entries(product.specifications).length > 0 ? (
                                                        Object.entries(product.specifications).map(([key, value]) => (
                                                            <tr key={key}>
                                                                <td><strong>{key}</strong></td>
                                                                <td>{value}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" style={{ textAlign: 'center', color: '#64748b' }}>
                                                                No technical specifications listed for this product.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'comparison' && hasComparisonTable && (
                                    <div className="comparison-tab-view animate-fade-in">
                                        <div className="comparison-table-container">
                                            <table className="comparison-premium-table">
                                                <thead>
                                                    <tr>
                                                        <th>Feature</th>
                                                        <th className="highlight-column">{product.name}</th>
                                                        <th>{comparisonTable.comparisonProductOneName || 'Comparison Product 1'}</th>
                                                        <th>{comparisonTable.comparisonProductTwoName || 'Comparison Product 2'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {comparisonTable.rows.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{row.feature}</strong></td>
                                                            <td className="highlight-column-cell">{row.selectedProductValue}</td>
                                                            <td>{row.comparisonProductOneValue}</td>
                                                            <td>{row.comparisonProductTwoValue}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

{/* Product Reviews */}
                {(product.reviews || []).length > 0 && (
                    <section className="product-reviews-section" style={{ marginTop: '60px' }}>
                        <div className="similar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <p className="section-label">What Our Customers Say</p>
                                <h3 className="section-title">Customer Reviews ({product.reviews.length})</h3>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{Number(product.ratings || 0).toFixed(1)}</span>
                                <span style={{ display: 'inline-flex', gap: 2, color: '#FF8F00' }}>
                                    {[1, 2, 3, 4, 5].map((s) => (<Star key={s} size={16} fill={s <= Math.round(product.ratings || 0) ? 'currentColor' : 'none'} stroke="none" />))}
                                </span>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>{product.numReviews || 0} rating{Number(product.numReviews || 0) !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = (product.reviews || []).filter(r => Number(r.rating) === star).length;
                                const pct = (product.reviews || []).length ? (count / (product.reviews || []).length) * 100 : 0;
                                return (
                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                                        <span style={{ width: '24px' }}>{star}★</span>
                                        <div style={{ flex: 1, height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#FF6A3D' }} />
                                        </div>
                                        <span style={{ width: '28px', textAlign: 'right' }}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {product.reviews.map((review, idx) => (
                                <div key={review._id || idx} style={{ display: 'flex', gap: '14px', padding: '16px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                                        {String(review.name || 'C').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{review.name || 'Customer'}</span>
                                            <span style={{ display: 'inline-flex', gap: 2, color: '#FF8F00' }}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={13} fill={s <= (review.rating || 0) ? 'currentColor' : 'none'} />
                                                ))}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                                            {review.isVisible === false
                                                ? <em style={{ color: '#94a3b8' }}>Comment hidden by moderation.</em>
                                                : (review.comment || 'No comment provided.')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {/* Related Products Section */}
                {similarProducts.length > 0 && (
                    <div className="similar-products-section">
                        <div className="similar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p className="section-label">You Might Also Like</p>
                                <h3 className="section-title">Related Products</h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ViewToggle view={relatedViewMode} onViewChange={setRelatedViewMode} />
                                <ProductFilterSort 
                                    currentFilters={relatedFilterState} 
                                    onFilterChange={(newFilters) => setRelatedFilterState(newFilters)} 
                                />
                            <Link to={`/product/${product._id}/related`} className="view-all-btn">
                                View All <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                        <div className={relatedViewMode === 'list' ? 'product-list-view' : 'similar-products-grid'}>
                            {filteredSimilarProducts.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                                    No related products match your selected filters.
                                </div>
                            ) : (
                                filteredSimilarProducts.map(p => (
                                    <ProductCard key={p._id} product={p} />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
