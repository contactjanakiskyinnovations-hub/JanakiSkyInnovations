import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Plus, Check, Minus, Flag, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import WhatsappIcon from '../icons/WhatsappIcon';
import './ProductCard.css';
import { withVat, formatINR } from '../../utils/price';

const ProductCard = ({ product, showWishlist = true, onAddToCart = null }) => {
    const navigate = useNavigate();
    const { addToCart, updateQuantity, toggleWishlist, wishlistItems, cartItems } = useCart();
    const [error, setError] = useState('');

    // Safely extract fields for live MongoDB database objects
    const id = product._id || product.id;
    const sku = product.sku;
    const name = product.name;
    const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
    const price = hasDiscount ? product.discountPrice : product.price;
    const oldPrice = product.oldPrice || (hasDiscount ? product.price : null);
    const image = product.mainImage || product.image || product.gallery?.[0] || (product.images && product.images[0]) || '/placeholder.png';

    // Stock handling
    const stock = Number(product.stock);
    const outOfStock = Number.isFinite(stock) && stock <= 0;
    const forcePreOrder = product.forcePreOrder === true;

    const isWishlisted = wishlistItems.some(item => (item._id || item.id) === id);
    const cartItem = cartItems.find(item => (item._id || item.id) === id);
    const isInCart = !!cartItem;
    const cartQuantity = cartItem?.quantity || 0;

    const formattedPrice = formatINR(withVat(price));

    const formattedOldPrice = oldPrice ? formatINR(withVat(oldPrice), { decimals: false }) : null;

    const [showPreOrderModal, setShowPreOrderModal] = useState(false);
    const [preOrderNote, setPreOrderNote] = useState('');

    const handleClick = () => {
        navigate(`/product/${id}`);
    };

    const handleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlist(product);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        setError('');
        if (outOfStock && !forcePreOrder) {
            setError('This product is currently out of stock.');
            return;
        }
        // Pre-order: add to cart directly so the order is recorded as a Pre-Order
        if (outOfStock && forcePreOrder) {
            if (onAddToCart) onAddToCart(product);
            else addToCart(product);
            return;
        }
        if (onAddToCart) {
            onAddToCart(product);
        } else {
            addToCart(product);
        }
    };

    const handleQuantityChange = (e, delta) => {
        e.stopPropagation();
        setError('');
        if (!isInCart) return;
        updateQuantity(id, delta);
    };

    const getWhatsAppNumber = () => {
        return '917742228345';
    };

    return (
        <div className={`product-card ${outOfStock ? 'out-of-stock-card' : ''}`} onClick={handleClick} style={{ cursor: 'pointer' }}>
            <div className="product-image">
                <img src={image} alt={name} />
                {/* Stock Status Badge */}
                {outOfStock ? (
                    <>
                        {/* Pre-order badge/flag */}
                        {forcePreOrder && (
                            <span className="preorder-badge" style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, background: 'var(--primary-orange)', color: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>PRE-ORDER AVAILABLE</span>
                        )}
                        {/* Normal out-of-stock state */}
                        {!forcePreOrder && (
                            <span className="out-of-stock-badge" style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, background: '#dc2626', color: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>OUT OF STOCK</span>
                        )}
                        {/* Out-of-stock disabled button for non-pre-order items */}
                        {/* {!forcePreOrder && outOfStock && !isInCart && (
                            <button
                                className="card-action-btn cart-btn disabled-card-btn"
                                disabled
                                title="Out of Stock"
                            >
                                <ShoppingCart size={16} /> Out of Stock1
                            </button>
                        )} */}
                </>
            ) : (
                stock > 0 && stock <= 5 ? (
                    <span className="stock-badge low-stock-badge">Only {stock} left</span>
                ) : (
                    <span className="stock-badge in-stock-badge">IN STOCK</span>
                )
            )}

            </div>



            <div className="product-info">
                <h4 className="product-name">{name}</h4>
                <span className="product-sku">SKU: {sku}</span>

                {/* Stock availability line */}
                <div className="stock-availability">
                    {product.forcePreOrder ? (
                        <span className="stock-text preorder-text">
                            <span className="stock-dot preorder"></span>
                            Pre-Order Available
                        </span>
                    ) : outOfStock ? (
                        <span className="stock-text out-of-stock-text">
                            <span className="stock-dot out"></span>
                            Currently Out of Stock
                        </span>
                    ) : (
                        <span className="stock-text in-stock-text">
                            <span className="stock-dot in"></span>
                            {stock > 0 && stock <= 5 ? `Only ${stock} left in stock` : 'In Stock & Ready to Ship'}
                        </span>
                    )}
                </div>

                <div className="price-container">
                    <div className="price-details">
                        {formattedOldPrice && <span className="old-price-strikethrough">₹{formattedOldPrice}</span>}
                        <div className="current-price-row">
                            <span className="current-price">{formattedPrice}</span>
                            <span className="gst-text">(VAT Included)</span>
                        </div>
                    </div>
                    <div className="card-actions-vertical">
                        {showWishlist && (
                            <button 
                                className={`card-action-btn wishlist-btn ${isWishlisted ? 'active' : ''}`}
                                onClick={handleWishlist}
                                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <Heart size={16} fill={isWishlisted ? "var(--primary-orange)" : "none"} color={isWishlisted ? "var(--primary-orange)" : "currentColor"} />
                            </button>
                        )}
                        {/* Add to Cart / Quantity Stepper */}
                        {outOfStock && !forcePreOrder ? (
                            <button 
                                className="card-action-btn cart-btn disabled-cart-btn"
                                disabled
                                title="Out of Stock"
                            >
                                <ShoppingCart size={16} />
                            </button>
                        ) : isInCart ? (
                            <div className="quantity-stepper" onClick={(e) => e.stopPropagation()}>
                                <button 
                                    className="qty-step-btn"
                                    onClick={(e) => handleQuantityChange(e, -1)}
                                    title="Decrease quantity (removes at 0)"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="qty-value">{cartQuantity}</span>
                                <button 
                                    className="qty-step-btn"
                                    onClick={(e) => handleQuantityChange(e, 1)}
                                    disabled={cartQuantity >= (forcePreOrder ? 99 : stock)}
                                    title="Increase quantity"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                className={`card-action-btn cart-btn`}
                                onClick={handleAddToCart}
                                title="Add to Cart"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="card-error-msg">{error}</div>}
            </div>

            {/* Buy Now — hidden when out of stock */}
            {(!outOfStock || forcePreOrder) && (
                <button className="buy-now-btn" onClick={(e) => { e.stopPropagation(); const msg = `Hi, I am interested in ${name} (SKU: ${sku}${forcePreOrder ? ' — Pre-Order' : ''})`; window.open(`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(msg)}`, '_blank'); }}>
                    <WhatsappIcon /> Buy Now
                </button>
            )}
        </div>
    );
};

export default ProductCard;