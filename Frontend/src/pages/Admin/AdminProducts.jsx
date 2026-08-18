import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, ExternalLink, Loader2, X, SlidersHorizontal, Columns3, MoreVertical, MessageSquare, Star, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';


// Build the edit-modal image slot list from the product's existing gallery.
const initEditImages = (product) => {
    const gallery = (product && Array.isArray(product.gallery) ? product.gallery : []).filter(Boolean);
    const source = gallery.length > 0 ? gallery : (product && product.mainImage ? [product.mainImage] : []);
    return source.map((url) => ({
        key: `img-${Math.random().toString(36).slice(2, 9)}`,
        url,
        fileName: (() => {
            try {
                return String(url).split('/').pop().split('?')[0];
            } catch (e) {
                return '';
            }
        })(),
        file: null,
        status: 'keep',
    }));
};

const AdminProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    // Dynamic Category Taxonomy loaded from DB
    const [categoryTaxonomy, setCategoryTaxonomy] = useState({});

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        sku: '',
        price: 0,
        discountPrice: 0,
        stock: 0,
        brand: '',
        category: '',
        subCategory: '',
        subSubCategory: '',
        description: '',
        shortSummary: '',
        comparisonTable: { isEnabled: false, comparisonProductOneName: '', comparisonProductTwoName: '', rows: [] },
        images: [],
        howToUse: '',
        assemblyMaintenance: '',
        inTheBox: '',
        keyFeatures: ''
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editImages, setEditImages] = useState([]); // { key, url, fileName, file, status: 'keep'|'delete' }
    const [actionMenuProductId, setActionMenuProductId] = useState(null);
    const [bestSellerThreshold, setBestSellerThreshold] = useState(10);
    const [newArrivalDays, setNewArrivalDays] = useState(30);
    const [editingPromotionSetting, setEditingPromotionSetting] = useState(null);
    const [reviewsProduct, setReviewsProduct] = useState(null);
    const [reviewsBusy, setReviewsBusy] = useState(false);
    const [reviewsSort, setReviewsSort] = useState('desc'); // 'desc' | 'asc'

        const toggleReviewsSort = () => setReviewsSort(s => (s === 'desc' ? 'asc' : 'desc'));

    // Save feedback (non-blocking, auto-dismissed)
    const [saveNotice, setSaveNotice] = useState('');
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        if (!saveNotice) return;
        const t = setTimeout(() => setSaveNotice(''), 4000);
        return () => clearTimeout(t);
    }, [saveNotice]);

    // Reviews column is sorted client-side — the admin product list already returns ratings/numReviews.
    const sortedProducts = useMemo(() => {
        if (!reviewsSort) return products;
        return [...products].sort((a, b) => {
            const ra = Number(a.ratings) || 0;
            const rb = Number(b.ratings) || 0;
            if (rb !== ra) return reviewsSort === 'desc' ? rb - ra : ra - rb;
            const na = a.numReviews || 0;
            const nb = b.numReviews || 0;
            return reviewsSort === 'desc' ? nb - na : na - nb;
        });
    }, [products, reviewsSort]);

    const openReviews = (product) => {
        setReviewsProduct(product);
        setActionMenuProductId(null);
    };

    const closeReviews = () => setReviewsProduct(null);

    const handleToggleReviewComment = async (reviewId, currentVisible) => {
        if (!reviewsProduct) return;
        setReviewsBusy(true);
        try {
            const { data } = await api.put(`/api/products/${reviewsProduct._id}/reviews/${reviewId}`, {
                visible: !currentVisible,
            });
            setReviewsProduct(data);
            setProducts(prev => prev.map(p => String(p._id) === String(data._id) ? data : p));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update the review comment');
        } finally {
            setReviewsBusy(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!reviewsProduct) return;
        if (!window.confirm('Delete this review? The product rating will be recalculated.')) return;
        setReviewsBusy(true);
        try {
            const { data } = await api.delete(`/api/products/${reviewsProduct._id}/reviews/${reviewId}`);
            setReviewsProduct(data);
            setProducts(prev => prev.map(p => String(p._id) === String(data._id) ? data : p));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete the review');
        } finally {
            setReviewsBusy(false);
        }
    };

    // Specifications & Category State Handlers
    const [specFields, setSpecFields] = useState([{ key: '', value: '' }]);
    const handleAddSpec = () => setSpecFields([...specFields, { key: '', value: '' }]);
    const handleRemoveSpec = (index) => setSpecFields(specFields.filter((_, i) => i !== index));
    const handleSpecChange = (index, field, value) => {
        const newFields = [...specFields];
        newFields[index][field] = value;
        setSpecFields(newFields);
    };
    const handleComparisonTableChange = (field, value) => {
        setProductForm(previous => ({ ...previous, comparisonTable: { ...previous.comparisonTable, [field]: value } }));
    };
    const handleAddComparisonRow = () => {
        setProductForm(previous => ({
            ...previous,
            comparisonTable: {
                ...previous.comparisonTable,
                rows: [...previous.comparisonTable.rows, { feature: '', selectedProductValue: '', comparisonProductOneValue: '', comparisonProductTwoValue: '' }]
            }
        }));
    };
    const handleComparisonRowChange = (index, field, value) => {
        setProductForm(previous => ({
            ...previous,
            comparisonTable: {
                ...previous.comparisonTable,
                rows: previous.comparisonTable.rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row)
            }
        }));
    };
    const handleRemoveComparisonRow = (index) => {
        setProductForm(previous => ({
            ...previous,
            comparisonTable: { ...previous.comparisonTable, rows: previous.comparisonTable.rows.filter((_, rowIndex) => rowIndex !== index) }
        }));
    };

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await api.get('/api/categories');
                const activeCats = data.filter(cat => cat.isActive !== false);

                const taxonomy = {};
                activeCats.forEach(cat => {
                    taxonomy[cat.name] = {};
                    if (cat.subCategories && cat.subCategories.length > 0) {
                        cat.subCategories.forEach(sub => {
                            taxonomy[cat.name][sub.name] = sub.subSubCategories || [];
                        });
                    }
                });
                setCategoryTaxonomy(taxonomy);
            } catch (err) {
                console.error('Failed to load categories hierarchy:', err);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadPromotionSettings = async () => {
            try {
                const { data } = await api.get('/api/products/promotion-settings');
                setBestSellerThreshold(data.bestSellerThreshold);
                setNewArrivalDays(data.newArrivalDays);
            } catch (err) {
                console.error('Failed to load promotion settings:', err);
            }
        };

        loadPromotionSettings();
    }, []);

    const handleCategoryChange = (e) => {
        const selectedCat = e.target.value;
        const subCats = Object.keys(categoryTaxonomy[selectedCat] || {});
        let firstSub = '';
        let firstSubSub = '';
        if (subCats.length > 0) {
            firstSub = subCats[0];
            const subSubCats = categoryTaxonomy[selectedCat][firstSub] || [];
            firstSubSub = subSubCats.length > 0 ? subSubCats[0] : '';
        }
        setProductForm(prev => ({
            ...prev,
            category: selectedCat,
            subCategory: firstSub,
            subSubCategory: firstSubSub
        }));
    };

    const handleSubCategoryChange = (e) => {
        const selectedSubCat = e.target.value;
        const subSubCats = categoryTaxonomy[productForm.category][selectedSubCat] || [];
        const firstSubSub = subSubCats.length > 0 ? subSubCats[0] : '';
        setProductForm(prev => ({
            ...prev,
            subCategory: selectedSubCat,
            subSubCategory: firstSubSub
        }));
    };

    const debounceRef = useRef(null);

    const fetchProducts = useCallback(async (keyword = '', pageNumber = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            params.append('pageNumber', pageNumber);
            const { data } = await api.get(`/api/products?${params.toString()}`);
            setProducts(data.products);
            setPage(data.page);
            setPages(data.pages);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchProducts('', 1);
    }, [fetchProducts]);

    // Debounced search — fires 400ms after user stops typing
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setPage(1);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchProducts(val, 1);
        }, 400);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setPage(1);
        fetchProducts('', 1);
    };

    const deleteProductHandler = async (id) => {
        if (window.confirm('Are you absolutely sure you want to delete this product?')) {
            try {
                await api.delete(`/api/products/${id}`);
                fetchProducts(searchTerm, page); // Refresh current page
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    const preOrderToggleHandler = async (product) => {
        try {
            await api.put('/api/products/' + product._id + '/pre-order');
            fetchProducts(searchTerm, page);
        } catch (err) {
            alert(err.response?.data?.message || 'Unable to toggle pre-order');
        }
    };

    const updatePromotion = async (product, field) => {
        try {
            const { data } = await api.put(`/api/products/${product._id}/promotions`, {
                [field]: !product[field]
            });
            setProducts(currentProducts => currentProducts.map(currentProduct =>
                currentProduct._id === product._id ? data : currentProduct
            ));
        } catch (err) {
            alert(err.response?.data?.message || 'Unable to update product promotion');
        } finally {
            setActionMenuProductId(null);
        }
    };

    const savePromotionSetting = async (setting) => {
        const value = Number(setting === 'newArrivalDays' ? newArrivalDays : bestSellerThreshold);
        if (!Number.isInteger(value) || value < 1) {
            alert('Enter a whole number of at least 1.');
            return;
        }

        try {
            const { data } = await api.put('/api/products/promotion-settings', { [setting]: value });
            setBestSellerThreshold(data.bestSellerThreshold);
            setNewArrivalDays(data.newArrivalDays);
            setEditingPromotionSetting(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Unable to update promotion setting');
        }
    };

    // Open Edit Modal
    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setEditImages(initEditImages(product));

        // Load dynamic specs
        const specs = product.specifications || {};
        const parsedSpecs = Object.entries(specs).map(([key, value]) => ({ key, value }));
        setSpecFields(parsedSpecs.length > 0 ? parsedSpecs : [{ key: '', value: '' }]);

        // Resolve clean initial values for category, subCategory, and subSubCategory.
        let initialCat = product.category || 'Drones';
        let initialSub = product.subCategory || 'Payload Drones';
        let initialSubSub = product.subSubCategory || 'Package Carrier';

        if (product.category?.name) {
            initialCat = product.category.name;
        } else if (product.category && !categoryTaxonomy[product.category]) {
            // Check if it matches any subcategory (to resolve Main Category for legacy products)
            const matchedMain = Object.keys(categoryTaxonomy).find(mainCat =>
                Object.keys(categoryTaxonomy[mainCat]).some(subCat => 
                    subCat.toLowerCase() === product.category.toString().toLowerCase() ||
                    subCat.toLowerCase() === product.subCategory?.toString().toLowerCase()
                )
            );
            if (matchedMain) {
                initialCat = matchedMain;
            }
        }

        if (!categoryTaxonomy[initialCat]) {
            const mainCats = Object.keys(categoryTaxonomy);
            initialCat = mainCats.length > 0 ? mainCats[0] : 'Drones';
        }
        const subCats = Object.keys(categoryTaxonomy[initialCat] || {});
        if (!subCats.includes(initialSub)) {
            initialSub = subCats.length > 0 ? subCats[0] : '';
        }
        const subSubCats = categoryTaxonomy[initialCat]?.[initialSub] || [];
        if (!subSubCats.includes(initialSubSub)) {
            initialSubSub = subSubCats.length > 0 ? subSubCats[0] : '';
        }

        setProductForm({
            name: product.name || '',
            sku: product.sku || '',
            price: product.price || 0,
            discountPrice: product.discountPrice || 0,
            stock: product.stock || 0,
            brand: product.brand || '',
            category: initialCat,
            subCategory: initialSub,
            subSubCategory: initialSubSub,
            description: product.description || '',
            shortSummary: product.shortSummary || '',
            comparisonTable: product.comparisonTable || { isEnabled: false, comparisonProductOneName: '', comparisonProductTwoName: '', rows: [] },
            images: product.gallery || [],
            howToUse: product.howToUse || '',
            assemblyMaintenance: product.assemblyMaintenance || '',
            inTheBox: product.inTheBox || '',
            keyFeatures: product.keyFeatures || ''
        });
        setIsEditModalOpen(true);
    };

    // Handle File Upload in Edit Modal
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = ''; // allow re-selecting the same file

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed (JPG, PNG, WEBP, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be 2 MB or less');
            return;
        }

        // Queue locally — the preview shows immediately and the actual ImageKit
        // upload happens when the user clicks "Update Product".
        setEditImages(prev => [
            ...prev,
            { key: `new-${Date.now()}`, url: '', fileName: '', file, status: 'keep' },
        ]);
    };

    const handleReplaceEditImage = (key, e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        if (!file.type || !file.type.startsWith('image/')) { alert('Only image files are allowed'); return; }
        if (file.size > 2 * 1024 * 1024) { alert('Image size must be 2 MB or less'); return; }
        setEditImages(prev => prev.map(slot => (slot.key === key ? { ...slot, file, status: 'keep' } : slot)));
    };

    const handleRemoveEditImage = (key) => {
        if (!window.confirm('Remove this image? It will be deleted from ImageKit when you save the product.')) return;
        setEditImages(prev => prev.map(slot => (slot.key === key ? { ...slot, status: 'delete' } : slot)));
    };

    // Submit Product Updates
    const handleUpdateProductSubmit = async () => {
        if (!productForm.name || !productForm.sku || !productForm.price || !productForm.category) {
            alert('Please fill out all required fields (Name, SKU, Price, and Category)');
            return;
        }

        // Filter out empty specs
        const technicalSpecs = specFields
            .filter(spec => spec.key.trim() !== '' && spec.value.trim() !== '')
            .reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

        // ---- Deferred uploads & cleanup (edit modal) ----
        setUploading(true);
        const uploadsFolder = (productForm.sku || (editingProduct && editingProduct.sku) || 'product');
        let finalImages = [];
        try {
            // 1) Delete any images the admin removed from the product.
            const deletedNames = (editImages || [])
                .filter((s) => s && s.status === 'delete' && s.fileName)
                .map((s) => s.fileName);
            for (const name of deletedNames) {
                try {
                    await api.delete('/api/upload', { params: { context: 'product', folderPath: uploadsFolder, name } });
                } catch (err) {
                    console.error('[ImageKit] Failed to delete image:', name, err.message);
                }
            }

            // 2) Upload new/replaced images (the slot index re-uses the image-<n> name).
            if (editImages && editImages.length > 0) {
                let seq = 0;
                for (const slot of editImages) {
                    if (!slot || slot.status === 'delete') continue;
                    seq += 1;
                    if (slot.file) {
                        const formData = new FormData();
                        formData.append('image', slot.file);
                        formData.append('context', 'product');
                        formData.append('folderPath', uploadsFolder);
                        formData.append('index', String(seq));
                        const { data } = await api.post('/api/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        finalImages.push(data.url);
                    } else if (slot.url) {
                        finalImages.push(slot.url);
                    }
                }
            } else {
                finalImages = [...(productForm.images || [])];
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Image upload failed. The product was not saved.');
            setUploading(false);
            return;
        }
        setUploading(false);

        const submissionData = {
            ...productForm,
            images: finalImages,
            technicalSpecs
        };

        setSaving(true);
                try {
            await api.put(`/api/products/${editingProduct._id}`, submissionData);
            setSaveNotice('Product updated successfully!');
            setSaveError('');
            setIsEditModalOpen(false);
            setEditingProduct(null);
            fetchProducts(searchTerm, page);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to update product details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-products">
            <div className="page-actions">
                <div className="search-bar" style={{ flexGrow: 1, maxWidth: '520px', position: 'relative' }}>
                    <Search size={18} style={{ color: searchTerm ? 'var(--primary-orange)' : '#94a3b8', transition: 'color 0.2s' }} />
                    <input 
                        type="text" 
                        placeholder="Search by name, SKU, or brand... (auto-search)"
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{ paddingRight: searchTerm ? '36px' : '12px' }}
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px' }}
                            title="Clear search"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
                <div className="action-buttons">
                    <button className="secondary-btn" onClick={() => fetchProducts(searchTerm, page)}>
                        <Filter size={18} />
                        Refresh
                    </button>
                    <button className="primary-btn" onClick={() => navigate('/admin/products/add')}>
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>
            {searchTerm && !loading && (
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SlidersHorizontal size={14} style={{ color: 'var(--primary-orange)' }} />
                    Showing <strong style={{ color: '#0f172a' }}>{products.length}</strong> result{products.length !== 1 ? 's' : ''} for &ldquo;<span style={{ color: 'var(--primary-orange)' }}>{searchTerm}</span>&rdquo;
                </div>
            )}

                        {error && (
                <div className="admin-banner admin-banner-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
            {location.state?.added && (
                <div className="admin-banner admin-banner-success">
                    <CheckCircle size={18} />
                    Product '{location.state.productName || ''}' added successfully!
                </div>
            )}
            {saveNotice && (
                <div className="admin-banner admin-banner-success">
                    <CheckCircle size={18} />
                    {saveNotice}
                </div>
            )}
            {saveError && (
                <div className="admin-banner admin-banner-error">
                    <AlertCircle size={18} />
                    {saveError}
                </div>
            )}

            <div className="admin-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product Details</th>
                                <th>SKU Reference</th>
                                <th>Category Assigned</th>
                                <th>List Price</th>
                                <th>Stock Qty</th>
                                <th>Status Badge</th>
                                <th>
                                    <button type="button" onClick={toggleReviewsSort} title="Sort by average rating" style={{ border: 'none', background: 'transparent', padding: 0, color: '#0f172a', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        Reviews <span style={{ fontSize: '13px' }}>{reviewsSort === 'desc' ? '↓' : '↑'}</span>
                                    </button>
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader2 size={28} className="spin" style={{ margin: '0 auto', color: 'var(--primary-orange)' }} />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: '500' }}>No active catalog products found.</td>
                                </tr>
                            ) : (
                                sortedProducts.map((product) => (
                                    <tr key={product._id}>
                                        <td className="product-td">
                                            <div className="product-info-cell">
                                                <div className="product-img-mini" style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {product.gallery && product.gallery[0] ? (
                                                        <img src={product.gallery[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>No Image</span>
                                                    )}
                                                </div>
                                                <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700', color: '#0f172a' }}>
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{product.sku}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>
                                                    {product.category || 'Uncategorized'}
                                                </span>
                                                {product.subCategory && (
                                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                                                        {product.subCategory}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '800', color: '#0f172a' }}>₹{product.price.toLocaleString('en-IN')}</td>
                                        <td style={{ fontWeight: '700' }}>{product.stock}</td>
                                        <td>
                                            <span className={`status-badge ${product.stock > 0 ? 'completed' : 'pending'}`}>
                                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569', lineHeight: 1 }} title={`${Number(product.ratings || 0).toFixed(1)} out of 5 from ${product.numReviews || 0} review${Number(product.numReviews) === 1 ? '' : 's'}`}>
                                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{Number(product.ratings || 0).toFixed(1)}</span>
                                                <span style={{ display: 'inline-flex', gap: 1, color: '#FF8F00' }}>
                                                    {[1, 2, 3, 4, 5].map((s) => (<Star key={s} size={11} fill={s <= (product.ratings || 0) ? 'currentColor' : 'none'} stroke="none" />))}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>({product.numReviews || 0})</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions" style={{ display: 'flex', gap: '6px' }}>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px' }} onClick={() => handleOpenEditModal(product)} title="Edit Specifications">
                                                    <Edit size={14} />
                                                </button>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => deleteProductHandler(product._id)} title="Delete Listing">
                                                    <Trash2 size={14} />
                                                </button>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px' }} onClick={() => window.open(`/product/${product._id}`, '_blank')} title="View Storefront">
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button className="secondary-btn" style={{ padding: '6px 8px', borderRadius: '6px' }} onClick={() => openReviews(product)} title="Customer Ratings & Reviews">
                                                    <MessageSquare size={14} />
                                                </button>
                                                <div style={{ position: 'relative' }}>
                                                    <button className="secondary-btn" style={{ padding: '6px 8px', borderRadius: '6px' }} onClick={() => setActionMenuProductId(currentId => currentId === product._id ? null : product._id)} title="More Actions">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {actionMenuProductId === product._id && (
                                                        <div style={{ position: 'absolute', right: 0, top: '36px', width: '220px', zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)', padding: '8px' }}>
                                                            <button type="button" onClick={() => updatePromotion(product, 'forceNewArrival')} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '9px', cursor: 'pointer' }}>
                                                                {product.forceNewArrival ? 'Remove forced New Arrival' : 'Force New Arrival'}
                                                            </button>
                                                            <button type="button" onClick={() => updatePromotion(product, 'forceBestSeller')} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '9px', cursor: 'pointer' }}>
                                                                {product.forceBestSeller ? 'Remove forced Best Seller' : 'Force Best Seller'}
                                                            </button>
                                                            <button type="button" onClick={() => preOrderToggleHandler(product)} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '9px', cursor: 'pointer' }}>
                                                                {product.forcePreOrder ? 'Remove Pre-Order' : 'Force Pre-Order'}
                                                            </button>
                                                            <div style={{ padding: '8px 9px 2px', fontSize: '12px', color: '#64748b' }}>
                                                                Delivered units sold: {product.salesCount || 0}
                                                            </div>
                                                            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', padding: '10px 9px 2px', fontSize: '12px', color: '#475569' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                                                                    <span>New Arrival: {editingPromotionSetting === 'newArrivalDays' ? '' : `${newArrivalDays} days`}</span>
                                                                    {editingPromotionSetting === 'newArrivalDays' ? (
                                                                        <>
                                                                            <input type="number" min="1" value={newArrivalDays} onChange={(event) => setNewArrivalDays(event.target.value)} style={{ width: '52px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                                            <button type="button" onClick={() => savePromotionSetting('newArrivalDays')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-orange)', cursor: 'pointer', fontWeight: '700' }}>Save</button>
                                                                        </>
                                                                    ) : (
                                                                        <button type="button" onClick={() => setEditingPromotionSetting('newArrivalDays')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-orange)', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                    <span>Best Seller: {editingPromotionSetting === 'bestSellerThreshold' ? '' : `${bestSellerThreshold} sales`}</span>
                                                                    {editingPromotionSetting === 'bestSellerThreshold' ? (
                                                                        <>
                                                                            <input type="number" min="1" value={bestSellerThreshold} onChange={(event) => setBestSellerThreshold(event.target.value)} style={{ width: '52px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                                            <button type="button" onClick={() => savePromotionSetting('bestSellerThreshold')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-orange)', cursor: 'pointer', fontWeight: '700' }}>Save</button>
                                                                        </>
                                                                    ) : (
                                                                        <button type="button" onClick={() => setEditingPromotionSetting('bestSellerThreshold')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-orange)', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pages > 1 && (
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <button 
                            className="secondary-btn" 
                            disabled={page === 1}
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            style={{ padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        {[...Array(pages).keys()].map((x) => (
                            <button
                                key={x + 1}
                                className={page === x + 1 ? 'primary-btn' : 'secondary-btn'}
                                onClick={() => setPage(x + 1)}
                                style={{ padding: '8px 12px', minWidth: '40px', textAlign: 'center' }}
                            >
                                {x + 1}
                            </button>
                        ))}
                        <button 
                            className="secondary-btn" 
                            disabled={page === pages}
                            onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                            style={{ padding: '8px 16px', cursor: page === pages ? 'not-allowed' : 'pointer' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* PRODUCT EDIT MODAL DIALOG */}
            {isEditModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="admin-card" style={{ width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Edit Product Specifications</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Product Name *</label>
                                <input 
                                    type="text" 
                                    value={productForm.name} 
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                                    placeholder="e.g. Soldering Iron Kit" 
                                />
                            </div>

                            <div className="input-group">
                                <label>SKU Reference *</label>
                                <input 
                                    type="text" 
                                    value={productForm.sku} 
                                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} 
                                    placeholder="e.g. SKU-MAV3-PRO" 
                                />
                            </div>

                            <div className="input-group">
                                <label>Stock Qty *</label>
                                <input 
                                    type="number" 
                                    value={productForm.stock} 
                                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} 
                                />
                            </div>

                            <div className="input-group">
                                <label>Price (₹) *</label>
                                <input 
                                    type="number" 
                                    value={productForm.price} 
                                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })} 
                                />
                            </div>

                            <div className="input-group">
                                <label>Discount Price (₹)</label>
                                <input 
                                    type="number" 
                                    value={productForm.discountPrice} 
                                    onChange={(e) => setProductForm({ ...productForm, discountPrice: parseFloat(e.target.value) || 0 })} 
                                />
                            </div>

                            <div className="input-group">
                                <label>Brand/Manufacturer</label>
                                <input 
                                    type="text" 
                                    value={productForm.brand} 
                                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} 
                                    placeholder="e.g. DJI" 
                                />
                            </div>

                            <div className="input-group">
                                <label>Main Category Assigned *</label>
                                <select 
                                    value={productForm.category}
                                    onChange={handleCategoryChange}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', outline: 'none', background: 'white' }}
                                >
                                    {Object.keys(categoryTaxonomy).length === 0 ? (
                                        <option value="">Loading categories...</option>
                                    ) : (
                                        Object.keys(categoryTaxonomy).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Sub-Category *</label>
                                <select 
                                    value={productForm.subCategory}
                                    onChange={handleSubCategoryChange}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', outline: 'none', background: 'white' }}
                                    disabled={!productForm.category}
                                >
                                    {!productForm.category ? (
                                        <option value="">Select main category first</option>
                                    ) : Object.keys(categoryTaxonomy[productForm.category] || {}).length === 0 ? (
                                        <option value="">No sub-categories available</option>
                                    ) : (
                                        Object.keys(categoryTaxonomy[productForm.category] || {}).map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Sub-Sub-Category *</label>
                                <select 
                                    value={productForm.subSubCategory}
                                    onChange={(e) => setProductForm({ ...productForm, subSubCategory: e.target.value })}
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', outline: 'none', background: 'white', width: '100%' }}
                                    disabled={!productForm.subCategory}
                                >
                                    {!productForm.subCategory ? (
                                        <option value="">Select sub-category first</option>
                                    ) : (categoryTaxonomy[productForm.category]?.[productForm.subCategory] || []).length === 0 ? (
                                        <option value="">No sub-sub-categories available</option>
                                    ) : (
                                        (categoryTaxonomy[productForm.category]?.[productForm.subCategory] || []).map((ss) => (
                                            <option key={ss} value={ss}>{ss}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Product Description</label>
                                <textarea 
                                    value={productForm.description} 
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} 
                                    rows="3"
                                    placeholder="Detailed descriptive outline..."
                                ></textarea>
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Short Summary</label>
                                <textarea 
                                    value={productForm.shortSummary} 
                                    onChange={(e) => setProductForm({ ...productForm, shortSummary: e.target.value })} 
                                    rows="2"
                                    placeholder="Brief product summary for the detail page..."
                                ></textarea>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                    <label style={{fontWeight: '700'}}>Technical Specifications</label>
                                    <button type="button" onClick={handleAddSpec} className="icon-btn-sm primary" style={{background: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <Plus size={14} /> Add Spec
                                    </button>
                                </div>
                                <div className="specs-list" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                    {specFields.map((spec, index) => (
                                        <div key={index} className="spec-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px'}}>
                                            <input 
                                                type="text" 
                                                placeholder="Feature (e.g. Voltage)" 
                                                value={spec.key}
                                                onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                                                style={{padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Value (e.g. 5V)" 
                                                value={spec.value}
                                                onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                                style={{padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                                            />
                                            <button type="button" onClick={() => handleRemoveSpec(index)} className="icon-btn-sm danger" style={{height: '100%', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px', cursor: 'pointer'}}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <div className="admin-comparison-card" style={{ marginBottom: 0 }}>
                                    <div className="admin-comparison-header">
                                        <div className="admin-comparison-title">
                                            <Columns3 size={20} />
                                            <div>
                                                <h4>Comparison Table</h4>
                                                <div className="admin-comparison-subtitle">Compare specs against competing drone models</div>
                                            </div>
                                        </div>
                                        <label className="admin-comparison-toggle">
                                            <input type="checkbox" checked={productForm.comparisonTable.isEnabled} onChange={(event) => handleComparisonTableChange('isEnabled', event.target.checked)} />
                                            {productForm.comparisonTable.isEnabled ? 'Enabled' : 'Disabled'}
                                        </label>
                                    </div>
                                    {productForm.comparisonTable.isEnabled && (
                                        <div className="admin-comparison-body">
                                            <div className="admin-comparison-names-grid">
                                                <div className="admin-comparison-name-field">
                                                    <label>Product 1 Name</label>
                                                    <input value={productForm.comparisonTable.comparisonProductOneName} onChange={(event) => handleComparisonTableChange('comparisonProductOneName', event.target.value)} placeholder="e.g. DJI Mini 4 Pro" />
                                                </div>
                                                <div className="admin-comparison-name-field">
                                                    <label>Product 2 Name</label>
                                                    <input value={productForm.comparisonTable.comparisonProductTwoName} onChange={(event) => handleComparisonTableChange('comparisonProductTwoName', event.target.value)} placeholder="e.g. Autel EVO Nano+" />
                                                </div>
                                            </div>

                                            <div className="admin-comparison-table-wrapper">
                                                <div className="admin-comparison-table-head">
                                                    <div>Feature Name</div>
                                                    <div>This Product</div>
                                                    <div>{productForm.comparisonTable.comparisonProductOneName || 'Product 1'}</div>
                                                    <div>{productForm.comparisonTable.comparisonProductTwoName || 'Product 2'}</div>
                                                    <div>Action</div>
                                                </div>
                                                {productForm.comparisonTable.rows.length === 0 ? (
                                                    <div className="admin-comparison-empty-rows">
                                                        No comparison features added yet. Click &quot;Add Feature Row&quot; below to add rows.
                                                    </div>
                                                ) : (
                                                    productForm.comparisonTable.rows.map((row, index) => (
                                                        <div key={index} className="admin-comparison-table-row">
                                                            <input value={row.feature} onChange={(event) => handleComparisonRowChange(index, 'feature', event.target.value)} placeholder="e.g. Weight" />
                                                            <input value={row.selectedProductValue} onChange={(event) => handleComparisonRowChange(index, 'selectedProductValue', event.target.value)} placeholder="e.g. 249g" />
                                                            <input value={row.comparisonProductOneValue} onChange={(event) => handleComparisonRowChange(index, 'comparisonProductOneValue', event.target.value)} placeholder="e.g. 249g" />
                                                            <input value={row.comparisonProductTwoValue} onChange={(event) => handleComparisonRowChange(index, 'comparisonProductTwoValue', event.target.value)} placeholder="e.g. 249g" />
                                                            <button type="button" onClick={() => handleRemoveComparisonRow(index)} className="icon-btn-sm danger" title="Remove Feature">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <button type="button" onClick={handleAddComparisonRow} className="admin-comparison-add-btn">
                                                <Plus size={16} /> Add Feature Row
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>How to Use Instructions</label>
                                <textarea 
                                    value={productForm.howToUse} 
                                    onChange={(e) => setProductForm({ ...productForm, howToUse: e.target.value })} 
                                    rows="4"
                                    placeholder="Step-by-step product guidelines..."
                                ></textarea>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Assembly & Maintenance Guide</label>
                                <textarea 
                                    value={productForm.assemblyMaintenance} 
                                    onChange={(e) => setProductForm({ ...productForm, assemblyMaintenance: e.target.value })} 
                                    rows="3"
                                    placeholder="Pre-assembly status, maintenance check procedures..."
                                ></textarea>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Key Features</label>
                                <textarea 
                                    value={productForm.keyFeatures} 
                                    onChange={(e) => setProductForm({ ...productForm, keyFeatures: e.target.value })} 
                                    rows="5"
                                    placeholder={`● Ultra-lightweight design (~135g) – easy to carry.\n● 4K video with stabilization.\n● 18 minutes flight time per battery.`}
                                ></textarea>
                                <small style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'block' }}>Each feature on its own line. Start with ● for bullet styling.</small>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Accessorise in the Box</label>
                                <textarea 
                                    value={productForm.inTheBox} 
                                    onChange={(e) => setProductForm({ ...productForm, inTheBox: e.target.value })} 
                                    rows="5"
                                    placeholder={`● DJI Neo Aircraft\n● Intelligent Flight Battery\n● Propeller Guards (Pair)\n● Quick Start Guide`}
                                ></textarea>
                                <small style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'block' }}>Each item on its own line. Start with ● for bullet styling.</small>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Upload Product Photo</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        style={{ fontSize: '12px' }} 
                                    />
                                    {uploading && <Loader2 size={16} className="spin" style={{ color: 'var(--primary-orange)' }} />}
                                </div>
                                {editImages.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                                        {editImages.map((slot) => {
                                            if (slot.status === 'delete') return null;
                                            const preview = slot.file ? URL.createObjectURL(slot.file) : slot.url;
                                            return (
                                                <div key={slot.key} style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                    {preview ? (
                                                        <img src={preview} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px' }}>No image</div>
                                                    )}
                                                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', background: 'rgba(15,23,42,0.65)' }}>
                                                        <label title="Replace image" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', color: '#fff' }}>
                                                            <RefreshCw size={12} />
                                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleReplaceEditImage(slot.key, e)} />
                                                        </label>
                                                        <button type="button" title="Delete image" onClick={() => handleRemoveEditImage(slot.key)} style={{ flex: 1, border: 'none', background: 'none', color: '#fff', padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <label title="Add another image" style={{ width: '96px', height: '96px', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', gap: '2px' }}>
                                            <Plus size={20} />
                                            <span style={{ fontSize: '11px' }}>Add Image</span>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <button className="secondary-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                        <button className="primary-btn save-action" onClick={handleUpdateProductSubmit} disabled={saving || uploading}>
                                {saving ? <Loader2 size={18} className="spin" /> : 'Update Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Ratings & Comments Modal */}
            {reviewsProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '14px', maxWidth: 720, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Customer Reviews — {reviewsProduct.name}</h3>
                            <button onClick={closeReviews} title="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'inline-flex', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                            Rating: <strong>{Number(reviewsProduct.ratings || 0).toFixed(1)}★</strong> · {reviewsProduct.reviews ? reviewsProduct.reviews.length : 0} review(s)
                        </p>
                        {(!reviewsProduct.reviews || reviewsProduct.reviews.length === 0) ? (
                            <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 8 }}>
                                No customer reviews for this product yet.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {reviewsProduct.reviews.map(review => (
                                    <div key={review._id || String(review.createdAt)} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#fafbfc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{review.name || 'Customer'}</span>
                                            <span style={{ display: 'inline-flex', gap: 2, color: '#FF8F00' }}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={13} fill={s <= (review.rating || 0) ? 'currentColor' : 'none'} />
                                                ))}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                            </span>
                                            <span className={`status-badge ${review.isVisible === false ? 'pending' : 'completed'}`}>
                                                {review.isVisible === false ? 'Comment Hidden' : 'Comment Visible'}
                                            </span>
                                        </div>
                                        <p style={{ margin: '8px 0 12px', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                                            {review.comment || 'No comment.'}
                                        </p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                style={{ padding: '5px 10px', borderRadius: 6 }}
                                                disabled={reviewsBusy}
                                                onClick={() => handleToggleReviewComment(review._id, review.isVisible)}
                                                title={review.isVisible === false ? 'Show the comment again' : 'Hide this comment (the rating stays)'}
                                            >
                                                {review.isVisible === false ? 'Show Comment' : 'Disable Comment'}
                                            </button>
                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                style={{ padding: '5px 10px', borderRadius: 6, color: '#dc2626', borderColor: '#fecaca' }}
                                                disabled={reviewsBusy}
                                                onClick={() => handleDeleteReview(review._id)}
                                                title="Delete this review (rating is recalculated)"
                                            >
                                                <Trash2 size={14} /> Delete Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
