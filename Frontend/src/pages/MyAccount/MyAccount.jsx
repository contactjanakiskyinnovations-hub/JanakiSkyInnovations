import React, { useState, useEffect } from 'react';
import { withVat, formatINR } from '../../utils/price';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { User, Package, Heart, LogOut, Settings, ChevronRight, CreditCard, MapPin, Bell, Loader2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './MyAccount.css';
import Seo from '../../utils/seo';

const MyAccount = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn, logout, updateUser, refreshProfile, loading } = useAuth();
    const { wishlistItems, toggleWishlist } = useCart();
    const [activeTab, setActiveTab] = useState('profile');
    const getFormattedAddress = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'object') {
            return [addr.street, addr.city, addr.state, addr.country, addr.zip].filter(Boolean).join(', ');
        }
        return addr;
    };

    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [address, setAddress] = useState(getFormattedAddress(user?.address));
    const [tempAddress, setTempAddress] = useState(address);

    // Real orders fetched from backend
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');

    // Sync address when user load/updates from context
    React.useEffect(() => {
        if (user?.address) {
            const formatted = getFormattedAddress(user.address);
            setAddress(formatted);
            setTempAddress(formatted);
        }
    }, [user]);

    // Fetch the latest user profile (incl. saved address) from the backend on mount,
    // so the "Default Address" reflects whatever is stored in MongoDB in real-time
    // (the login/register response only carries the fields present at that time).
    useEffect(() => {
        if (!isLoggedIn || !user) return;
        refreshProfile().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch the logged-in user's orders when logged in
    useEffect(() => {
        if (!isLoggedIn || !user) return;
        const fetchMyOrders = async () => {
            setOrdersLoading(true);
            setOrdersError('');
            try {
                const { data } = await api.get('/api/orders/my-orders');
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                setOrdersError(err.response?.data?.message || 'Failed to load your orders.');
                setOrders([]);
            } finally {
                setOrdersLoading(false);
            }
        };
        fetchMyOrders();

        // Real-time polling: refresh orders every 30 seconds so the user
        // always sees the latest order status from the database
        const interval = setInterval(() => {
            fetchMyOrders();
        }, 30000);

        return () => clearInterval(interval);
    }, [isLoggedIn, user]);

    if (loading) return <div className="loading-state">Loading your hangar...</div>;
    if (!isLoggedIn) return <Navigate to="/" />;

    const tabs = [
        { id: 'profile', label: 'Profile Overview', icon: <User size={18} /> },
        { id: 'orders', label: 'Recent Orders', icon: <Package size={18} /> },
        { id: 'hangar', label: 'Wishlist Items', icon: <Heart size={18} /> },
        { id: 'settings', label: 'Account Settings', icon: <Settings size={18} /> }
    ];

    const handleSaveAddress = async () => {
        try {
            await updateUser({ address: tempAddress });
            setAddress(tempAddress);
            setIsEditingAddress(false);
        } catch (err) {
            alert(err.message || 'Failed to save address. Please try again.');
        }
    };

    return (
        <div className="account-page">
            <Seo noindex title="My Account" description="Manage your profile, orders and wishlist at Janaki Sky Innovations." path="/account" />
            <div className="container">
                <div className="account-layout">
                    {/* Sidebar */}
                    <aside className="account-sidebar">
                        <div className="user-profile-summary">
                            <div className="profile-avatar">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="profile-info">
                                <h3>{user?.name || 'User'}</h3>
                                <p>+91 {user?.mobile}</p>
                            </div>
                        </div>

                        <nav className="account-nav-tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    <ChevronRight className="arrow" size={16} />
                                </button>
                            ))}
                            <button className="tab-btn logout-btn" onClick={logout}>
                                <LogOut size={18} />
                                <span>Logout Session</span>
                            </button>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <main className="account-main-content">
                        {activeTab === 'profile' && (
                            <div className="tab-content profile-tab">
                                <h2 className="tab-title">Welcome back, {user?.name.split(' ')[0]}!</h2>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <Package className="stat-icon" />
                                        <div className="stat-val">
                                            {ordersLoading ? '...' : orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length}
                                        </div>
                                        <div className="stat-label">Active Orders</div>
                                    </div>
                                </div>

                                <div className="dashboard-sections">
                                    <div className="dashboard-card shadow-sm">
                                        <div className="card-header">
                                            <h4><CreditCard size={18} /> Saved Payments</h4>
                                            <button className="text-link">Manage</button>
                                        </div>
                                        <p className="card-placeholder">No saved cards found.</p>
                                    </div>
                                    <div className="dashboard-card shadow-sm">
                                        <div className="card-header">
                                            <h4><MapPin size={18} /> Default Address</h4>
                                            {!isEditingAddress ? (
                                                <button className="text-link" onClick={() => setIsEditingAddress(true)}>Manage</button>
                                            ) : (
                                                <div className="edit-actions">
                                                    <button className="text-link save-btn" onClick={handleSaveAddress}>Save</button>
                                                    <button className="text-link cancel-btn" onClick={() => setIsEditingAddress(false)}>Cancel</button>
                                                </div>
                                            )}
                                        </div>
                                        {!isEditingAddress ? (
                                            <p className="card-placeholder">{address || 'No address saved yet. Click Manage to add one.'}</p>
                                        ) : (
                                            <textarea 
                                                className="address-editor" 
                                                value={tempAddress} 
                                                onChange={(e) => setTempAddress(e.target.value)}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="tab-content orders-tab">
                                <h2 className="tab-title">Your Order History</h2>
                                {ordersLoading ? (
                                    <div className="orders-loading-state" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '40px 0', justifyContent: 'center', color: '#64748b' }}>
                                        <Loader2 size={20} className="spin" style={{ color: 'var(--primary-orange)' }} />
                                        Loading your orders...
                                    </div>
                                ) : ordersError ? (
                                    <p className="empty-msg" style={{ color: '#dc2626' }}>{ordersError}</p>
                                ) : orders.length === 0 ? (
                                    <p className="empty-msg">You haven't placed any orders yet. Start exploring our collection!</p>
                                ) : (
                                    <div className="orders-list">
                                        {orders.map(order => {
                                            const orderNumber = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
                                            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                                            const totalItems = (order.orderItems || []).reduce((sum, item) => sum + (item.qty || 0), 0);
                                            const statusClass = (order.status || 'Pending').toLowerCase().replace(' ', '-');
                                            return (
                                                <div key={order._id} className="order-item">
                                                    <div className="order-main">
                                                        <div className="order-id">
                                                            <span className="id">#{orderNumber}</span>
                                                            <span className="date">{orderDate}</span>
                                                        </div>
                                                        <div className={`order-status ${statusClass}`}>
                                                            {order.status}
                                                        </div>
                                                    </div>
                                                    <div className="order-details">
                                                        <div className="detail">
                                                            <span className="label">Total</span>
                                                            <span className="value">₹{Number(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="detail">
                                                            <span className="label">Type</span>
                                                            <span className="value">{order.orderType === 'Pre-Order' ? 'Pre-Order' : 'Normal'}</span>
                                                        </div>
                                                        <div className="detail">
                                                            <span className="label">Items</span>
                                                            <span className="value">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <button
                                                                className="view-order-btn"
                                                                onClick={() => navigate(`/order-success/${order._id}`)}
                                                                title={`Order total: ₹${Number(order.totalPrice || 0).toLocaleString('en-IN')} | Payment: ${order.paymentMethod || 'N/A'} | ${(order.orderItems || []).length} item(s)`}
                                                            >
                                                                View Details
                                                            </button>
                                                            {(order.status === 'Delivered' || order.isDelivered || order.eInvoice) && (
                                                                <button
                                                                    className="view-order-btn"
                                                                    onClick={() => navigate(`/order-success/${order._id}`)}
                                                                    title="Download / print your tax invoice (available after delivery)"
                                                                >
                                                                    Invoice
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'hangar' && (
                            <div className="tab-content hangar-tab">
                                <h2 className="tab-title">Wishlist Items</h2>
                                {wishlistItems.length === 0 ? (
                                    <p className="empty-msg">Your wishlist is empty. Start adding some tech!</p>
                                ) : (
                                    <div className="hangar-grid">
                                        {wishlistItems.map(item => (
                                            <div key={item.id} className="hangar-item">
                                                <div className="item-img">
                                                    <img src={item.image} alt={item.name} />
                                                    <button className="remove-fav" onClick={() => toggleWishlist(item)} title="Remove from wishlist">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <div className="item-details">
                                                    <h4>{item.name}</h4>
                                                    <p className="price">{formatINR(withVat(item.price), { decimals: false })}</p>
                                                    <button className="add-to-cart-dash" onClick={() => navigate(`/product/${item.id}`)}>View Product</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="tab-content settings-tab">
                                <h2 className="tab-title">Account Settings</h2>
                                <div className="settings-list">
                                    <div className="setting-row">
                                        <div className="setting-info">
                                            <h4>Email Notifications</h4>
                                            <p>Receive updates about your orders and hangar items.</p>
                                        </div>
                                        <div className="toggle-switch active"></div>
                                    </div>
                                    <div className="setting-row">
                                        <div className="setting-info">
                                            <h4>Newsletter</h4>
                                            <p>Get the latest news on drone technology and exclusive offers.</p>
                                        </div>
                                        <div className="toggle-switch"></div>
                                    </div>
                                    <div className="setting-row">
                                        <div className="setting-info">
                                            <h4>Profile Visibility</h4>
                                            <p>Allow other pilots to see your flying stats.</p>
                                        </div>
                                        <div className="toggle-switch active"></div>
                                    </div>
                                </div>
                                <button className="save-settings-btn">Save Changes</button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Star = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);

export default MyAccount;
