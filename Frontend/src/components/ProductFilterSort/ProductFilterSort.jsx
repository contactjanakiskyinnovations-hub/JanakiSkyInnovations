import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, Star, Tag, X, DollarSign } from 'lucide-react';
import './ProductFilterSort.css';

const SORT_OPTIONS = [
    { label: 'Featured / Recommended', value: '' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Name: A to Z', value: 'name_asc' },
    { label: 'Name: Z to A', value: 'name_desc' },
    { label: 'Highest Rated', value: 'rating_desc' },
    { label: 'Newest First', value: 'newest' },
];

const RATING_OPTIONS = [
    { label: 'All Ratings', value: '' },
    { label: '4★ & above', value: '4' },
    { label: '3★ & above', value: '3' },
];

const ProductFilterSort = ({ onFilterChange, currentFilters = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [sort, setSort] = useState(currentFilters.sort || '');
    const [minPrice, setMinPrice] = useState(currentFilters.minPrice || '');
    const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || '');
    const [minRating, setMinRating] = useState(currentFilters.minRating || '');
    const [name, setName] = useState(currentFilters.name || '');

    const popoverRef = useRef(null);

    // Sync from parent if currentFilters changes externally
    useEffect(() => {
        setSort(currentFilters.sort || '');
        setMinPrice(currentFilters.minPrice || '');
        setMaxPrice(currentFilters.maxPrice || '');
        setMinRating(currentFilters.minRating || '');
        setName(currentFilters.name || '');
    }, [currentFilters.sort, currentFilters.minPrice, currentFilters.maxPrice, currentFilters.minRating, currentFilters.name]);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasActiveFilters = Boolean(sort || minPrice || maxPrice || minRating || name);

    const handleApply = () => {
        if (onFilterChange) {
            onFilterChange({ sort, minPrice, maxPrice, minRating, name });
        }
        setIsOpen(false);
    };

    const handleReset = () => {
        setSort('');
        setMinPrice('');
        setMaxPrice('');
        setMinRating('');
        setName('');
        if (onFilterChange) {
            onFilterChange({ sort: '', minPrice: '', maxPrice: '', minRating: '', name: '' });
        }
        setIsOpen(false);
    };

    const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sort)?.label || 'Sort & Filter';

    return (
        <div className="product-filter-container" ref={popoverRef}>
            <button 
                type="button" 
                className={`product-filter-trigger ${hasActiveFilters ? 'active' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
            >
                <SlidersHorizontal size={16} />
                <span>{sort ? `Sort: ${currentSortLabel}` : 'Filter & Sort'}</span>
                {hasActiveFilters && <span className="filter-active-dot" />}
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div className="product-filter-popover">
                    {/* Sort Dropdown */}
                    <div>
                        <div className="filter-section-title">
                            <ArrowUpDown size={13} /> Sort By
                        </div>
                        <select 
                            className="filter-select-input" 
                            value={sort} 
                            onChange={(e) => setSort(e.target.value)}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name Search Filter */}
                    <div>
                        <div className="filter-section-title">
                            <Tag size={13} /> Filter By Name
                        </div>
                        <input 
                            type="text" 
                            className="filter-select-input"
                            placeholder="e.g. Mini, FPV, Battery..." 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Price Filter */}
                    <div>
                        <div className="filter-section-title">
                            <DollarSign size={13} /> Price Range (₹)
                        </div>
                        <div className="filter-price-inputs">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={minPrice} 
                                onChange={(e) => setMinPrice(e.target.value)} 
                            />
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>to</span>
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={maxPrice} 
                                onChange={(e) => setMaxPrice(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                        <div className="filter-section-title">
                            <Star size={13} /> Minimum Rating
                        </div>
                        <div className="filter-rating-options">
                            {RATING_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`rating-chip ${minRating === opt.value ? 'active' : ''}`}
                                    onClick={() => setMinRating(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="filter-actions">
                        <button type="button" className="filter-reset-btn" onClick={handleReset}>
                            Reset All
                        </button>
                        <button type="button" className="filter-apply-btn" onClick={handleApply}>
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductFilterSort;
