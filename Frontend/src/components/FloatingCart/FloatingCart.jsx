import React from 'react';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './FloatingCart.css';

const FloatingCart = () => {
    const { cartCount, cartTotal } = useCart();
    const location = useLocation();

    // Don't show if cart is empty or we are on the cart page
    if (cartCount === 0 || location.pathname === '/cart') {
        return null;
    }

    return (
        <div className="floating-cart-bar">
            <div className="container floating-cart-inner">
                <div className="cart-summary-left">
                    <div className="cart-icon-wrapper">
                        <ShoppingCart size={20} />
                        <span className="cart-badge-dot">{cartCount}</span>
                    </div>
                    <div className="cart-info-text">
                        <span className="item-count">{cartCount} {cartCount === 1 ? 'Item' : 'Items'}</span>
                        <span className="total-amount">₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                
                <Link to="/cart" className="view-cart-btn">
                    GO TO CART <ChevronRight size={18} />
                </Link>
            </div>
        </div>
    );
};

export default FloatingCart;
