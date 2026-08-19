import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Box, 
    Layers, 
    ShoppingCart, 
    Users, 
    LogOut, 
    ChevronLeft, 
    Bell,
    Monitor
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';
import Seo from '../../utils/seo';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-logout after 5 minutes (300000ms) of inactivity.
    // Single ref-based timer reset on any user activity or route change.
    const logoutTimerRef = React.useRef(null);

    const resetLogoutTimer = React.useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = setTimeout(() => {
            localStorage.removeItem('adminInfo');
            navigate('/admin/login');
        }, 300000); // 5 minutes
    }, [navigate]);

    React.useEffect(() => {
        resetLogoutTimer();
        const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
        activityEvents.forEach(ev => window.addEventListener(ev, resetLogoutTimer, { passive: true }));
        return () => {
            activityEvents.forEach(ev => window.removeEventListener(ev, resetLogoutTimer, { passive: true }));
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        };
        // Reset the timer whenever the admin navigates to a different route
    }, [location.pathname, resetLogoutTimer]);

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
        { name: 'Products', icon: <Box size={20} />, path: '/admin/products' },
        { name: 'Categories', icon: <Layers size={20} />, path: '/admin/categories' },
        { name: 'Orders', icon: <ShoppingCart size={20} />, path: '/admin/orders' },
        { name: 'Customers', icon: <Users size={20} />, path: '/admin/users' },
        { name: 'CMS Home', icon: <Monitor size={20} />, path: '/admin/cms' },
    ];

    const cmsSubMenu = [
        { name: 'Hero Slider', path: '/admin/cms?tab=slider' },
        { name: 'Coupons', path: '/admin/cms?tab=coupons' },
        { name: 'Offers & Bundles', path: '/admin/cms?tab=offers' },
        { name: 'Services', path: '/admin/cms?tab=services' },
        { name: 'Footer', path: '/admin/cms?tab=footer' },
        { name: 'Social Icons', path: '/admin/cms?tab=social' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        navigate('/admin/login');
    };

    const adminInfoStr = localStorage.getItem('adminInfo');
    let adminName = 'Administrator';
    let adminRole = 'Super Admin';
    try {
        if (adminInfoStr) {
            const admin = JSON.parse(adminInfoStr);
            adminName = admin.name || 'Administrator';
            adminRole = admin.role === 'admin' ? 'Super Admin' : 'Admin';
        }
    } catch (err) {}

    return (
        <div className="admin-layout">
            <Seo noindex title="Admin Panel" description="Janaki Sky Innovations admin console – restricted area." path="/admin" />
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src="https://ik.imagekit.io/ftcr3yz3y1/Ecommerce-Drone/Logo/logoWithName.jpeg?updatedAt=1787070991944" alt="Janaki Sky" className="admin-logo" />
                    <h3>Admin Panel</h3>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                    
                    {/* CMS Sub-menu */}
                    {location.pathname === '/admin/cms' && (
                        <div className="cms-submenu">
                            {cmsSubMenu.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`submenu-item ${location.search === item.path.split('?')[1] ? 'active' : ''}`}
                                >
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <button onClick={() => navigate(-1)} className="back-btn">
                            <ChevronLeft size={20} />
                        </button>
                        <h2>{menuItems.find(m => m.path === location.pathname)?.name || 'Admin'}</h2>
                    </div>
                    
                    <div className="header-right">
                        <button className="icon-btn">
                            <Bell size={20} />
                            <span className="badge">3</span>
                        </button>
                        <div className="admin-profile">
                            <div className="admin-avatar">{adminName.charAt(0).toUpperCase()}</div>
                            <div className="admin-info">
                                <span className="admin-name">{adminName}</span>
                                <span className="admin-role">{adminRole}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
