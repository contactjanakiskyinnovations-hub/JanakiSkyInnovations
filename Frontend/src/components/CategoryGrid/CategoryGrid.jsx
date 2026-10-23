import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './CategoryGrid.css';

// Curated top drone & robotics categories for instant storefront display
const DEFAULT_TOP_CATEGORIES = [
    {
        _id: 'top-1',
        name: 'Payload Drones',
        slug: 'drones',
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&q=80&auto=format&fit=crop'
    },
    {
        _id: 'top-2',
        name: 'Agriculture Drones',
        slug: 'drones',
        image: 'https://images.unsplash.com/photo-1584715787012-4e6e65a0a40e?w=400&q=80&auto=format&fit=crop'
    },
    {
        _id: 'top-3',
        name: 'Surveillance Drones',
        slug: 'drones',
        image: 'https://images.unsplash.com/photo-1583336663277-620dc1996580?w=400&q=80&auto=format&fit=crop'
    },
    {
        _id: 'top-4',
        name: 'FPV Racing Fleets',
        slug: 'fpv-drone-accessories',
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400&q=80&auto=format&fit=crop'
    },
    {
        _id: 'top-5',
        name: 'Electronics & Sensors',
        slug: 'sensors',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format&fit=crop'
    }
];

const CategoryGrid = ({ categories: propCategories }) => {
    const [categories, setCategories] = useState(() => {
        if (Array.isArray(propCategories) && propCategories.length > 0) {
            return propCategories.slice(0, 5);
        }
        return DEFAULT_TOP_CATEGORIES;
    });

    useEffect(() => {
        if (Array.isArray(propCategories) && propCategories.length > 0) {
            setCategories(propCategories.slice(0, 5));
            return;
        }

        let isMounted = true;
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/api/categories');
                if (!isMounted || !Array.isArray(data) || data.length === 0) return;

                // Priority: categories that have images
                const withImages = data.filter(c => c.image && c.image.trim().length > 0);
                if (withImages.length >= 3) {
                    setCategories(withImages.slice(0, 5));
                } else {
                    // Enrich default top categories with DB data where matched
                    setCategories(DEFAULT_TOP_CATEGORIES);
                }
            } catch (error) {
                // Keep default top categories on error
            }
        };

        fetchCategories();
        return () => { isMounted = false; };
    }, [propCategories]);

    return (
        <section className="category-grid-section">
            <div className="category-grid-inner">
                <h2 className="section-title-clean">Shop by top categories</h2>
                <div className="category-grid-items">
                    {categories.map((cat, idx) => {
                        const cleanLabel = (cat.name || 'Category').replace(/^Drones\s*/i, '').trim() || cat.name;
                        const fallbackImg = DEFAULT_TOP_CATEGORIES[idx % DEFAULT_TOP_CATEGORIES.length].image;
                        return (
                            <Link 
                                key={cat._id || idx} 
                                to={`/category/${cat.slug || 'drones'}`} 
                                className="category-item-clean"
                            >
                                <div className="category-image-wrapper">
                                    <img 
                                        src={cat.image || fallbackImg} 
                                        alt={cat.name} 
                                        loading="lazy"
                                        onError={(e) => {
                                            if (e.target.src !== fallbackImg) {
                                                e.target.src = fallbackImg;
                                            }
                                        }}
                                    />
                                </div>
                                <span className="category-label">{cleanLabel}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;
