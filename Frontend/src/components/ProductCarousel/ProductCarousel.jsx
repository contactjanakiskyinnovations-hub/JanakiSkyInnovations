import React, { useRef, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import ViewToggle from '../ViewToggle/ViewToggle';
import '../ViewToggle/ViewToggle.css';
import './ProductCarousel.css';

const ProductCarousel = ({ title, products, fullWidth = false }) => {
    const carouselRef = useRef(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' = carousel scroll, 'list' = vertical list

    const scroll = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <section className={`product-carousel-section ${fullWidth ? 'full-width' : ''}`}>
            <div className={fullWidth ? 'carousel-full-width-inner' : 'container'}>
                <div className="carousel-header">
                    <h2 className="carousel-title">{title}</h2>
                    <div className="carousel-controls">
                        <ViewToggle view={viewMode} onViewChange={setViewMode} />
                        {viewMode === 'grid' && (
                            <>
                                <button className="carousel-btn" onClick={() => scroll('left')} aria-label="Scroll left">
                                    <ChevronLeft size={24} />
                                </button>
                                <button className="carousel-btn" onClick={() => scroll('right')} aria-label="Scroll right">
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    /* Carousel / horizontal scroll view (default) */
                    <div className="carousel-container" ref={carouselRef}>
                        <div className="carousel-track">
                            {products.map(product => (
                                <div key={product._id || product.id} className="carousel-item">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* List view — vertical stacked rows */
                    <div className="product-list-view">
                        {products.map(product => (
                            <ProductCard key={product._id || product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductCarousel;
