import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Cpu, Settings, Award, Layers, Search, ArrowRight, Activity, Wifi, Link, Cog, Monitor, Cable, Wrench, Printer, Battery, Loader2 } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel';
import api from '../../utils/api';
import './AllCategories.css';
import Seo from '../../utils/seo';

const AllCategories = () => {
    const [categoryHierarchy, setCategoryHierarchy] = useState([]);
    const [activeMainCategory, setActiveMainCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState('');
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        api.get('/api/categories')
            .then(({ data }) => {
                if (!isMounted) return;
                const categories = (Array.isArray(data) ? data : [])
                    .filter(category => category.isActive !== false)
                    .map(category => ({
                        ...category,
                        id: category._id || category.slug || category.name,
                        icon: category.icon || 'Layers',
                        subCategories: (Array.isArray(category.subCategories) ? category.subCategories : [])
                            .map(sub => ({ ...sub, subSubCategories: Array.isArray(sub.subSubCategories) ? sub.subSubCategories : [] })),
                    }));
                setCategoryHierarchy(categories);
                setActiveMainCategory(current => categories.find(category => category.id === current?.id) || categories[0] || null);
                setCategoriesError('');
            })
            .catch(() => {
                if (isMounted) setCategoriesError('Categories could not be loaded. Please refresh and try again.');
            })
            .finally(() => {
                if (isMounted) setCategoriesLoading(false);
            });
        return () => { isMounted = false; };
    }, []);

    // Fetch trending products from live API instead of static mock data
    useEffect(() => {
        const fetchTrendingProducts = async () => {
            setRelatedLoading(true);
            try {
                const { data } = await api.get('/api/products?limit=10');
                setTrendingProducts(data.products || []);
            } catch (error) {
                console.error('Failed to fetch trending products:', error);
                setTrendingProducts([]);
            } finally {
                setRelatedLoading(false);
            }
        };
        fetchTrendingProducts();
    }, []);

    const filteredCategories = categoryHierarchy.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subCategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.subSubCategories.some(name => name.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const CategoryIcon = ({ name }) => {
        const icons = { Cpu, Settings, Award, Package, Activity, Wifi, Link, Cog, Monitor, Cable, Wrench, Printer, Battery, Layers };
        const Icon = icons[name] || Layers;
        return <Icon size={24} />;
    };

    return (
        <div className="all-categories-page">
            <Seo title="All Categories – Shop Drones, Electronics & Robotics" description="Explore the complete category tree of Janaki Sky Innovations – drones, electronics, Arduino, sensors, motors, tools and more." path="/all-categories" />
            <div className="categories-hero">
                <div className="container">
                    <div className="hero-banner">
                        <h1>ALL CATEGORIES</h1>
                        <p>India's Biggest Drone Store - Explore our 5000+ items across all categories.</p>
                    </div>
                </div>
            </div>

            <div className="container explorer-container">

                <div className="category-search-container">
                    <div className="category-search-wrapper">
                        <Search size={20} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search for a category or sub-category..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="explorer-layout">
                    {/* Sidebar: Main Categories */}
                    <aside className="main-cat-sidebar">
                        {categoriesLoading ? <p className="category-load-state">Loading categories…</p> : categoriesError ? <p className="category-load-state">{categoriesError}</p> : filteredCategories.map((cat) => (
                            <button 
                                key={cat.id}
                                className={`main-cat-item ${activeMainCategory?.id === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveMainCategory(cat)}
                            >
                                <span className="cat-icon"><CategoryIcon name={cat.icon} /></span>
                                <span className="cat-name">{cat.name}</span>
                                <ChevronRight size={16} className="arrow" />
                            </button>
                        ))}
                    </aside>

                    {/* Main Content: Sub and Sub-Sub Categories */}
                    <main className="sub-cat-content">
                        {!categoriesLoading && !categoriesError && activeMainCategory && (
                            <>
                                <div className="content-header">
                                    <h2>{activeMainCategory.name}</h2>
                                    <p>{activeMainCategory.description}</p>
                                </div>

                                <div className="sub-cat-grid">
                                    {activeMainCategory.subCategories.map((sub, idx) => (
                                        <div key={idx} className="sub-cat-card">
                                            <h3>{sub.name}</h3>
                                            {sub.subSubCategories.length > 0 ? (
                                                <ul className="sub-sub-list">
                                                    {sub.subSubCategories.map((ssub, sidx) => (
                                                        <li key={sidx}>
                                                            <RouterLink to={`/category/${ssub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                                                                {ssub}
                                                            </RouterLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="direct-items-msg">Direct selection of products available for this category.</p>
                                            )}
                                            <RouterLink to={`/category/${sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="view-all-link">
                                                Explore All <ArrowRight size={14} />
                                            </RouterLink>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Related Items Section */}
            {relatedLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader2 className="spin" size={32} color="var(--primary-orange)" />
                </div>
            ) : trendingProducts.length > 0 ? (
                <div className="categories-trending-wrapper">
                    <ProductCarousel 
                        title="Trending in these categories" 
                        products={trendingProducts} 
                        fullWidth={true} 
                    />
                </div>
            ) : null}
        </div>
    );
};

export default AllCategories;
