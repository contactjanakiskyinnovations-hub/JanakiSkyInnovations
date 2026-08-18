import React, { useState, useRef, useCallback } from 'react';
import { withVat, formatINR } from '../../utils/price';
import { Search, ShoppingCart, User, Heart, ChevronDown, LayoutGrid, Award, Star, LogOut, Menu, X as CloseIcon, Package, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import AuthModal from '../AuthModal/AuthModal';
import api from '../../utils/api';
import './Header.css';

const Header = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const { cartCount, cartTotal, wishlistCount } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [serviceCategories, setServiceCategories] = useState([]);
  const [navCategories, setNavCategories] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const searchWrapperRef = useRef(null);

  // Close suggestions on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggestionsLoading(true);
    try {
      const { data } = await api.get(`/api/products?keyword=${encodeURIComponent(q)}&pageNumber=1&limit=5`);
      setSuggestions(data.products || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
    if (e.key === 'Escape') { setShowSuggestions(false); setSearchQuery(''); }
  };

  const handleSuggestionClick = (product) => {
    setShowSuggestions(false);
    setSearchQuery(product.name);
    navigate(`/product/${product._id}`);
  };

  const handleUserClick = () => {
    if (isLoggedIn) {
      navigate('/account');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  React.useEffect(() => {
    const handleToggleModal = () => setIsAuthModalOpen(true);
    window.addEventListener('toggleAuthModal', handleToggleModal);
    return () => window.removeEventListener('toggleAuthModal', handleToggleModal);
  }, []);

  // Load service categories for the OUR SERVICES dropdown
  React.useEffect(() => {
    const loadServiceCategories = async () => {
      try {
        const { data } = await api.get('/api/cms');
        const cats = data?.serviceCategories || [];
        if (cats.length > 0) {
          setServiceCategories(cats);
        } else if (data?.services?.length) {
          // Fallback: group all flat services under a single "All Services" category
          setServiceCategories([{ name: 'All Services', slug: 'all', services: data.services }]);
        }
      } catch (err) {
        console.error('Failed to load service categories for nav:', err);
      }
    };
    loadServiceCategories();
  }, []);

  // Load top-level categories so the main nav dropdowns (DRONES, STEM KITS, etc.)
  // always reflect sub-categories / sub-sub-categories added from the admin.
  React.useEffect(() => {
    const loadNavCategories = async () => {
      try {
        const { data } = await api.get('/api/categories');
        setNavCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load categories for nav:', err);
      }
    };
    loadNavCategories();
  }, []);

  // Build the main category navigation items (fixed order & labels, dynamic content)
  const navDefs = [
    { slug: 'drones', label: 'DRONES' },
    { slug: 'accessories', label: 'ACCESSORIES' },
    { slug: 'stem-kits', label: 'STEM KITS' },
    { slug: 'tools', label: 'TOOLS' },
  ];
  // Convert a sub-category / sub-sub-category name into a URL slug
  const slugify = (s) => String(s || '').toLowerCase().replace(/\s+/g, '-');

  const getDisplayPhone = () => {
    return isLoggedIn && user && user.mobile ? user.mobile : '+91-7742228345';
  };

  return (
    <header className="header">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {/* Upper Header: Top Bar */}
      <div className="top-bar">
        <span className="top-bar-sparkle sparkle-left" aria-hidden="true">✨</span>
        <div className="container top-bar-inner">
          <p className="top-bar-message">
            <span className="welcome-flag">Welcome to Janaki Sky Innovations!</span>
            <span className="top-bar-divider" aria-hidden="true">➤</span>
            <span className="top-bar-tagline">Nepal's Biggest Drone Store</span>
          </p>
          <div className="top-links">
            <span className="phone"><i className="phone-icon">📞</i> {getDisplayPhone()}</span>
          </div>
        </div>
        <span className="top-bar-sparkle sparkle-right" aria-hidden="true">✨</span>
      </div>

      {/* Main Header: Logo, Search, Actions */}
      <div className="main-header">
        <div className="container main-header-inner">
          <div className="mobile-menu-trigger" onClick={toggleMobileMenu}>
             {isMobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </div>
          
          <Link to="/" className="logo-container">
            <img src="https://ik.imagekit.io/ftcr3yz3y1/Ecommerce-Drone/Logo/logoWithName.jpeg" alt="Janaki Sky Innovations" className="logo-img" />
          </Link>

          <div className="search-container" ref={searchWrapperRef}>
            <div className={`search-wrapper ${showSuggestions && suggestions.length > 0 ? 'suggestions-open' : ''}`}>
              <input
                type="text"
                placeholder="Search for drones, components and more..."
                className="search-input"
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                  title="Clear"
                >
                  <CloseIcon size={15} />
                </button>
              )}
              <button className="search-btn" onClick={handleSearchSubmit}>
                {suggestionsLoading ? <Loader2 size={18} className="spin" /> : <Search size={20} />}
              </button>
            </div>

            {/* Live Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                <p className="suggestions-heading">Quick Results</p>
                {suggestions.map(product => (
                  <button
                    key={product._id}
                    className="suggestion-item"
                    onMouseDown={() => handleSuggestionClick(product)}
                  >
                    <img
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      className="suggestion-img"
                    />
                    <div className="suggestion-info">
                      <span className="suggestion-name">{product.name}</span>
                      <span className="suggestion-price">
                        {formatINR(withVat(product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price))}
                      </span>
                    </div>
                  </button>
                ))}
                <button
                  className="suggestions-see-all"
                  onMouseDown={handleSearchSubmit}
                >
                  <Search size={14} />
                  See all results for &ldquo;{searchQuery}&rdquo;
                </button>
              </div>
            )}
          </div>

          <div className="header-actions">
            <div className="action-item profile-dropdown-container">
              <div className="action-content" onClick={handleUserClick}>
                <User size={24} />
                <div className="action-text">
                  <span className="label">{isLoggedIn ? `Hi, ${user.name.split(' ')[0]}` : 'Login'}</span>
                  <span className="sub-label">My Account</span>
                </div>
              </div>
              
              {isLoggedIn && (
                <div className="profile-dropdown-menu">
                  <Link to="/account" className="dropdown-link">
                    <User size={16} /> Profile Overview
                  </Link>
                  <Link to="/account" className="dropdown-link">
                    <Package size={16} /> Recent Orders
                  </Link>
                  <Link to="/account" className="dropdown-link">
                    <Heart size={16} /> Wishlist Items
                  </Link>
                  <Link to="/account" className="dropdown-link">
                    <Settings size={16} /> Account Settings
                  </Link>
                  <button className="dropdown-logout-btn" onClick={() => { logout(); navigate('/'); }}>
                    <LogOut size={16} /> Logout Session
                  </button>
                </div>
              )}
            </div>
            <Link to="/wishlist" className="action-item icon-only header-wishlist-icon">
              <div className="icon-badge">
                <Heart size={24} />
                <span className="badge">{wishlistCount}</span>
              </div>
            </Link>
            <Link to="/cart" className="action-item">
              <div className="icon-badge">
                <ShoppingCart size={24} />
                <span className="badge">{cartCount}</span>
              </div>
              <div className="action-text">
                <span className="label">My Cart</span>
                <span className="sub-label">₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Lower Header: Navigation */}
      <nav className={`nav-bar ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
        <div className="container nav-inner">
          <div className="shop-categories-dropdown">
            <Link to="/all-categories" className="category-btn-link">
              <button className="category-btn">
                <LayoutGrid size={20} />
                SHOP BY CATEGORIES
                <ChevronDown size={16} />
              </button>
            </Link>

            <div className="mega-menu">
              <div className="mega-menu-content">
                {/* ... existing columns ... */}
                <div className="mega-column">
                  <h3><Package size={18} /> COMPUTING & BOARDS</h3>
                  <ul>
                    <li><Link to="/category/developments-boards">Development Boards</Link></li>
                    <li><Link to="/category/arduino">Arduino Boards</Link></li>
                    <li><Link to="/category/raspberry-pi">Raspberry Pi</Link></li>
                    <li><Link to="/category/iot-wireless-modules">IoT & Wireless Modules</Link></li>
                    <li><Link to="/category/display-modules">Display Modules</Link></li>
                  </ul>
                </div>

                <div className="mega-column">
                  <h3><LayoutGrid size={18} /> ELECTRONIC COMPONENTS</h3>
                  <ul>
                    <li><Link to="/category/electronic-components">Basic Components</Link></li>
                    <li><Link to="/category/electronic-modules">Electronic Modules</Link></li>
                    <li><Link to="/category/sensors">Sensors & Kits</Link></li>
                    <li><Link to="/category/connector">Connectors & JST</Link></li>
                    <li><Link to="/category/silicon-wire-cable">Wires & Cables</Link></li>
                  </ul>
                </div>

                <div className="mega-column">
                  <h3><Settings size={18} /> MOTORS & MECHANICS</h3>
                  <ul>
                    <li><Link to="/category/servo-motor-accessorise">Servo Motors</Link></li>
                    <li><Link to="/category/motor-mechanical-parts">Motors & Gears</Link></li>
                    <li><Link to="/category/robot-wheels-chassis">Wheels & Chassis</Link></li>
                    <li><Link to="/category/3d-printers-parts">3D Printer Parts</Link></li>
                    <li><Link to="/category/screw-nut-bolt-washer-specer">Fasteners (Screws/Nuts)</Link></li>
                  </ul>
                </div>

                <div className="mega-column">
                  <h3><Award size={18} /> POWER & MORE</h3>
                  <ul>
                    <li><Link to="/category/battery-power-supply">Batteries & Power</Link></li>
                    <li><Link to="/category/drones">Drones & Kits</Link></li>
                    <li><Link to="/category/stem-kits">STEM & Educational</Link></li>
                    <li><Link to="/category/tools">Tools & Accessories</Link></li>
                    <li><Link to="/top-rated">🔥 Best Sellers</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mega-menu-footer">
                <Link to="/all-categories" className="view-all-cat-btn">
                  View All Categories Explorer <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <ul className="nav-links">
            <li className="nav-item" onClick={toggleMobileMenu}><Link to="/">HOME</Link></li>
            <li className="nav-item" onClick={toggleMobileMenu}><Link to="/new-arrivals">NEW ARRIVALS</Link></li>
            <li className="nav-item" onClick={toggleMobileMenu}><Link to="/best-sellers">BEST SELLERS</Link></li>
            {navDefs.map(({ slug, label }) => {
              // Match the canonical nav slug, and also support legacy seeded slugs
              // (e.g. 'drones' vs 'drones-products') so the DRONES dropdown's
              // sub-categories / sub-sub-categories always resolve.
              const cat = navCategories.find(c => (c.slug === slug || c.slug === `${slug}-products`) && c.isActive !== false);
              const hasSubs = cat && cat.subCategories && cat.subCategories.length > 0;
              return (
                <li key={slug} className={`nav-item ${hasSubs ? 'has-dropdown' : ''}`}>
                  <Link to={`/category/${slug}`}>
                    {label}
                    {hasSubs && <ChevronDown size={14} />}
                  </Link>
                  {hasSubs ? (
                    <ul className="dropdown-menu">
                      {cat.subCategories.map((sub, i) => (
                        sub.subSubCategories && sub.subSubCategories.length > 0 ? (
                          <li key={i} className="has-submenu">
                            <Link to={`/category/${slugify(sub.name)}`} onClick={toggleMobileMenu}>
                              {sub.name} <ChevronDown size={14} className="submenu-icon" />
                            </Link>
                            <ul className="submenu">
                              {sub.subSubCategories.map((ss, j) => (
                                <li key={j} onClick={toggleMobileMenu}>
                                  <Link to={`/category/${slugify(ss)}`}>{ss}</Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ) : (
                          <li key={i} onClick={toggleMobileMenu}>
                            <Link to={`/category/${slugify(sub.name)}`}>{sub.name}</Link>
                          </li>
                        )
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
            <li className="nav-item has-dropdown">
              <Link to="/services">OUR SERVICES <ChevronDown size={14} /></Link>
              <ul className="dropdown-menu">
                {serviceCategories.length > 0 ? (
                  serviceCategories.map((cat, ci) => (
                    <li key={ci} onClick={toggleMobileMenu}><Link to={`/services?category=${encodeURIComponent(cat.slug || '')}`}>{cat.name || 'Services'}</Link></li>
                  ))
                ) : (
                  <li onClick={toggleMobileMenu}><Link to="/services">All Services</Link></li>
                )}
              </ul>
            </li>
            <li className="nav-item highlight" onClick={toggleMobileMenu}><Link to="/offers">OFFERS</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;

