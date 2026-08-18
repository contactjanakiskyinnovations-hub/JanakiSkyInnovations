import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { withVat } from '../utils/price';
import api from '../utils/api';

const CartContext = createContext();

const normalizeProduct = (product) => {
    const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;

    return {
        ...product,
        id: product.id || product._id,
        price: hasDiscount ? product.discountPrice : product.price,
        image: product.image || product.mainImage || product.gallery?.[0] || '/placeholder.png',
    };
};

// Returns the maximum quantity a customer may add to the cart for a product.
// Pre-order products (forcePreOrder=true) can be ordered even when stock is 0,
// so they are capped at 99 instead of being blocked by a 0 stock value.
const getMaximumQuantity = (product) => {
    if (product && product.forcePreOrder === true) return 99;
    const stock = Number(product.stock);
    return Number.isFinite(stock) ? Math.max(stock, 0) : Infinity;
};

export const CartProvider = ({ children }) => {
    const { user, isLoggedIn } = useAuth();

    // Helper to get initial cart items synchronously on mount/refresh
    const getInitialCart = () => {
        try {
            if (typeof window === 'undefined') return [];
            const savedUser = localStorage.getItem('userInfo');
            const parsedUser = savedUser ? JSON.parse(savedUser) : null;
            const key = parsedUser && parsedUser.mobile ? `cart_${parsedUser.mobile}` : 'cart_guest';
            const items = localStorage.getItem(key);
            return items ? JSON.parse(items).map(normalizeProduct) : [];
        } catch (e) {
            console.error('Failed to load initial cart', e);
            return [];
        }
    };

    // Helper to get initial wishlist items synchronously on mount/refresh
    const getInitialWishlist = () => {
        try {
            if (typeof window === 'undefined') return [];
            const savedUser = localStorage.getItem('userInfo');
            const parsedUser = savedUser ? JSON.parse(savedUser) : null;
            const key = parsedUser && parsedUser.mobile ? `wishlist_${parsedUser.mobile}` : 'wishlist_guest';
            const items = localStorage.getItem(key);
            return items ? JSON.parse(items).map(normalizeProduct) : [];
        } catch (e) {
            console.error('Failed to load initial wishlist', e);
            return [];
        }
    };

    const [cartItems, setCartItems] = useState(getInitialCart);
    const [wishlistItems, setWishlistItems] = useState(getInitialWishlist);

    // Track when user is transitioning login states to avoid race condition writes
    const isTransitioningRef = useRef(true);
    const authRef = useRef({ isLoggedIn, user });

    // Keep authRef up-to-date
    useEffect(() => {
        authRef.current = { isLoggedIn, user };
    }, [isLoggedIn, user]);
    useEffect(() => {
        isTransitioningRef.current = true;

        const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]').map(normalizeProduct);
        const guestWishlist = JSON.parse(localStorage.getItem('wishlist_guest') || '[]').map(normalizeProduct);

        if (isLoggedIn && user) {
            const userCartKey = `cart_${user.mobile}`;
            const userWishlistKey = `wishlist_${user.mobile}`;

            const userCart = JSON.parse(localStorage.getItem(userCartKey) || '[]').map(normalizeProduct);
            const userWishlist = JSON.parse(localStorage.getItem(userWishlistKey) || '[]').map(normalizeProduct);

            // Merge guest data into user data if guest data exists
            let mergedCart = [...userCart];
            if (guestCart.length > 0) {
                guestCart.forEach(guestItem => {
                    const existing = mergedCart.find(item => item.id === guestItem.id);
                    if (existing) {
                        existing.quantity = Math.min(existing.quantity + guestItem.quantity, getMaximumQuantity(existing));
                    } else {
                        mergedCart.push(guestItem);
                    }
                });
                localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
                localStorage.removeItem('cart_guest'); // Clear guest cart after merge
            }
            setCartItems(mergedCart);

            let mergedWishlist = [...userWishlist];
            if (guestWishlist.length > 0) {
                guestWishlist.forEach(guestItem => {
                    if (!mergedWishlist.find(item => item.id === guestItem.id)) {
                        mergedWishlist.push(guestItem);
                    }
                });
                localStorage.setItem(userWishlistKey, JSON.stringify(mergedWishlist));
                localStorage.removeItem('wishlist_guest'); // Clear guest wishlist after merge
            }
            setWishlistItems(mergedWishlist);
        } else {
            // Guest mode
            setCartItems(guestCart);
            setWishlistItems(guestWishlist);
        }

        // Release transition block on next tick after state updates are applied
        const timer = setTimeout(() => {
            isTransitioningRef.current = false;
        }, 50);

        return () => clearTimeout(timer);
    }, [isLoggedIn, user]);

    // Save cartItems to localStorage ONLY when cartItems changes (and not during login state transitions)
    useEffect(() => {
        if (isTransitioningRef.current) return;

        const { isLoggedIn: currentIsLoggedIn, user: currentUser } = authRef.current;
        const key = currentIsLoggedIn && currentUser ? `cart_${currentUser.mobile}` : 'cart_guest';
        localStorage.setItem(key, JSON.stringify(cartItems));
    }, [cartItems]);

    // Save wishlistItems to localStorage ONLY when wishlistItems changes
    useEffect(() => {
        if (isTransitioningRef.current) return;

        const { isLoggedIn: currentIsLoggedIn, user: currentUser } = authRef.current;
        const key = currentIsLoggedIn && currentUser ? `wishlist_${currentUser.mobile}` : 'wishlist_guest';
        localStorage.setItem(key, JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    // Sync wishlist to backend (if logged in) — keeps admin panel data fresh

    useEffect(() => {
        if (isTransitioningRef.current) return;
        const { isLoggedIn: currentIsLoggedIn } = authRef.current;
        if (!currentIsLoggedIn || !user) return;

        // Only sync after a short debounce to avoid excessive requests
        const timer = setTimeout(() => {
            api.put('/api/auth/wishlist', { wishlist: wishlistItems })
                .catch(err => console.debug('Wishlist sync skipped:', err.message));
        }, 500);

        return () => clearTimeout(timer);
    }, [wishlistItems]);

    // Sync cart to backend (if logged in) — keeps admin panel data fresh
    useEffect(() => {
        if (isTransitioningRef.current) return;
        const { isLoggedIn: currentIsLoggedIn } = authRef.current;
        if (!currentIsLoggedIn || !user) return;

        const timer = setTimeout(() => {
            api.put('/api/auth/cart', { cart: cartItems })
                .catch(err => console.debug('Cart sync skipped:', err.message));
        }, 500);

        return () => clearTimeout(timer);
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        const cartProduct = normalizeProduct(product);
        const maximumQuantity = getMaximumQuantity(cartProduct);
        const requestedQuantity = Math.max(1, Number(quantity) || 1);

        if (maximumQuantity === 0) return;

        setCartItems(prev => {
            const existing = prev.find(item => item.id === cartProduct.id);
            if (existing) {
                return prev.map(item => 
                    item.id === cartProduct.id
                        ? { ...item, quantity: Math.min(item.quantity + requestedQuantity, maximumQuantity) }
                        : item
                );
            }
            return [...prev, { ...cartProduct, quantity: Math.min(requestedQuantity, maximumQuantity) }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCartItems(prev => {
            const item = prev.find(item => item.id === productId);
            if (!item) return prev;
            const newQty = item.quantity + delta;
            // When quantity reaches 0, remove the item from the cart entirely
            // so the ProductCard reverts to showing the "Add to Cart" button
            // and the floating cart bar hides when the cart is empty.
            if (newQty <= 0) {
                return prev.filter(item => item.id !== productId);
            }
            return prev.map(item =>
                item.id === productId
                    ? { ...item, quantity: Math.min(newQty, getMaximumQuantity(item)) }
                    : item
            );
        });
    };

    const toggleWishlist = (product) => {
        const wishlistProduct = normalizeProduct(product);
        setWishlistItems(prev => {
            const isWishlisted = prev.find(item => item.id === wishlistProduct.id);
            if (isWishlisted) {
                return prev.filter(item => item.id !== wishlistProduct.id);
            }
            return [...prev, wishlistProduct];
        });
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (withVat(item.price) * item.quantity), 0);
    const wishlistCount = wishlistItems.length;

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            wishlistItems, 
            addToCart, 
            removeFromCart, 
            updateQuantity,
            toggleWishlist,
            clearCart,
            cartCount,
            cartTotal,
            wishlistCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
