import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, CreditCard, Loader2, AlertCircle, ShoppingBag, FileText, Home as HomeIcon, Star } from 'lucide-react';
import api from '../../utils/api';
import { printOrderInvoice } from '../../components/EInvoice/EInvoice';
import './OrderSuccess.css';
import Seo from '../../utils/seo';

const OrderSuccess = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ratings, setRatings] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [ratingError, setRatingError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get(`/api/orders/${id}`);
                setOrder(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load your order details.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleRateProduct = async (productId) => {
        const payload = ratings[productId] || {};
        if (!productId || !payload.rating) return;
        setSubmitting(true);
        setRatingError('');
        try {
            await api.post(`/api/products/${productId}/reviews`, {
                rating: payload.rating,
                comment: payload.comment || '',
                orderId: order._id,
            });
            setRatings(prev => ({ ...prev, [productId]: { ...payload, submitted: true } }));
        } catch (err) {
            setRatingError(err.response?.data?.message || 'Failed to submit your rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="order-success-page">
                <Seo noindex title="Order Status" path={`/order-success/${id}`} />
                <div className="order-success-loading">
                    <Loader2 size={40} className="spin" style={{ color: 'var(--primary-orange)' }} />
                    <p>Loading your order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="order-success-page">
                <Seo noindex title="Order Not Found" path={`/order-success/${id}`} />
                <div className="order-success-error">
                    <AlertCircle size={48} className="error-icon" />
                    <h2 style={{ fontSize: '22px', color: '#0f172a', margin: 0 }}>Order Not Found</h2>
                    <p>{error || 'This order could not be found.'}</p>
                    <Link to="/" className="btn"><HomeIcon size={16} /> Back to Home</Link>
                </div>
            </div>
        );
    }

    const orderNumber = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const totalItems = (order.orderItems || []).reduce((sum, item) => sum + (item.qty || 0), 0);
    const isPaid = order.isPaid;

    // Confetti dots
    const confettiColors = ['#ff8f00', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'];
    const confetti = Array.from({ length: 12 }, (_, i) => ({
        left: `${(i * 8.3) + Math.random() * 4}%`,
        width: `${6 + (i % 3) * 3}px`,
        height: `${10 + (i % 4) * 4}px`,
        background: confettiColors[i % confettiColors.length],
        animationDelay: `${String(i * 0.12).slice(0, 4)}s`,
        animationDuration: `${2.5 + (i % 3) * 0.5}s`,
    }));

    return (
        <div className="order-success-page">
            <Seo noindex title={`Order Confirmed – #${orderNumber}`} description={`Thank you for shopping with Janaki Sky Innovations. Your order ${orderNumber} has been confirmed.`} path={`/order-success/${id}`} />
            <div className="container">
                {/* Success Hero */}
                <div className="success-hero">
                    <div className="confetti-container">
                        {confetti.map((c, i) => (
                            <span key={i} className="confetti-dot" style={c} />
                        ))}
                    </div>
                    <div className="success-checkmark">
                        <div className="success-pulse"></div>
                        <div className="success-checkmark-circle"></div>
                        <div className="success-checkmark-check"></div>
                    </div>
                    <h1>Order Placed Successfully!</h1>
                    <p>Thank you for shopping with Janaki Sky Innovations. Your order has been confirmed.</p>
                    <div className="order-id-chip">
                        <span className="chip-label">Order ID</span>
                        <span className="chip-id">#{orderNumber}</span>
                    </div>
                </div>

                {/* Order Details */}
                <div className="order-success-layout">
                    {/* Left: Items + Address */}
                    <div>
                        <div className="success-card">
                            <h3><Package size={18} /> Order Summary ({totalItems} item{totalItems !== 1 ? 's' : ''})</h3>
                            <div className="order-summary-items">
                                {(order.orderItems || []).map((item, idx) => (
                                    <div key={idx} className="order-summary-item">
                                        <img src={item.image || '/placeholder.png'} alt={item.name} />
                                        <div className="item-info">
                                            <div className="item-name">{item.name}</div>
                                            {item.name && <div className="item-sku"><span className="order-item-sku">SKU: {item.sku || (item.product && typeof item.product === "object" ? item.product.sku : "") || "N/A"}</span> · Qty: {item.qty}</div>}
                                        </div>
                                        <div className="item-price">₹{Number(item.price * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="order-totals">
                                <div className="total-row">
                                    <span>Subtotal <small>(VAT incl.)</small></span>
                                    <span>₹{Number(order.itemsPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="total-row">
                                    <span>Delivery</span>
                                    <span className={Number(order.shippingPrice) === 0 ? 'free-shipping' : ''}>{Number(order.shippingPrice) === 0 ? 'FREE' : `₹${Number(order.shippingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total</span>
                                    <span>₹{Number(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="success-card">
                            <h3><MapPin size={18} /> Delivery Address</h3>
                            <div className="info-block">
                                <div className="info-line">
                                    <strong>{order.shippingAddress?.address || 'N/A'}</strong>
                                </div>
                                <div className="info-line">
                                    {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zip].filter(Boolean).join(', ')}
                                </div>
                                <div className="info-line">{order.shippingAddress?.country || 'India'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment + Status */}
                    <div className="order-success-side">
                        <div className="success-card">
                            <h3><CreditCard size={18} /> Payment Details</h3>
                            <div className="info-block">
                                <div className="info-line"><strong>Method:</strong> {order.paymentMethod || 'Cash on Delivery'}</div>
                                <div className="info-line"><strong>Order Date:</strong> {orderDate}</div>
                                <div className="info-line"><strong>Status:</strong> {order.status || 'Pending'}</div>
                                <div className="info-line"><strong>Order Type:</strong> {order.orderType === 'Pre-Order' ? 'Pre-Order' : 'Normal'}</div>
                                <span className={`info-badge ${isPaid ? '' : 'pending'}`}>
                                    {isPaid ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                                    {isPaid ? 'Paid' : 'Payment on Delivery'}
                                </span>
                            </div>
                        </div>

                        <div className="success-card">
                            <h3><ShoppingBag size={18} /> What's Next?</h3>
                            <div className="info-block">
                                <div className="info-line">We're preparing your order.</div>
                                <div className="info-line">You'll receive updates as your order ships.</div>
                                <div className="info-line">Track your order anytime in your <strong>My Account</strong>.</div>
                            </div>
                            <div className="success-actions" style={{ marginTop: '20px', justifyContent: 'flex-start' }}>
                                <Link to="/account" className="btn btn-outline">View My Orders</Link>
                            </div>
                        </div>
                    </div>
                </div>

{/* Rate Your Products — shown after successful delivery */}
                {(order.isDelivered || order.status === 'Delivered') && (
                    <div className="success-card" style={{ marginTop: '40px', padding: '24px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px' }}><Star size={18} /> Rate Your Products</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                            We'd love your feedback — rate the products delivered with order #{orderNumber}.
                        </p>
                        <div className="rating-list">
                            {(order.orderItems || []).map((item, idx) => {
                                const productId =
                                    (item.product && typeof item.product === 'object' && item.product._id) ||
                                    (typeof item.product === 'string' ? item.product : '');
                                if (!productId) return null;
                                const info = ratings[productId] || {};
                                const done = item.reviewed || !!info.submitted;
                                return (
                                    <div key={item._id || idx} className="rating-item">
                                        <div className="rating-item-head">
                                            <span className="rating-item-name">{item.name}</span>
                                            {item.sku && <span className="rating-item-sku">SKU: {item.sku}</span>}
                                        </div>
                                        {done ? (
                                            <div className="rating-thanks">
                                                ★ {info.rating || ''} Thanks for your feedback!
                                            </div>
                                        ) : (
                                            <div className="rating-form">
                                                <div className="star-row">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            className={`star-btn ${star <= (info.rating || 0) ? 'selected' : ''}`}
                                                            onClick={() => setRatings(prev => ({
                                                                ...prev,
                                                                [productId]: { ...(prev[productId] || {}), rating: star },
                                                            }))}
                                                            title={`${star} star${star > 1 ? 's' : ''}`}
                                                        >
                                                            <Star size={20} fill={star <= (info.rating || 0) ? 'currentColor' : 'none'} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    className="rating-comment"
                                                    placeholder="Add a comment (optional)"
                                                    value={info.comment || ''}
                                                    onChange={(e) => setRatings(prev => ({
                                                        ...prev,
                                                        [productId]: { ...(prev[productId] || {}), comment: e.target.value },
                                                    }))}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-primary rating-submit"
                                                    disabled={!info.rating || submitting}
                                                    onClick={() => handleRateProduct(productId)}
                                                >
                                                    {submitting ? 'Submitting…' : 'Submit Rating'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {ratingError && (
                            <p style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, margin: '12px 0 0' }}>
                                {ratingError}
                            </p>
                        )}
                    </div>
                )}
                                                                {/* Tax Invoice — generated by the backend on Delivery; customers download the e-invoice */}
                <div className="success-card" style={{ marginTop: '40px', padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px' }}><FileText size={18} /> Tax Invoice</h3>
                    {order.isDelivered || order.status === 'Delivered' || order.eInvoice ? (
                        <>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                                Your tax invoice for order #{orderNumber} is ready. Click the button below to download or print it.
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => printOrderInvoice(order)}
                            >
                                <FileText size={16} /> Download Invoice
                            </button>
                        </>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                            Your tax invoice will be generated automatically and available for download here as soon as your order is <strong>Delivered</strong>.
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="success-actions">
                    <Link to="/" className="btn btn-primary"><HomeIcon size={16} /> Continue Shopping</Link>
                    <Link to="/account" className="btn btn-outline"><Package size={16} /> My Orders</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;