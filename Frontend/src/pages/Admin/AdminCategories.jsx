import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Layers, Loader2, X, Search, SlidersHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const debounceRef = useRef(null);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // when null, we are in Add mode. otherwise Edit mode
    
    const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: '', isActive: true, subCategories: [] });
        const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Save feedback banners (non-blocking, auto-dismissed)
    const [saveSuccess, setSaveSuccess] = useState('');
            const [saveError, setSaveError] = useState('');
    // ImageKit overwrites `image-1.<ext>` in place on re-upload (the upload route uses
    // useUniqueFileName: false), so the category thumbnail URL is identical before/after — only
    // the bytes change. Bumping thumbVersion on save appends a new `?v=<token>` segment to the
    // rendered <img> src so the browser/CDN refetches the fresh image instead of a stale cache.
    const [thumbVersion, setThumbVersion] = useState(0);
    const withCacheBust = (url) => (url ? url + (url.includes('?') ? '&' : '?') + 'v=' + thumbVersion : url);

    useEffect(() => {
        if (!saveSuccess) return;
        const t = setTimeout(() => setSaveSuccess(''), 4000);
        return () => clearTimeout(t);
    }, [saveSuccess]);

    // Hierarchy editor helper states
    const [newSubName, setNewSubName] = useState('');
    const [newSubSubName, setNewSubSubName] = useState('');
    const [activeSubIndex, setActiveSubIndex] = useState(0);

    const fetchCategories = useCallback(async (keyword = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            const { data } = await api.get(`/api/categories?${params.toString()}`);
            setCategories(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories('');
    }, [fetchCategories]);

    // Debounced search
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchCategories(val);
        }, 400);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        fetchCategories('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you absolutely sure you want to delete this category?')) {
            try {
                await api.delete(`/api/categories/${id}`);
                fetchCategories();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete category');
            }
        }
    };

    const handleFileUpload = async (e) => {
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
        // upload happens when the user clicks "Save Category".
        setCategoryForm(prev => ({ ...prev, pendingImage: file }));
    };

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', slug: '', description: '', image: '', isActive: true, subCategories: [] });
        setActiveSubIndex(0);
        setNewSubName('');
        setNewSubSubName('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cat) => {
        setEditingCategory(cat);
        setCategoryForm({ 
            name: cat.name || '', 
            slug: cat.slug || '', 
            description: cat.description || '', 
            image: cat.image || '',
            isActive: cat.isActive !== false,
            subCategories: cat.subCategories || []
        });
        setActiveSubIndex(0);
        setNewSubName('');
        setNewSubSubName('');
        setIsModalOpen(true);
    };

    const handleAddSubCategory = () => {
        if (!newSubName.trim()) return;
        const exists = categoryForm.subCategories.some(
            sub => sub.name.toLowerCase() === newSubName.trim().toLowerCase()
        );
        if (exists) {
            alert('Sub-category already exists');
            return;
        }
        const updatedSubs = [...categoryForm.subCategories, { name: newSubName.trim(), subSubCategories: [] }];
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
        setActiveSubIndex(updatedSubs.length - 1);
        setNewSubName('');
    };

    const handleRemoveSubCategory = (index) => {
        const updatedSubs = categoryForm.subCategories.filter((_, i) => i !== index);
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
        if (activeSubIndex >= updatedSubs.length) {
            setActiveSubIndex(Math.max(0, updatedSubs.length - 1));
        }
    };

    const handleAddSubSubCategory = () => {
        if (!newSubSubName.trim()) return;
        const currentSub = categoryForm.subCategories[activeSubIndex];
        if (!currentSub) return;
        
        const exists = currentSub.subSubCategories.some(
            subSub => subSub.toLowerCase() === newSubSubName.trim().toLowerCase()
        );
        if (exists) {
            alert('Sub-sub-category already exists');
            return;
        }
        
        const updatedSubs = categoryForm.subCategories.map((sub, i) => {
            if (i === activeSubIndex) {
                return {
                    ...sub,
                    subSubCategories: [...sub.subSubCategories, newSubSubName.trim()]
                };
            }
            return sub;
        });
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
        setNewSubSubName('');
    };

    const handleRemoveSubSubCategory = (subSubIndex) => {
        const updatedSubs = categoryForm.subCategories.map((sub, i) => {
            if (i === activeSubIndex) {
                return {
                    ...sub,
                    subSubCategories: sub.subSubCategories.filter((_, ssi) => ssi !== subSubIndex)
                };
            }
            return sub;
        });
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name || !categoryForm.slug) {
            alert('Name and Slug are required');
            return;
        }
        setSaving(true);
        try {
            // Deferred upload: upload the newly picked category image before saving.
            let imageUrl = categoryForm.image || '';
            if (categoryForm.pendingImage) {
                const activeSub = categoryForm.subCategories[activeSubIndex];
                const pathParts = [categoryForm.name.trim()];
                if (activeSub && activeSub.name) pathParts.push(activeSub.name);

                const formData = new FormData();
                formData.append('image', categoryForm.pendingImage);
                formData.append('context', 'category');
                formData.append('folderPath', pathParts.join('/'));
                formData.append('index', '1');
                const { data } = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = data.url;
            }
            const categoryPayload = { ...categoryForm, image: imageUrl };
            delete categoryPayload.pendingImage;

                        if (editingCategory) {
                // Update mode
                await api.put(`/api/categories/${editingCategory._id}`, categoryPayload);
            } else {
                // Add mode
                await api.post('/api/categories', categoryPayload);
            }
            setSaveSuccess(editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
            setSaveError('');
            setThumbVersion(v => v + 1); // bust cached category thumbnail URLs (ImageKit overwrites image-1 in place)
            setIsModalOpen(false);
            setCategoryForm({ name: '', slug: '', description: '', image: '', isActive: true, subCategories: [] });
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    // Local status filter on top of keyword-searched results
    const filteredCategories = statusFilter === 'All'
        ? categories
        : categories.filter(cat => {
            if (statusFilter === 'Active') return cat.isActive !== false;
            if (statusFilter === 'Inactive') return cat.isActive === false;
            return true;
        });

    return (
                <div className="admin-categories">
            {saveSuccess && (
                <div className="admin-banner admin-banner-success">
                    <CheckCircle size={18} />
                    {saveSuccess}
                </div>
            )}
            {saveError && (
                <div className="admin-banner admin-banner-error">
                    <AlertCircle size={18} />
                    {saveError}
                </div>
            )}
            <div className="page-actions">
                <div className="action-header">
                    <h3>Category Management</h3>
                    <p>Manage your main categories and their sub-structures in real-time.</p>
                </div>
                <button className="primary-btn" onClick={handleOpenAddModal}>
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1, maxWidth: '480px', background: '#f8fafc', border: `1px solid ${searchTerm ? 'var(--primary-orange)' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 14px', transition: 'border-color 0.2s', position: 'relative' }}>
                    <Search size={16} style={{ color: searchTerm ? 'var(--primary-orange)' : '#94a3b8', flexShrink: 0, transition: 'color 0.2s' }} />
                    <input
                        type="text"
                        placeholder="Search by name, slug, or description..."
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0f172a', paddingRight: searchTerm ? '28px' : '0' }}
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: '600', fontSize: '13px', background: 'white', cursor: 'pointer' }}
                    >
                        <option value="All">All Categories</option>
                        <option value="Active">Active Only</option>
                        <option value="Inactive">Inactive Only</option>
                    </select>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    {loading ? '...' : filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'}
                </div>
            </div>

            {searchTerm && !loading && (
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SlidersHorizontal size={14} style={{ color: 'var(--primary-orange)' }} />
                    Showing <strong style={{ color: '#0f172a' }}>{filteredCategories.length}</strong> result{filteredCategories.length !== 1 ? 's' : ''} for &ldquo;<span style={{ color: 'var(--primary-orange)' }}>{searchTerm}</span>&rdquo;
                </div>
            )}

            {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

            <div className="admin-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Slug</th>
                                <th>Hierarchy</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        <Loader2 size={24} className="spin" style={{ margin: '0 auto' }} />
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        {searchTerm ? `No categories found matching "${searchTerm}"` : 'No categories found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((cat) => {
                                    const subCount = (cat.subCategories || []).length;
                                    const subSubTotal = (cat.subCategories || []).reduce((acc, s) => acc + (s.subSubCategories || []).length, 0);
                                    return (
                                    <tr key={cat._id}>
                                        <td>
                                            <div className="product-info-cell">
                                                <div style={{width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280'}}>
                                                    {cat.image ? (
                                                        <img src={withCacheBust(cat.image)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <Layers size={18} />
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{cat.name}</span>
                                                    {cat.description && <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.description}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontWeight: '500' }}>/{cat.slug}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                        {subCount} Sub{subCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span style={{ background: '#fdf4ff', color: '#9333ea', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                        {subSubTotal} Sub-Sub{subSubTotal !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {subCount === 0 && <span style={{ fontSize: '11px', color: '#94a3b8' }}>No sub-categories yet</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${cat.isActive !== false ? 'completed' : 'pending'}`}>
                                                {cat.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions" style={{ display: 'flex', gap: '6px' }}>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px' }} onClick={() => handleOpenEditModal(cat)}>
                                                    <Edit size={14} />
                                                </button>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDelete(cat._id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Adding/Editing Category */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="admin-card" style={{ width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                                {editingCategory ? 'Edit Category Hierarchy' : 'Create New Category Shelf'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '25px' }}>
                            {/* Left Column: Basic Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="input-group">
                                    <label>Category Name</label>
                                    <input 
                                        type="text" 
                                        value={categoryForm.name} 
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                                        placeholder="e.g. Drones" 
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Slug (URL path)</label>
                                    <input 
                                        type="text" 
                                        value={categoryForm.slug} 
                                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} 
                                        placeholder="e.g. drones" 
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Description</label>
                                    <textarea 
                                        value={categoryForm.description} 
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} 
                                        rows="2"
                                        placeholder="Detailed category specifications..."
                                    ></textarea>
                                </div>
                                <div className="input-group">
                                    <label>Category Status</label>
                                    <select
                                        value={categoryForm.isActive}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.value === 'true' })}
                                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', outline: 'none', width: '100%', background: 'white' }}
                                    >
                                        <option value="true">Active (Display on Storefront)</option>
                                        <option value="false">Inactive (Hide)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Category Image Thumbnail</label>
                                    {categoryForm.pendingImage || categoryForm.image ? (
                                        <div style={{ marginTop: '8px', width: '110px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <img
                                                src={categoryForm.pendingImage ? URL.createObjectURL(categoryForm.pendingImage) : withCacheBust(categoryForm.image)}
                                                alt="Category thumbnail"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ) : (
                                        <p style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>No image attached yet.</p>
                                    )}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileUpload} 
                                            style={{ fontSize: '12px' }} 
                                        />
                                        {uploading && <Loader2 size={16} className="spin" style={{ color: 'var(--primary-orange)' }} />}
                                    </div>
                                    {(categoryForm.pendingImage || categoryForm.image) && (
                                        <div style={{ marginTop: '10px', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <img src={categoryForm.pendingImage ? URL.createObjectURL(categoryForm.pendingImage) : withCacheBust(categoryForm.image)} alt="Category thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Hierarchy Manager */}
                            <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Hierarchy Structure</h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flexGrow: 1 }}>
                                    {/* Sub-categories List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>Sub-Categories</label>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <input 
                                                type="text" 
                                                value={newSubName} 
                                                onChange={(e) => setNewSubName(e.target.value)} 
                                                placeholder="Add Sub-Category..." 
                                                style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e2e8f0', flexGrow: 1 }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddSubCategory();
                                                    }
                                                }}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleAddSubCategory} 
                                                style={{ background: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '6px', width: '32px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px', maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {categoryForm.subCategories.length === 0 ? (
                                                <span style={{ fontSize: '12px', color: '#94a3b8', padding: '10px', textAlign: 'center' }}>No sub-categories.</span>
                                            ) : (
                                                categoryForm.subCategories.map((sub, index) => (
                                                    <div 
                                                        key={index} 
                                                        onClick={() => setActiveSubIndex(index)}
                                                        style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center', 
                                                            padding: '8px 10px', 
                                                            borderRadius: '6px', 
                                                            background: activeSubIndex === index ? 'white' : 'transparent', 
                                                            border: activeSubIndex === index ? '1px solid #e2e8f0' : '1px solid transparent',
                                                            boxShadow: activeSubIndex === index ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                                                            cursor: 'pointer',
                                                            fontWeight: activeSubIndex === index ? '700' : '500',
                                                            color: activeSubIndex === index ? 'var(--primary-orange)' : '#334155',
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{sub.name}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); if (window.confirm(`Are you absolutely sure you want to delete the sub-category "${sub.name}"?`)) handleRemoveSubCategory(index); }} 
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                                            onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                                                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Sub-Sub-categories List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>
                                            {categoryForm.subCategories[activeSubIndex] ? `Sub-Subs of "${categoryForm.subCategories[activeSubIndex].name}"` : 'Sub-Sub-Categories'}
                                        </label>
                                        {categoryForm.subCategories[activeSubIndex] ? (
                                            <>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input 
                                                        type="text" 
                                                        value={newSubSubName} 
                                                        onChange={(e) => setNewSubSubName(e.target.value)} 
                                                        placeholder="Add Sub-Sub..." 
                                                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e2e8f0', flexGrow: 1 }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddSubSubCategory();
                                                            }
                                                        }}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={handleAddSubSubCategory} 
                                                        style={{ background: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '6px', width: '32px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                
                                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px', maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {(categoryForm.subCategories[activeSubIndex].subSubCategories || []).length === 0 ? (
                                                        <span style={{ fontSize: '12px', color: '#94a3b8', padding: '10px', textAlign: 'center' }}>No sub-sub categories.</span>
                                                    ) : (
                                                        categoryForm.subCategories[activeSubIndex].subSubCategories.map((subSub, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    justifyContent: 'space-between', 
                                                                    alignItems: 'center', 
                                                                    padding: '8px 10px', 
                                                                    borderRadius: '6px', 
                                                                    background: 'white', 
                                                                    border: '1px solid #e2e8f0',
                                                                    fontSize: '13px',
                                                                    color: '#334155'
                                                                }}
                                                            >
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{subSub}</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => { if (window.confirm(`Are you absolutely sure you want to delete the sub-sub-category "${subSub}"?`)) handleRemoveSubSubCategory(idx); }} 
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                                                    onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                                                                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#f8fafc', textAlign: 'center', color: '#94a3b8', fontSize: '12px', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Select a sub-category first.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                        <button className="primary-btn save-action" onClick={handleSaveCategory} disabled={saving || uploading}>
                                {saving ? <Loader2 size={18} className="spin" /> : editingCategory ? 'Update Category' : 'Save Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
