import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Package, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Trash2, 
    ArrowUpRight, 
    Search,
    Loader2,
    Calendar,
    MapPin,
    AlertCircle,
    SlidersHorizontal,
    X
} from 'lucide-react';
import api from '../../utils/api';
import EInvoice, { printOrderInvoice } from '../../components/EInvoice/EInvoice';
import './Admin.css';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const debounceRef = useRef(null);
    // Keep latest search/status values available to the polling interval without
    // re-running the mount effect on every keystroke (which was wiping the search).
    const searchRef = useRef(searchTerm);
    const statusRef = useRef(statusFilter);
    
    // Detail Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const fetchOrders = useCallback(async (keyword = '', status = 'All') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (status && status !== 'All') params.append('status', status);
            const { data } = await api.get(`/api/orders?${params.toString()}`);
            setOrders(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders from backend');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Keep refs in sync with latest state so the polling interval uses fresh values
        searchRef.current = searchTerm;
        statusRef.current = statusFilter;
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        // Initial load. NOTE: do NOT depend on searchTerm/statusFilter here,
        // otherwise every keystroke re-triggers fetchOrders('', 'All') and wipes the search.
        fetchOrders('', 'All');

        // Real-time polling: refresh orders every 30 seconds so the admin
        // always sees the latest order status from the database
        const interval = setInterval(() => {
            fetchOrders(searchRef.current, statusRef.current);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Debounced keyword search
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchOrders(val, statusFilter);
        }, 400);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        fetchOrders('', statusFilter);
    };

    const handleStatusFilterChange = (e) => {
        const val = e.target.value;
        setStatusFilter(val);
        fetchOrders(searchTerm, val);
    };

    // Handle Status Change
    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingStatusId(orderId);
        try {
            const { data } = await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
            
            // Update local orders state
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: data.status, isDelivered: data.isDelivered, isPaid: data.isPaid } : o));
            
            // If the active modal is showing this order, update it too
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: data.status, isDelivered: data.isDelivered, isPaid: data.isPaid }));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Handle Delete Order
    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Are you absolutely sure you want to remove this order from history?')) return;
        
        try {
            await api.delete(`/api/orders/${orderId}`);
            setOrders(prev => prev.filter(o => o._id !== orderId));
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(null);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete order');
        }
    };

    // Dynamic counts — computed from fetched (already filtered) orders
    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
    const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;
    const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

    // Helper: consistent 8-char order ID suffix
    const shortId = (id) => id ? id.toString().slice(-8).toUpperCase() : 'N/A';

    return (
        <div className="admin-content">
            {/* Header section */}
            <div className="page-actions">
                <div className="action-header">
                    <h3>Command Centre Orders</h3>
                    <p>Track customer purchases, update delivery status, and handle transaction archives in real-time.</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid">
                <div className="stat-card shadow-sm">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <Package size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-title">Total Orders</span>
                        <h3 className="stat-value">{loading ? '...' : totalOrdersCount}</h3>
                    </div>
                </div>
                <div className="stat-card shadow-sm">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
                        <Clock size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-title">Pending Orders</span>
                        <h3 className="stat-value">{loading ? '...' : pendingOrdersCount}</h3>
                    </div>
                </div>
                <div className="stat-card shadow-sm">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                        <CheckCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-title">Completed Orders</span>
                        <h3 className="stat-value">{loading ? '...' : completedOrdersCount}</h3>
                    </div>
                </div>
                <div className="stat-card shadow-sm">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                        <XCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-title">Cancelled Orders</span>
                        <h3 className="stat-value">{loading ? '...' : cancelledOrdersCount}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="admin-card search-filters-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, maxWidth: '480px', background: '#f8fafc', border: `1px solid ${searchTerm ? 'var(--primary-orange)' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 14px', transition: 'border-color 0.2s', position: 'relative' }}>
                    <Search size={16} style={{ color: searchTerm ? 'var(--primary-orange)' : '#64748b', flexShrink: 0, transition: 'color 0.2s' }} />
                    <input 
                        type="text" 
                        placeholder="Search by customer name, email, city, or order ID..." 
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', paddingRight: searchTerm ? '28px' : '0' }}
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#475569' }}>Filter Status:</span>
                    <select 
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: '600', fontSize: '13.5px', backgroundColor: 'white' }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                {(searchTerm || statusFilter !== 'All') && !loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                        <SlidersHorizontal size={14} style={{ color: 'var(--primary-orange)' }} />
                        <span><strong style={{ color: '#0f172a' }}>{orders.length}</strong> result{orders.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Main Orders Table */}
            {loading ? (
                <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <Loader2 size={36} className="spin" style={{ color: 'var(--primary-orange)', margin: '0 auto 15px' }} />
                    <p style={{ color: '#64748b', fontWeight: '500' }}>Fetching real-time order records...</p>
                </div>
            ) : error ? (
                <div className="admin-card" style={{ padding: '40px', textAlign: 'center', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
                    <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 15px' }} />
                    <h4 style={{ color: '#991b1b', fontWeight: '800', margin: '0 0 5px' }}>Database Sync Failed</h4>
                    <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <Package size={44} style={{ color: 'var(--primary-orange)', margin: '0 auto 15px', opacity: 0.4 }} />
                    <p style={{ color: '#64748b', fontWeight: '600', fontSize: '15px' }}>
                        {searchTerm ? `No orders found matching "${searchTerm}"` : 'No matching order transactions found'}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Orders placed by drone pilots will populate this command terminal.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Timestamp</th>
                                <th>Customer Name</th>
                                <th>Total Price</th>
                                <th>Order Type</th>
                                <th>Status Capsule</th>
                                <th>Modify Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                                        #{shortId(order._id)}
                                    </td>
                                    <td style={{ fontSize: '13.5px', fontWeight: '500' }}>
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700' }}>{order.user?.name || 'Guest User'}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{order.user?.email || 'N/A'}</div>
                                    </td>
                                    <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '14.5px' }}>
                                        ₹{order.totalPrice.toLocaleString('en-IN')}
                                    </td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700', backgroundColor: order.orderType === 'Pre-Order' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)', color: order.orderType === 'Pre-Order' ? '#92400e' : '#15803d' }}>
                                            {order.orderType === 'Pre-Order' ? 'Pre-Order' : 'Normal'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            disabled={updatingStatusId === order._id}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '12.5px',
                                                fontWeight: '600',
                                                outline: 'none',
                                                backgroundColor: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="secondary-btn" 
                                                style={{ padding: '6px 10px', borderRadius: '6px' }}
                                                onClick={() => setSelectedOrder(order)}
                                                title="View Detailed Invoice & Shipping Details"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            <button 
                                                className="secondary-btn" 
                                                style={{ padding: '6px 10px', borderRadius: '6px', color: '#dc2626', borderColor: '#fecaca' }}
                                                onClick={() => handleDeleteOrder(order._id)}
                                                title="Archive Order"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ORDER DETAIL SLIDE-OVER OR MODAL DIALOG */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="admin-card" style={{ width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative', margin: 0 }}>
                        <button 
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', fontWeight: '800', cursor: 'pointer', color: '#64748b' }}
                            onClick={() => setSelectedOrder(null)}
                        >
                            &times;
                        </button>
                        
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                            <span className="premium-glow-badge">Detailed Drone Invoice</span>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '8px 0 2px' }}>Order: #{shortId(selectedOrder._id)}</h3>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}><strong>Order Type:</strong> {selectedOrder.orderType === 'Pre-Order' ? 'Pre-Order' : 'Normal'}</p>
                        </div>

                        {/* Customer & Shipping Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Pilot</h4>
                                <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px', color: '#334155' }}>{selectedOrder.user?.name || 'Guest Pilot'}</p>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{selectedOrder.user?.email || 'No email'}</p>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipping Address</h4>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <MapPin size={16} style={{ color: 'var(--primary-orange)', marginTop: '2px' }} />
                                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                        <p style={{ margin: 0 }}>{selectedOrder.shippingAddress.address}</p>
                                        <p style={{ margin: '2px 0 0' }}>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zip}</p>
                                        <p style={{ margin: '2px 0 0' }}>{selectedOrder.shippingAddress.country}</p>
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
                        <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Drone Parts & Payload</h4>
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
                                    {selectedOrder.orderItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img 
                                                    src={item.image} 
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
                                                ₹{item.price.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                                                ₹{(item.qty * item.price).toLocaleString('en-IN')}
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
                                    <span>₹{(selectedOrder.itemsPrice || selectedOrder.totalPrice - selectedOrder.shippingPrice - selectedOrder.taxPrice).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                    <span>Shipping:</span>
                                    <span>₹{selectedOrder.shippingPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    <span>Tax (GST):</span>
                                    <span>₹{selectedOrder.taxPrice.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', color: '#0f172a', paddingTop: '4px' }}>
                                    <span>Grand Total:</span>
                                    <span>₹{selectedOrder.totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* E-Invoice — auto-generated when the order is marked Delivered */}
                        {selectedOrder.isDelivered || selectedOrder.status === 'Delivered' || selectedOrder.eInvoice ? (
                            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '24px', paddingTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>E-Invoice (Tax Invoice)</h4>
                                    <button className="primary-btn" onClick={() => printOrderInvoice(selectedOrder)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
                                        Download / Print Invoice
                                    </button>
                                </div>
                                <EInvoice order={selectedOrder} compact />
                            </div>
                        ) : (
                            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '24px', paddingTop: '20px', fontSize: '13px', color: '#64748b' }}>
                                <strong>E-Invoice:</strong> will be auto-generated and available here once this order is marked <strong>Delivered</strong>.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
