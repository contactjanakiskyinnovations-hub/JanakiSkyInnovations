import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    Package, 
    Users, 
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Calendar,
    Activity,
    FolderKanban,
    Sparkles,
    ShoppingBag,
    Edit2,
    Save,
    Eye,
    ShoppingCart,
    Check,
    AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Admin.css';

const AdminDashboard = () => {
    const [counts, setCounts] = useState({
        products: 0,
        users: 0,
        categories: 0
    });
    const [loading, setLoading] = useState(true);
    
    // Customer management states
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [canEdit, setCanEdit] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [editEmail, setEditEmail] = useState('');
    const [editMobile, setEditMobile] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Wishlist & Cart explore states
    const [wishlistOpen, setWishlistOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [cartItems, setCartItems] = useState([]);
        const [wishlistLoading, setWishlistLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);

    // All Customers section tab state — 'wishlist' or 'cart'
    const [allCustomersTab, setAllCustomersTab] = useState('wishlist');

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                // Fetch dynamic totals from MongoDB
                const [productsRes, usersRes, categoriesRes] = await Promise.all([
                    api.get('/api/products?limit=1'),
                    api.get('/api/users'),
                    api.get('/api/categories')
                ]);

                setCounts({
                    products: productsRes.data?.total || 0,
                    users: usersRes.data?.length || 0,
                    categories: categoriesRes.data?.length || 0
                });
            } catch (err) {
                console.error('Failed to fetch dynamic stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);
    
    // Fetch customers for management
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/api/users');
                const customersData = Array.isArray(res.data) ? res.data : (res.data?.users || []);
                setCustomers(customersData);
            } catch (err) {
                console.error('Failed to fetch customers:', err);
            }
        };
        fetchCustomers();
    }, []);

    // Handlers for customer profile editing
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setEditEmail(customer.email || '');
        setEditMobile(customer.mobile || '');
        setCanEdit(false);
        setSaveSuccess(false);
        setSaveError('');
    };

    const handleSaveProfile = async () => {
        if (!selectedCustomer) return;
        setSavingProfile(true);
        setSaveSuccess(false);
        setSaveError('');
        try {
            const res = await api.put(`/api/users/${selectedCustomer._id}`, {
                email: editEmail,
                mobile: editMobile
            });
            const updated = res.data;
            // Update the selected customer and the customers list
            setSelectedCustomer(updated);
            setCustomers(prev =>
                prev.map(c => (c._id === updated._id ? { ...c, email: updated.email, mobile: updated.mobile } : c))
            );
            setSaveSuccess(true);
            setCanEdit(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    // Wishlist & Cart data fetching
    const fetchWishlist = async () => {
        if (!selectedCustomer) return;
        setWishlistOpen(true);
        setWishlistLoading(true);
        try {
            const res = await api.get(`/api/users/${selectedCustomer._id}/wishlist`);
            const items = Array.isArray(res.data)
                ? res.data
                : (res.data?.wishlist || []);
            setWishlistItems(items);
        } catch (err) {
            console.error('Failed to fetch wishlist:', err);
            setWishlistItems([]);
        } finally {
            setWishlistLoading(false);
        }
    };

    const fetchCart = async () => {
        if (!selectedCustomer) return;
        setCartOpen(true);
        setCartLoading(true);
        try {
            const res = await api.get(`/api/users/${selectedCustomer._id}/cart`);
            const items = Array.isArray(res.data)
                ? res.data
                : (res.data?.cart || []);
            setCartItems(items);
        } catch (err) {
            console.error('Failed to fetch cart:', err);
            setCartItems([]);
        } finally {
            setCartLoading(false);
        }
    };

    const stats = [
        { 
            title: 'Live Catalog Products', 
            value: loading ? '...' : counts.products, 
            icon: <Package size={22} />, 
            trend: '+15 New', 
            isUp: true, 
            desc: 'Total active database listings' 
        },
        { 
            title: 'Registered Users', 
            value: loading ? '...' : counts.users, 
            icon: <Users size={22} />, 
            trend: '+8% this month', 
            isUp: true, 
            desc: 'Total user accounts' 
        },
        { 
            title: 'Catalog Categories', 
            value: loading ? '...' : counts.categories, 
            icon: <FolderKanban size={22} />, 
            trend: 'Fully Operational', 
            isUp: true, 
            desc: 'Active navigational shelves' 
        },
        { 
            title: 'Total Revenue Est.', 
            value: '₹8,42,500', 
            icon: <DollarSign size={22} />, 
            trend: '+18.4%', 
            isUp: true, 
            desc: 'Live and offline order values' 
        },
    ];

    // High-fidelity Category Performance Metrics
    const categoryPerformance = [
        { name: 'DJI & Custom Drones', percentage: 75, revenue: '₹6,31,875', color: 'var(--primary-orange)' },
        { name: 'FPV Electronics & Motors', percentage: 48, revenue: '₹4,04,400', color: '#10b981' },
        { name: 'Arduino & STEM Kits', percentage: 32, revenue: '₹2,69,600', color: '#3b82f6' },
        { name: 'Sensors & Power Batteries', percentage: 22, revenue: '₹1,85,350', color: '#8b5cf6' }
    ];

    // Mock Sales Trend Data for the interactive SVG Chart
    const salesData = [
        { month: 'Jan', sales: 45000 },
        { month: 'Feb', sales: 62000 },
        { month: 'Mar', sales: 55000 },
        { month: 'Apr', sales: 88000 },
        { month: 'May', sales: 94000 },
        { month: 'Jun', sales: 120000 }
    ];

    // SVG Line Chart coordinates generators
    const width = 500;
    const height = 180;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxVal = 140000;

    const points = salesData.map((d, i) => {
        const x = padding + (i * (chartWidth / (salesData.length - 1)));
        const y = height - padding - ((d.sales / maxVal) * chartHeight);
        return { x, y, month: d.month, val: d.sales };
    });

    const pathD = points.reduce((acc, p, i) => {
        return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
        <div className="admin-dashboard-premium">
            {/* Header Header */}
            <div className="dashboard-welcome-banner">
                <div className="banner-left">
                    <span className="premium-glow-badge">
                        <Sparkles size={13} style={{ fill: 'currentColor' }} />
                        <span>System Monitor Active</span>
                    </span>
                    <h1>Janaki Sky Innovations Console</h1>
                    <p>Track your dynamic catalog metrics, drone categories, and pilot registries in real-time.</p>
                </div>
                <div className="banner-right">
                    <Calendar size={16} />
                    <span>Live Updates: {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className="stat-card-premium shadow-sm">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper-premium">
                                {stat.icon}
                            </div>
                            <span className={`trend-pill ${stat.isUp ? 'up' : 'down'}`}>
                                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.trend}
                            </span>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label-text">{stat.title}</span>
                            <h3 className="stat-number">{stat.value}</h3>
                            <p className="stat-subdesc">{stat.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts & Distributions */}
            <div className="dashboard-charts-layout">
                {/* SVG Revenue Line Graph */}
                <div className="dashboard-card-premium shadow-sm chart-card">
                    <div className="card-header-premium">
                        <div>
                            <h4>Dynamic Revenue Trend</h4>
                            <p>Real-time projection of monthly sales values across drone fleets.</p>
                        </div>
                        <span className="revenue-total-pill">₹1.2M Total</span>
                    </div>
                    <div className="chart-wrapper-svg">
                        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                            {/* Grids */}
                            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                                const y = padding + r * chartHeight;
                                return (
                                    <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
                                );
                            })}
                            
                            {/* Area Gradient Shading */}
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary-orange)" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="var(--primary-orange)" stopOpacity="0.00" />
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#chartGradient)" />

                            {/* Line path */}
                            <path d={pathD} fill="none" stroke="var(--primary-orange)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Interactive Dots */}
                            {points.map((p, i) => (
                                <g key={i} className="chart-interactive-dot">
                                    <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="var(--primary-orange)" strokeWidth="3" />
                                    <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--admin-text-main)">
                                        ₹{(p.val / 1000).toFixed(0)}k
                                    </text>
                                </g>
                            ))}

                            {/* X Axis labels */}
                            {points.map((p, i) => (
                                <text key={i} x={p.x} y={height - 6} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--admin-text-muted)">
                                    {p.month}
                                </text>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* Horizontal Share distribution progress bars */}
                <div className="dashboard-card-premium shadow-sm distribution-card">
                    <div className="card-header-premium">
                        <h4>Category Market Share</h4>
                        <p>Visual representation of customer sales breakdown by shelf.</p>
                    </div>
                    <div className="share-list-wrapper">
                        {categoryPerformance.map((cat, idx) => (
                            <div key={idx} className="share-item">
                                <div className="share-meta">
                                    <span className="share-name">{cat.name}</span>
                                    <span className="share-revenue-label">{cat.revenue}</span>
                                </div>
                                <div className="share-progress-bar-bg">
                                    <div 
                                        className="share-progress-bar-fill" 
                                        style={{ 
                                            width: `${cat.percentage}%`, 
                                            background: cat.color,
                                            boxShadow: `0 2px 8px ${cat.color}40`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom grids */}
            <div className="dashboard-sections">
                {/* Recent activity log */}
                <div className="recent-orders-card shadow-sm">
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} className="activity-pulse-icon" />
                            <h3>System Activity Log</h3>
                        </div>
                        <span className="active-badge-status">System Operational</span>
                    </div>
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Event Action</th>
                                    <th>Segment</th>
                                    <th>Time Logged</th>
                                    <th>Auth User</th>
                                    <th>Operational Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span style={{ fontWeight: '700' }}>Updated CMS Coupons</span></td>
                                    <td>Home Settings</td>
                                    <td>Just Now</td>
                                    <td>Super Admin</td>
                                    <td><span className="status-badge completed">Published</span></td>
                                </tr>
                                <tr>
                                    <td><span style={{ fontWeight: '700' }}>Modified Customer Shipping Address</span></td>
                                    <td>User Account</td>
                                    <td>12 mins ago</td>
                                    <td>Live Customer</td>
                                    <td><span className="status-badge completed">Saved (DB)</span></td>
                                </tr>
                                <tr>
                                    <td><span style={{ fontWeight: '700' }}>Updated Our Services Schema</span></td>
                                    <td>Home Settings</td>
                                    <td>42 mins ago</td>
                                    <td>Super Admin</td>
                                    <td><span className="status-badge completed">Published</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Customer Management Section */}
                <div className="admin-card customer-management-card">
                    <div className="card-header">
                        <h3>Customer Management</h3>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: 0 }}>
                            Select a customer, edit their contact details, and explore their wishlist and cart.
                        </p>
                    </div>
                    <div className="card-body">
                        {/* Customer Selector Dropdown */}
                        <div className="customer-selector">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                                Select Customer
                            </label>
                            <select
                                value={selectedCustomer?._id || ''}
                                onChange={(e) => {
                                    const cust = customers.find(c => c._id === e.target.value);
                                    if (cust) handleSelectCustomer(cust);
                                }}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                            >
                                <option value="">-- Choose a customer --</option>
                                {customers.map((cust) => (
                                    <option key={cust._id} value={cust._id}>
                                        {cust.name} ({cust.mobile})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Profile Edit Form */}
                        {selectedCustomer && (
                            <div className="profile-edit-section" style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            readOnly={!canEdit}
                                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: canEdit ? '#fff' : '#f8fafc' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={editMobile}
                                            onChange={(e) => setEditMobile(e.target.value)}
                                            readOnly={!canEdit}
                                            maxLength={10}
                                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: canEdit ? '#fff' : '#f8fafc' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {canEdit ? (
                                        <>
                                            <button
                                                onClick={handleSaveProfile}
                                                className="save-btn"
                                                disabled={savingProfile}
                                                style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                {savingProfile ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                                                {savingProfile ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={() => { setCanEdit(false); setEditEmail(selectedCustomer?.email || ''); setEditMobile(selectedCustomer?.mobile || ''); }}
                                                style={{ background: '#fff', color: '#6b7280', border: '1px solid #e2e8f0', padding: '8px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                            >Cancel</button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setCanEdit(true)}
                                            className="edit-btn"
                                            style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Edit2 size={14} /> Edit Details
                                        </button>
                                    )}

                                    {saveSuccess && (
                                        <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={14} /> Profile updated
                                        </span>
                                    )}
                                    {saveError && (
                                        <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={14} /> {saveError}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Explore Wishlist & Cart Buttons — per selected customer */}
                {selectedCustomer && (
                    <div className="admin-card" style={{ marginTop: '24px' }}>
                        <div className="card-header">
                            <h3>Explore {selectedCustomer.name || 'Customer'} Activity</h3>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: 0 }}>
                                View real-time SKU IDs saved in this customer's wishlist or cart.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                            <button
                                onClick={fetchWishlist}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ea580c', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                            >
                                <Eye size={16} /> Explore Wishlist
                            </button>
                            <button
                                onClick={fetchCart}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#1a1c23', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                            >
                                <ShoppingCart size={16} /> Explore Cart
                            </button>
                        </div>
                    </div>
                )}


{/* Customer Wishlist & Cart Explorer — two buttons, only customers with items */}
                                {customers && customers.length > 0 && (() => {
                                    const filteredCustomers = allCustomersTab === 'wishlist'
                                        ? customers.filter(c => (c.wishlist || []).length > 0)
                                        : customers.filter(c => (c.cart || []).length > 0);

                                    return (
                                        <div className="all-customers-section" style={{ marginTop: '24px', background: '#f8fafc', borderRadius: '8px', padding: '20px' }}>
                                            <h3 style={{ margin: '-20px 0 16px 0', color: '#1f2937' }}>
                                                <Eye size={16} style={{ marginRight: '8px', color: '#ea580c' }} /> Customer Wishlist & Cart Explorer
                                            </h3>
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                                <button onClick={() => setAllCustomersTab('wishlist')} style={{ padding: '8px 18px', borderRadius: '6px', border: allCustomersTab === 'wishlist' ? '2px solid #ea580c' : '1px solid #d1d5db', background: allCustomersTab === 'wishlist' ? '#fff' : '#f1f5f9', color: allCustomersTab === 'wishlist' ? '#ea580c' : '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Wishlist</button>
                                                <button onClick={() => setAllCustomersTab('cart')} style={{ padding: '8px 18px', borderRadius: '6px', border: allCustomersTab === 'cart' ? '2px solid #ea580c' : '1px solid #d1d5db', background: allCustomersTab === 'cart' ? '#fff' : '#f1f5f9', color: allCustomersTab === 'cart' ? '#ea580c' : '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cart</button>
                                            </div>
                                            {filteredCustomers.length === 0 ? (
                                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    No customers found with items in {allCustomersTab === 'wishlist' ? 'Wishlist' : 'Cart'} yet.
                                                </p>
                                            ) : (
                                                <div className="all-customers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                                    {filteredCustomers.map((user) => (
                                                        <div key={user._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                            <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1c23', color: '#fff', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {user.name ? user.name.charAt(0) : 'U'}
                                                                    </span>
                                                                    <div>
                                                                        <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px' }}>{user.name || 'Unknown'}</p>
                                                                        <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>{user.mobile || 'No mobile'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ padding: '12px' }}>
                                                                {allCustomersTab === 'wishlist' ? (
                                                                    <>
                                                                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#ea580c', marginBottom: '4px' }}>Wishlist ({user.wishlist?.length || 0} items)</p>
                                                                        {user.wishlist && user.wishlist.length > 0 ? user.wishlist.map((item, idx) => (
                                                                            <div key={item._id || idx} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '11px' }}>
                                                                                <span style={{ color: '#ea580c', fontWeight: '600', marginRight: '4px' }}>SKU:</span>
                                                                                <span>{item.sku || 'N/A'}</span>
                                                                                <span style={{ marginLeft: '8px' }}>{item.name || 'Unnamed'}</span>
                                                                            </div>
                                                                        )) : (
                                                                            <p style={{ fontSize: '10px', color: '#94a3b8' }}>No items</p>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#ea580c', marginBottom: '4px' }}>Cart ({user.cart?.length || 0} items)</p>
                                                                        {user.cart && user.cart.length > 0 ? user.cart.map((item, idx) => (
                                                                            <div key={item._id || idx} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '11px' }}>
                                                                                <span style={{ color: '#ea580c', fontWeight: '600', marginRight: '4px' }}>SKU:</span>
                                                                                <span>{item.sku || 'N/A'}</span>
                                                                                <span style={{ marginLeft: '8px' }}>{item.name || 'Unnamed'} (Qty: {item.quantity || 1})</span>
                                                                            </div>
                                                                        )) : (
                                                                            <p style={{ fontSize: '10px', color: '#94a3b8' }}>No items</p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                <div className="quick-actions-card shadow-sm">
                    <h3>Operational Directives</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Quick shortcuts to manage inventory, update checkout campaigns, or manage user details.</p>
                    <div className="actions-list">
                        <Link to="/admin/products/add" className="action-item-btn-premium">
                            <Plus size={16} />
                            <span>Add New Product</span>
                        </Link>
                        <Link to="/admin/products" className="action-item-btn-premium">
                            <ShoppingBag size={16} />
                            <span>Manage Inventory</span>
                        </Link>
                        <Link to="/admin/cms" className="action-item-btn-premium">
                            <Sparkles size={16} />
                            <span>Configure Coupons & CMS</span>
                        </Link>
                    </div>
                </div>

                {/* Wishlist Modal */}
                {wishlistOpen && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setWishlistOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#fff', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>Wishlist — {selectedCustomer?.name || 'Customer'}</h3>
                                <button onClick={() => setWishlistOpen(false)} style={{ border: 'none', background: '#f1f5f9', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>×</button>
                            </div>
                            {wishlistLoading ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}><Loader2 size={20} className="spin" /> Loading...</p>
                            ) : wishlistItems.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No wishlist items.</p>
                            ) : (
                                wishlistItems.map((item, idx) => (
                                    <div key={item._id || idx} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                        <span style={{ background: '#fff7ed', color: '#ea580c', fontWeight: 700, borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }}>SKU: {item.sku || 'N/A'}</span>
                                        <span style={{ fontWeight: 600 }}>{item.name || 'Unnamed'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Cart Modal */}
                {cartOpen && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setCartOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: '#fff', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>Cart — {selectedCustomer?.name || 'Customer'}</h3>
                                <button onClick={() => setCartOpen(false)} style={{ border: 'none', background: '#f1f5f9', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>×</button>
                            </div>
                            {cartLoading ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}><Loader2 size={20} className="spin" /> Loading...</p>
                            ) : cartItems.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No cart items.</p>
                            ) : (
                                cartItems.map((item, idx) => (
                                    <div key={item._id || idx} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                        <span style={{ background: '#fff7ed', color: '#ea580c', fontWeight: 700, borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }}>SKU: {item.sku || 'N/A'}</span>
                                        <span style={{ fontWeight: 600 }}>{item.name || 'Unnamed'}</span>
                                        <span style={{ color: '#6b7280', fontSize: '12px' }}>(Qty: {item.quantity || 1})</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const Plus = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default AdminDashboard;
