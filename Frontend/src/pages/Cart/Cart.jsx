import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Cart.css';
import Seo from '../../utils/seo';

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
    const { isLoggedIn, user, refreshProfile } = useAuth();
    const [orderError, setOrderError] = useState('');

    // Prices already include 13% VAT. Delivery is FREE above ₹2,000, otherwise ₹150.
    const subtotal = Math.round(cartTotal * 100) / 100; // VAT-inclusive subtotal
    const deliveryAmount = subtotal >= 2000 ? 0 : 150;
    const grandTotal = Math.round((subtotal + deliveryAmount) * 100) / 100;
    const [shippingAddress, setShippingAddress] = useState({
        address: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zip: user?.address?.zip || '',
        country: user?.address?.country || 'India',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOrderReview, setShowOrderReview] = useState(false);

    // Fetch the latest profile (incl. saved address) so the checkout form
    // pre-fills with the user's real saved address from MongoDB.
    useEffect(() => {
        if (!isLoggedIn || !user) return;
        refreshProfile().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync the address fields whenever the user/address changes
    useEffect(() => {
        if (isLoggedIn && user?.address) {
            setShippingAddress(prev => ({
                ...prev,
                address: user.address.street || prev.address,
                city: user.address.city || prev.city,
                state: user.address.state || prev.state,
                zip: user.address.zip || prev.zip,
                country: user.address.country || prev.country || 'India',
            }));
        }
    }, [user, isLoggedIn]);

        const handleCheckout = () => {
        if (!isLoggedIn) {
            sessionStorage.setItem('redirectAfterLogin', '/cart');
            window.dispatchEvent(new CustomEvent('toggleAuthModal'));
            return;
        }

        if (Object.values(shippingAddress).some(value => !value.trim())) {
            alert('Please provide a complete delivery address.');
            return;
        }

        setOrderError('');
        // Open the order-summary confirmation screen first
        setShowOrderReview(true);
    };

    // Confirm the reviewed order (incl. COD payment) and place it
    const placeOrderConfirmed = async () => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/api/orders', {
                orderItems: cartItems.map(item => ({
                    product: item._id || item.id,
                    qty: item.quantity,
                })),
                shippingAddress,
                paymentMethod: 'Cash on Delivery',
            });
            clearCart();
            setShowOrderReview(false);
            // Navigate to the success page with the created order ID
            navigate(`/order-success/${data._id}`, { replace: true });
        } catch (error) {
            setOrderError(error.response?.data?.message || 'Unable to place your order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartCount === 0) {
        return (
            <div className="empty-cart-container">
                <ShoppingBag size={80} strokeWidth={1} />
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <Link to="/" className="start-shopping-btn">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <Seo noindex title="Shopping Cart" description="Review your cart and complete checkout at Janaki Sky Innovations." path="/cart" />
            <div className="container">
                <div className="cart-header">
                    <Link to="/" className="back-link"><ArrowLeft size={18} /> Continue Shopping</Link>
                    <h1>Shopping Cart ({cartCount})</h1>
                </div>

                <div className="cart-content-layout">
                    <div className="cart-items-section">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item-card">
                                <div className="item-image">
                                    <img src={item.image} alt={item.name} />
                                </div>
                                <div className="item-details">
                                    <div className="item-header">
                                        <h3>{item.name}</h3>
                                        <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="item-sku">SKU: {item.sku}</p>
                                    <div className="item-footer">
                                        <div className="quantity-controls">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn"><Minus size={16} /></button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn"><Plus size={16} /></button>
                                        </div>
                                        <div className="item-price">
                                            <span className="unit-total">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-section">
                        <div className="summary-card">
                            <h3>Order Summary</h3>
                            <div className="summary-row"><span>Subtotal <small>(VAT incl.)</small></span><span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                            <div className="summary-row"><span>Delivery</span><span className={deliveryAmount === 0 ? 'free-shipping' : ''}>{deliveryAmount === 0 ? 'FREE' : `₹${deliveryAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span></div>
                            <hr />
                            <div className="summary-row total"><span>Total</span><span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                            {isLoggedIn && (
                                <div className="shipping-address-form">
                                    <h4>Delivery Address</h4>
                                    {Object.entries(shippingAddress).map(([field, value]) => (
                                        <input
                                            key={field}
                                            type="text"
                                            placeholder={field === 'address' ? 'Street address' : field.charAt(0).toUpperCase() + field.slice(1)}
                                            value={value}
                                            onChange={(event) => setShippingAddress(previous => ({ ...previous, [field]: event.target.value }))}
                                        />
                                    ))}
                                </div>
                            )}
                            {orderError && (
                                <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: '600', marginTop: '12px', textAlign: 'center' }}>
                                    {orderError}
                                </div>
                            )}
                            <button className="checkout-btn" onClick={handleCheckout} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                        PLACING ORDER...
                                    </>
                                ) : isLoggedIn ? 'PLACE ORDER' : 'LOGIN TO CHECKOUT'}
                            </button>
                            {isSubmitting && (
                                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
                                    Please wait while we confirm your order...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showOrderReview && (
                <div className="order-review-backdrop" onClick={() => !isSubmitting && setShowOrderReview(false)}>
                    <div className="order-review-modal" onClick={e => e.stopPropagation()}>
                        <div className="order-review-header">
                            <h3>Confirm Your Order</h3>
                            <button
                                type="button"
                                className="review-close"
                                onClick={() => !isSubmitting && setShowOrderReview(false)}
                                disabled={isSubmitting}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="review-section">
                            <h4>Delivery Address</h4>
                            <div className="review-address">
                                {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}, {shippingAddress.country}
                            </div>
                        </div>

                        <div className="review-section">
                            <h4>Payment Method</h4>
                            <div className="review-payment">
                                <span className="payment-badge review-cod">Cash on Delivery (COD)</span>
                            </div>
                        </div>

                        <div className="review-section">
                            <h4>Order Summary</h4>
                            <div className="review-summary">
                                <div className="review-row"><span>Subtotal (VAT incl.)</span><span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                                <div className="review-row"><span>Delivery</span><span className={deliveryAmount === 0 ? 'free-shipping' : ''}>{deliveryAmount === 0 ? 'FREE' : `₹${deliveryAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span></div>
                                <div className="review-row review-total"><span>Total</span><span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                            </div>
                        </div>

                        {orderError && (
                            <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: '600', margin: '0 24px 12px', textAlign: 'center' }}>
                                {orderError}
                            </div>
                        )}

                        <div className="review-actions">
                            <button
                                type="button"
                                className="review-cancel"
                                onClick={() => !isSubmitting && setShowOrderReview(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="review-place"
                                onClick={placeOrderConfirmed}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                        PLACING ORDER...
                                    </>
                                ) : 'CONFIRM & PLACE ORDER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
