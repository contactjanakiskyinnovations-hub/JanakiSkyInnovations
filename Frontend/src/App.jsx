import React, { useEffect, useState } from "react";
import DroneLoader from "./components/DroneLoader";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import NewArrivals from "./pages/NewArrivals/NewArrivals";
import BestSellers from "./pages/BestSellers/BestSellers";
import CategoryPage from "./pages/CategoryPage/CategoryPage";
import TopRated from "./pages/TopRated/TopRated";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import RelatedProducts from "./pages/RelatedProducts/RelatedProducts";
import MyAccount from "./pages/MyAccount/MyAccount";
import Cart from "./pages/Cart/Cart";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import Wishlist from "./pages/Wishlist/Wishlist";
import AllCategories from "./pages/AllCategories/AllCategories";
import OurServices from "./pages/OurServices/OurServices";
import Offers from "./pages/Offers/Offers";
import SearchResults from "./pages/SearchResults/SearchResults";

import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminCategories from "./pages/Admin/AdminCategories";
import AddProduct from "./pages/Admin/AddProduct";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminCMS from "./pages/Admin/AdminCMS";
import UserDetails from "./pages/Admin/UserDetails";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminRoute from "./components/AdminRoute";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import FloatingCart from "./components/FloatingCart/FloatingCart";
import SocialFloatingButtons from "./components/SocialFloatingButtons/SocialFloatingButtons";
import ScrollToTop from "./components/ScrollToTop";

// Helper component to handle conditional layout
const AppContent = () => {
  return (
    <Routes>
      {/* Admin Login Route (Public, but for admins) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Routes */}
      <Route path="/admin/*" element={
        <AdminRoute>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/products" element={<AdminProducts />} />
              <Route path="/products/add" element={<AddProduct />} />
              <Route path="/categories" element={<AdminCategories />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/users/:id" element={<UserDetails />} />
              <Route path="/cms" element={<AdminCMS />} />
              <Route path="/orders" element={<AdminOrders />} />
              <Route path="/customers" element={<div className="admin-content">Customers Page Coming Soon</div>} />
            </Routes>
          </AdminLayout>
        </AdminRoute>
      } />

      {/* Public Routes */}
      <Route path="*" element={
        <div className="App">
          <Header />
          <FloatingCart />
          <SocialFloatingButtons />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/top-rated" element={<TopRated />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/product/:id/related" element={<RelatedProducts />} />
              <Route path="/account" element={<MyAccount />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/all-categories" element={<AllCategories />} />
              <Route path="/services" element={<OurServices />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DroneLoader />;
  }

  return (
    <React.Fragment>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </React.Fragment>
  );
}

export default App;
