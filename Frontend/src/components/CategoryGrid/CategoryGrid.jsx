import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';
import './CategoryGrid.css';

const CategoryGrid = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/api/categories');
                
                // Filter to match top drone categories for the storefront grid
                const targetSlugs = [
                    'payload-drones',
                    'agriculture-drones',
                    'surveillance-drones',
                    'flower-showering-drones',
                    'fpv-drones'
                ];
                
                const filtered = data.filter(cat => targetSlugs.includes(cat.slug));
                
                // If backend does not contain these specific slugs yet (e.g. initial setup),
                // fall back to showing the first 5 categories.
                if (filtered.length > 0) {
                    setCategories(filtered);
                } else {
                    setCategories(data.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 className="spin" size={32} color="var(--primary-orange)" />
            </div>
        );
    }

    return (
        <section className="category-grid-section">
            <div className="category-grid-inner">
                <h2 className="section-title-clean">Shop by top categories</h2>
                <div className="category-grid-items">
                    {categories.map(cat => {
                        // Clean up category labels for displaying (e.g. remove " Drones")
                        const labelName = cat.name.replace(' Drones', '');
                        return (
                            <Link key={cat._id} to={`/category/${cat.slug}`} className="category-item-clean">
                                <div className="category-image-wrapper">
                                    <img src={cat.image || '/placeholder.png'} alt={cat.name} />
                                </div>
                                <span className="category-label">{labelName}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;
