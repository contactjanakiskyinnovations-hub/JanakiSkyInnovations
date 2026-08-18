import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Wishlist.css';
import Seo from '../../utils/seo';

const Wishlist = () => {
    const { wishlistItems, addToCart, toggleWishlist } = useCart();

    const handleAddToCartFromWishlist = (product) => {
        addToCart(product);
        toggleWishlist(product); // Remove from wishlist after adding to cart
    };

    if (wishlistItems.length === 0) {
        return (
            <div className="empty-wishlist-container">
                <Seo noindex title="My Wishlist" description="Your saved drones and components at Janaki Sky Innovations." path="/wishlist" />
                <Heart size={80} strokeWidth={1} />
                <h2>Your wishlist is empty</h2>
                <p>Save your favorite drones and components here for later!</p>
                <Link to="/" className="start-browsing-btn">Explore Products</Link>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <Seo noindex title="My Wishlist" description="Your saved drones and components at Janaki Sky Innovations." path="/wishlist" />
            <div className="container">
                <div className="wishlist-header">
                    <Link to="/" className="back-link"><ArrowLeft size={18} /> Back to Shopping</Link>
                    <h1>My Wishlist ({wishlistItems.length})</h1>
                </div>

                <div className="wishlist-grid">
                    {wishlistItems.map((item) => (
                        <ProductCard 
                            key={item.id} 
                            product={item} 
                            showWishlist={true}
                            onAddToCart={handleAddToCartFromWishlist}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
