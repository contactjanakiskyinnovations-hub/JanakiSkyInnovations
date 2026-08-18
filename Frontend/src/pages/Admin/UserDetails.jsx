import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    Package, 
    ChevronRight, 
    Clock,
    CheckCircle,
    Loader2,
    Eye,
    Inbox
} from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Service Requests state
    const [serviceRequests, setServiceRequests] = useState([]);
    const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
    const [serviceRequestsError, setServiceRequestsError] = useState('');
    const [selectedServiceRequest, setSelectedServiceRequest] = useState(null);

    const fetchUserDetails = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/api/users/${id}`);
            setUser(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Fetch orders for this specific user (admin-only endpoint)
    const fetchOrders = useCallback(async () => {
        if (!id) return;
        setOrdersLoading(true);
        setOrdersError('');
        try {
            const { data } = await api.get(`/api/orders/user/${id}`);
            setOrders(Array.isArray(data) ? data : []);
            setOrdersError('');
        } catch (err) {
            setOrdersError(err.response?.data?.message || 'Failed to load customer orders');
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    }, [id]);

    // Fetch service requests for this specific user (admin-only endpoint)
    const fetchServiceRequests = useCallback(async () => {
        if (!id) return;
        setServiceRequestsLoading(true);
        setServiceRequestsError('');
        try {
            const { data } = await api.get(`/api/service-requests/user/${id}`);
            setServiceRequests(Array.isArray(data) ? data : []);
            setServiceRequestsError('');
        } catch (err) {
            setServiceRequestsError(err.response?.data?.message || 'Failed to load service requests');
            setServiceRequests([]);
        } finally {
            setServiceRequestsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUserDetails();
        fetchOrders();
        fetchServiceRequests();

        // Real-time polling: refresh orders & service requests every 30 seconds so the admin
        // console always reflects the latest activity for this customer.
        const interval = setInterval(() => {
            fetchOrders();
            fetchServiceRequests();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchUserDetails, fetchOrders, fetchServiceRequests]);

    if (loading) {
        return (
            <div className="user-details-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={40} className="spin" style={{ color: 'var(--primary-orange)', margin: '0 auto 10px' }} />
                    <p style={{ color: '#888' }}>Loading customer profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="user-details-page" style={{ padding: '20px' }}>
                <button onClick={() => navigate('/admin/users')} className="back-link" style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    {'\u2190'} Back to Customers
                </button>
                <div className="admin-card" style={{ padding: '30px', textAlign: 'center', color: '#ff4d4f' }}>
                    <p>{error || 'Customer not found'}</p>
                </div>
            </div>
        );
    }

    const hasAddress = user.address && (user.address.street || user.address.city || user.address.state || user.address.zip);

    // Real-time order stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const completedOrders = orders.filter(o => o.status === 'Delivered').length;

    // Helper: consistent 8-char order ID suffix
    const shortId = (id) => id ? id.toString().slice(-8).toUpperCase() : 'N/A';

    return (
        <div className="user-details-page">
            <div className="page-header-actions">
                <div className="header-text">
                    <button onClick={() => navigate('/admin/users')} className="back-link">
                        Customers
                    </button>
                    <ChevronRight size={16} />
                    <h3>Customer Profile</h3>
                </div>
            </div>

            <div className="user-profile-grid">
                {/* Profile Overview Sidebar */}
                <div className="profile-sidebar">
                    <div className="admin-card user-main-card">
                        <div className="user-avatar-large">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h2>{user.name || 'N/A'}</h2>
                        <span className={`status-badge ${user.role === 'admin' ? 'pending' : 'completed'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                        <p className="user-id-small">User ID: {user._id}</p>
                        
                        <div className="profile-meta">
                            <div className="meta-item">
                                <Mail size={16} />
                                <span>{user.email || 'No email registered'}</span>
                            </div>
                            <div className="meta-item">
                                <Phone size={16} />
                                <span>{user.mobile || 'No mobile registered'}</span>
                            </div>
                            <div className="meta-item">
                                <Calendar size={16} />
                                <span>Joined: {new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card address-card">
                        <h4>Default Shipping Address</h4>
                        <div className="address-content">
                            <MapPin size={20} className="icon-muted" style={{ minWidth: '20px' }} />
                            <div className="address-text">
                                {hasAddress ? (
                                    <>
                                        {user.address.street && <p>{user.address.street}</p>}
                                        <p>
                                            {user.address.city && `${user.address.city}, `}
                                            {user.address.state && user.address.state}
                                        </p>
                                        <p>
                                            {user.address.country && user.address.country}
                                            {user.address.zip && ` - ${user.address.zip}`}
                                        </p>
                                    </>
                                ) : (
                                    <p style={{ color: '#888', fontStyle: 'italic' }}>No shipping address added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders & Activity Main Area */}
                <div className="profile-main">
                    <div className="stats-row-mini">
                        <div className="mini-stat-card">
                            <Package size={20} />
                            <div>
                                <span>Total Orders</span>
                                <h4>{ordersLoading ? '...' : totalOrders}</h4>
                            </div>
                        </div>
                        <div className="mini-stat-card">
                            <Clock size={20} />
                            <div>
                                <span>Pending</span>
                                <h4>{ordersLoading ? '...' : pendingOrders}</h4>
                            </div>
                        </div>
                        <div className="mini-stat-card">
                            <CheckCircle size={20} />
                            <div>
                                <span>Completed</span>
                                <h4>{ordersLoading ? '...' : completedOrders}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card order-history-card">
                        <div className="card-header">
                            <h3>Order History</h3>
                            {ordersLoading && <Loader2 size={16} className="spin" style={{ color: 'var(--primary-orange)' }} />}
                        </div>

                        {ordersError ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', fontSize: '13px' }}>
                                {ordersError}
                            </div>
                        ) : orders.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
                                <Package size={40} style={{ margin: '0 auto 15px', opacity: 0.4, color: 'var(--primary-orange)' }} />
                                <p style={{ fontSize: '15px', fontWeight: '500' }}>No orders placed by this customer yet.</p>
                                <p style={{ fontSize: '13px', color: '#999', marginTop: '5px' }}>Orders will appear here in real-time once placed.</p>
                            </div>
                        ) : (
                            <div className="orders-table-wrapper">
                                <table className="admin-table" style={{ fontSize: '13px' }}>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Total</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order._id}>
                                                <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>#{shortId(order._id)}</td>
                                                <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td>
                                                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: '700' }}>₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button 
                                                        className="secondary-btn" 
                                                        style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View order details"
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Service Requests Section */}
                    <div className="admin-card order-history-card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h3>Service Requests</h3>
                            {serviceRequestsLoading && <Loader2 size={16} className="spin" style={{ color: 'var(--primary-orange)' }} />}
                        </div>

                        {serviceRequestsError ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', fontSize: '13px' }}>
                                {serviceRequestsError}
                            </div>
                        ) : serviceRequests.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
                                <Inbox size={36} style={{ margin: '0 auto 12px', opacity: 0.4, color: 'var(--primary-orange)' }} />
                                <p style={{ fontSize: '14px', fontWeight: '500' }}>No service requests from this customer yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {serviceRequests.map((req, index) => (
                                    <button
                                        key={req._id}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer', marginBottom: '10px', textAlign: 'left', transition: 'all 0.2s ease' }}
                                        onClick={() => setSelectedServiceRequest(req)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff5eb', color: 'var(--primary-orange)', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                                                {index + 1}
                                            </span>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {req.category}{req.service ? ` - ${req.service}` : ''}
                                                </p>
                                                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(req.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700', background: req.isRegistered ? '#f0fdf4' : '#fef2f2', color: req.isRegistered ? '#15803d' : '#dc2626' }}>
                                                {req.isRegistered ? 'Registered' : 'Guest'}
                                            </span>
                                            <Eye size={16} style={{ color: '#64748b' }} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="admin-card" style={{ width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative', margin: 0 }}>
                        <button 
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', fontWeight: '800', cursor: 'pointer', color: '#64748b' }}
                            onClick={() => setSelectedOrder(null)}
                        >
                            {'\u00d7'}
                        </button>
                        
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                            <span className="premium-glow-badge">Order Details</span>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '8px 0 2px' }}>Order: #{shortId(selectedOrder._id)}</h3>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </div>

                        {/* Customer & Shipping Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Pilot</h4>
                                <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px', color: '#334155' }}>{selectedOrder.user?.name || user?.name || 'Guest Pilot'}</p>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{selectedOrder.user?.email || user?.email || 'No email'}</p>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipping Address</h4>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <MapPin size={16} style={{ color: 'var(--primary-orange)', marginTop: '2px' }} />
                                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                        <p style={{ margin: 0 }}>{selectedOrder.shippingAddress?.address || 'N/A'}</p>
                                        <p style={{ margin: '2px 0 0' }}>
                                            {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state, selectedOrder.shippingAddress?.zip].filter(Boolean).join(', ')}
                                        </p>
                                        <p style={{ margin: '2px 0 0' }}>{selectedOrder.shippingAddress?.country || 'India'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status History Timeline */}
                        {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                            <>
                                <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Status History</h4>
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', marginBottom: '25px', padding: '16px' }}>
                                    {selectedOrder.statusHistory.map((history, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: idx < selectedOrder.statusHistory.length - 1 ? '16px' : '0' }}>
                                            <div style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: history.status === 'Delivered' ? '#10b981' : history.status === 'Cancelled' ? '#ef4444' : history.status === 'Shipped' ? '#3b82f6' : '#f59e0b',
                                                marginTop: '4px',
                                                flexShrink: 0
                                            }}></div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>{history.status}</p>
                                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                                                    {new Date(history.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                                {history.note && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>{history.note}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Order Items Table */}
                        <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Order Items</h4>
                        <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', marginBottom: '25px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '10px 15px', fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Item Detail</th>
                                        <th style={{ textAlign: 'center', padding: '10px 15px', fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '10px 15px', fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Unit Price</th>
                                        <th style={{ textAlign: 'right', padding: '10px 15px', fontSize: '11.5px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedOrder.orderItems || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img 
                                                    src={item.image || '/placeholder.png'} 
                                                    alt={item.name} 
                                                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                                                    onError={(e) => { e.target.src = 'https://ik.imagekit.io/0tlk28cvf/default-image.jpg' }}
                                                />
                                                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>{item.name}</span>
                                            </td>
                                            <td style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>
                                                {item.qty}
                                            </td>
                                            <td style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '13.5px', fontWeight: '600', color: '#475569' }}>
                                                ₹{Number(item.price || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                                                ₹{Number(item.price * item.qty).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Order Summary Pricing Breakdown */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                    <span>Items Total:</span>
                                    <span>₹{Number(selectedOrder.itemsPrice || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                    <span>Shipping:</span>
                                    <span>₹{Number(selectedOrder.shippingPrice || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    <span>Tax (GST):</span>
                                    <span>₹{Number(selectedOrder.taxPrice || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', color: '#0f172a', paddingTop: '4px' }}>
                                    <span>Grand Total:</span>
                                    <span>₹{Number(selectedOrder.totalPrice || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Request Detail Modal */}
            {selectedServiceRequest && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="admin-card" style={{ width: '90%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative', margin: 0 }}>
                        <button style={{ position: 'absolute', top: '15px', right: '18px', background: 'none', border: 'none', fontSize: '24px', fontWeight: '800', cursor: 'pointer', color: '#64748b', lineHeight: '1' }} onClick={() => setSelectedServiceRequest(null)}>×</button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', paddingRight: '20px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '17px' }}>Service Request Details</h4>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>#{selectedServiceRequest._id}</span>
                            </div>
                            <span style={{ padding: '5px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700', background: selectedServiceRequest.isRegistered ? '#f0fdf4' : '#fef2f2', color: selectedServiceRequest.isRegistered ? '#15803d' : '#dc2626' }}>
                                {selectedServiceRequest.isRegistered ? 'Registered' : 'Unregistered'}
                            </span>
                        </div>
                        {[
                            ['Name', selectedServiceRequest.name],
                            ['Phone', selectedServiceRequest.phone],
                            ['Email', selectedServiceRequest.email],
                            ['Category', selectedServiceRequest.category],
                            ['Interested Service', selectedServiceRequest.service],
                            ['Submitted', new Date(selectedServiceRequest.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                                <span style={{ color: '#64748b', fontWeight: '600' }}>{label}</span>
                                <span style={{ fontWeight: '700', color: '#1e293b', textAlign: 'right', marginLeft: '16px' }}>{val || 'N/A'}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '16px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Message / Specifications</p>
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {selectedServiceRequest.message || 'N/A'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button className="secondary-btn" onClick={() => setSelectedServiceRequest(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetails;
