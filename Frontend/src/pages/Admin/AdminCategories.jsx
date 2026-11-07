import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Layers, Loader2, X, Search, SlidersHorizontal, CheckCircle, AlertCircle, ChevronUp, ChevronDown, Check, Image as ImageIcon, Upload, Tag } from 'lucide-react';
import api from '../../utils/api';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import './Admin.css';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const debounceRef = useRef(null);
    const catFileInputRef = useRef(null);
    const subFileInputRef = useRef(null);
    const targetSubIndexRef = useRef(null);
    const subSubFileInputRef = useRef(null);
    const targetSubSubIndexRef = useRef(null);
    const [activeSubSubIndex, setActiveSubSubIndex] = useState(0);

    const triggerSubSubFileInput = (subSubIndex) => {
        targetSubSubIndexRef.current = subSubIndex;
        if (subSubFileInputRef.current) {
            subSubFileInputRef.current.click();
        }
    };

    const handleSubSubFilePicked = (e) => {
        const subSubIndex = targetSubSubIndexRef.current;
        if (subSubIndex === null || subSubIndex === undefined) return;
        handleSubSubFileUpload(subSubIndex, e);
    };

    const triggerCategoryFileInput = () => {
        if (catFileInputRef.current) {
            catFileInputRef.current.click();
        }
    };

    const triggerSubFileInput = (subIndex) => {
        targetSubIndexRef.current = subIndex;
        if (subFileInputRef.current) {
            subFileInputRef.current.click();
        }
    };

    const handleSubFilePicked = (e) => {
        const subIndex = targetSubIndexRef.current;
        if (subIndex === null || subIndex === undefined) return;
        handleSubFileUpload(subIndex, e);
    };
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // when null, we are in Add mode. otherwise Edit mode
    
    const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: '', icon: 'Layers', isActive: true, subCategories: [] });
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

    // Inline edit / rename helper states
    const [editingSubIndex, setEditingSubIndex] = useState(null);
    const [editingSubText, setEditingSubText] = useState('');
    const [editingSubSubIndex, setEditingSubSubIndex] = useState(null);
    const [editingSubSubText, setEditingSubSubText] = useState('');
    const [renameMap, setRenameMap] = useState({ subCategories: [], subSubCategories: [] });

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

    const handleSubFileUpload = (subIndex, e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed (JPG, PNG, WEBP, SVG, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be 2 MB or less');
            return;
        }

        const updatedSubs = categoryForm.subCategories.map((sub, i) => {
            if (i === subIndex) {
                return { ...sub, pendingImage: file };
            }
            return sub;
        });
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
    };

    const handleRemoveSubImage = async (subIndex) => {
        const sub = categoryForm.subCategories[subIndex];
        if (!sub) return;

        if (sub.image) {
            if (!window.confirm(`Are you sure you want to delete the icon for "${sub.name}" from the server? This action cannot be undone.`)) {
                return;
            }
            setUploading(true);
            try {
                await api.delete(`/api/upload?url=${encodeURIComponent(sub.image)}`);
                const updatedSubs = categoryForm.subCategories.map((s, i) => {
                    if (i === subIndex) {
                        const copy = { ...s, image: '' };
                        delete copy.pendingImage;
                        return copy;
                    }
                    return s;
                });
                if (editingCategory?._id) {
                    await api.put(`/api/categories/${editingCategory._id}`, { ...categoryForm, subCategories: updatedSubs });
                    fetchCategories();
                }
                setCategoryForm(prev => ({ ...prev, subCategories: updatedSubs }));
                setThumbVersion(v => v + 1);
                setSaveSuccess(`Icon for "${sub.name}" removed and deleted from server successfully!`);
                alert(`Icon for "${sub.name}" removed and deleted from server successfully!`);
            } catch (err) {
                console.error('Failed to remove subcategory icon:', err);
                alert('Failed to remove subcategory icon from server: ' + (err.response?.data?.message || err.message));
            } finally {
                setUploading(false);
            }
        } else if (sub.pendingImage) {
            const updatedSubs = categoryForm.subCategories.map((s, i) => {
                if (i === subIndex) {
                    const copy = { ...s, image: '' };
                    delete copy.pendingImage;
                    return copy;
                }
                return s;
            });
            setCategoryForm(prev => ({ ...prev, subCategories: updatedSubs }));
            alert(`Selected icon for "${sub.name}" cancelled.`);
        }
    };

    const handleSubSubFileUpload = (subSubIndex, e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed (JPG, PNG, WEBP, SVG, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be 2 MB or less');
            return;
        }

        const updatedSubs = categoryForm.subCategories.map((sub, i) => {
            if (i === activeSubIndex) {
                const updatedSubSubs = (sub.subSubCategories || []).map((ssub, ssi) => {
                    if (ssi === subSubIndex) {
                        const obj = typeof ssub === 'string' ? { name: ssub, image: '', icon: '' } : { ...ssub };
                        return { ...obj, pendingImage: file };
                    }
                    return ssub;
                });
                return { ...sub, subSubCategories: updatedSubSubs };
            }
            return sub;
        });
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
    };

    const handleRemoveSubSubImage = async (subSubIndex) => {
        const currentSub = categoryForm.subCategories[activeSubIndex];
        if (!currentSub || !currentSub.subSubCategories) return;
        const ssub = currentSub.subSubCategories[subSubIndex];
        if (!ssub) return;

        const ssName = typeof ssub === 'string' ? ssub : (ssub?.name || '');
        const ssImage = typeof ssub === 'object' ? (ssub?.image || '') : '';
        const hasPending = Boolean(ssub?.pendingImage);

        if (ssImage) {
            if (!window.confirm(`Are you sure you want to delete the icon for "${ssName}" from the server? This action cannot be undone.`)) {
                return;
            }
            setUploading(true);
            try {
                await api.delete(`/api/upload?url=${encodeURIComponent(ssImage)}`);
                const updatedSubs = categoryForm.subCategories.map((sub, i) => {
                    if (i === activeSubIndex) {
                        const updatedSubSubs = (sub.subSubCategories || []).map((ss, ssi) => {
                            if (ssi === subSubIndex) {
                                const copy = typeof ss === 'string' ? { name: ss, image: '', icon: '' } : { ...ss, image: '' };
                                delete copy.pendingImage;
                                return copy;
                            }
                            return ss;
                        });
                        return { ...sub, subSubCategories: updatedSubSubs };
                    }
                    return sub;
                });

                if (editingCategory?._id) {
                    await api.put(`/api/categories/${editingCategory._id}`, { ...categoryForm, subCategories: updatedSubs });
                    fetchCategories();
                }

                setCategoryForm(prev => ({ ...prev, subCategories: updatedSubs }));
                setThumbVersion(v => v + 1);
                setSaveSuccess(`Icon for "${ssName}" removed and deleted from server successfully!`);
                alert(`Icon for "${ssName}" removed and deleted from server successfully!`);
            } catch (err) {
                console.error('Failed to remove sub-sub-category icon:', err);
                alert('Failed to remove sub-sub-category icon from server: ' + (err.response?.data?.message || err.message));
            } finally {
                setUploading(false);
            }
        } else if (hasPending) {
            const updatedSubs = categoryForm.subCategories.map((sub, i) => {
                if (i === activeSubIndex) {
                    const updatedSubSubs = (sub.subSubCategories || []).map((ss, ssi) => {
                        if (ssi === subSubIndex) {
                            const copy = typeof ss === 'string' ? { name: ss, image: '', icon: '' } : { ...ss };
                            delete copy.pendingImage;
                            return copy;
                        }
                        return ss;
                    });
                    return { ...sub, subSubCategories: updatedSubSubs };
                }
                return sub;
            });
            setCategoryForm(prev => ({ ...prev, subCategories: updatedSubs }));
            alert(`Selected icon for "${ssName}" cancelled.`);
        }
    };

    const handleRemoveCategoryImage = async () => {
        if (categoryForm.image) {
            if (!window.confirm('Are you sure you want to delete this category image from the server? This action cannot be undone.')) {
                return;
            }
            setUploading(true);
            try {
                await api.delete(`/api/upload?url=${encodeURIComponent(categoryForm.image)}`);
                if (editingCategory?._id) {
                    await api.put(`/api/categories/${editingCategory._id}`, { ...categoryForm, image: '' });
                    fetchCategories();
                }
                setCategoryForm(prev => {
                    const next = { ...prev, image: '' };
                    delete next.pendingImage;
                    return next;
                });
                setThumbVersion(v => v + 1);
                setSaveSuccess('Category image removed and deleted from server successfully!');
                alert('Category image removed and deleted from server successfully!');
            } catch (err) {
                console.error('Failed to remove category image:', err);
                alert('Failed to remove category image from server: ' + (err.response?.data?.message || err.message));
            } finally {
                setUploading(false);
            }
        } else if (categoryForm.pendingImage) {
            setCategoryForm(prev => {
                const next = { ...prev, image: '' };
                delete next.pendingImage;
                return next;
            });
            alert('Selected image cancelled.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed (JPG, PNG, WEBP, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be 2 MB or less');
            return;
        }

        setCategoryForm(prev => ({ ...prev, pendingImage: file }));
    };

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', slug: '', description: '', image: '', icon: 'Layers', isActive: true, subCategories: [] });
        setActiveSubIndex(0);
        setNewSubName('');
        setNewSubSubName('');
        setEditingSubIndex(null);
        setEditingSubText('');
        setEditingSubSubIndex(null);
        setEditingSubSubText('');
        setRenameMap({ subCategories: [], subSubCategories: [] });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cat) => {
        setEditingCategory(cat);
        setCategoryForm({ 
            name: cat.name || '', 
            slug: cat.slug || '', 
            description: cat.description || '', 
            image: cat.image || '',
            icon: cat.icon || 'Layers',
            isActive: cat.isActive !== false,
            subCategories: (cat.subCategories || []).map(s => ({
                ...s,
                image: s.image || '',
                icon: s.icon || '',
                subSubCategories: (s.subSubCategories || []).map(ss => ({
                name: typeof ss === 'string' ? ss : (ss?.name || ''),
                image: typeof ss === 'object' ? (ss?.image || '') : '',
                icon: typeof ss === 'object' ? (ss?.icon || '') : ''
            }))
            }))
        });
        setActiveSubIndex(0);
        setNewSubName('');
        setNewSubSubName('');
        setEditingSubIndex(null);
        setEditingSubText('');
        setEditingSubSubIndex(null);
        setEditingSubSubText('');
        setRenameMap({ subCategories: [], subSubCategories: [] });
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
        const updatedSubs = [...categoryForm.subCategories, { name: newSubName.trim(), image: '', icon: '', subSubCategories: [] }];
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

    const handleMoveSubCategory = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= categoryForm.subCategories.length) return;

        const updatedSubs = [...categoryForm.subCategories];
        const [movedItem] = updatedSubs.splice(index, 1);
        updatedSubs.splice(newIndex, 0, movedItem);

        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });

        // Keep active selection tracked with the item or swapped position
        if (activeSubIndex === index) {
            setActiveSubIndex(newIndex);
        } else if (activeSubIndex === newIndex) {
            setActiveSubIndex(index);
        }
    };

    const handleAddSubSubCategory = () => {
        if (!newSubSubName.trim()) return;
        const currentSub = categoryForm.subCategories[activeSubIndex];
        if (!currentSub) return;
        
        const exists = (currentSub.subSubCategories || []).some(
            subSub => {
                const name = typeof subSub === 'string' ? subSub : (subSub?.name || '');
                return name.toLowerCase() === newSubSubName.trim().toLowerCase();
            }
        );
        if (exists) {
            alert('Sub-sub-category already exists');
            return;
        }
        
        const updatedSubs = categoryForm.subCategories.map((sub, i) => {
            if (i === activeSubIndex) {
                return {
                    ...sub,
                    subSubCategories: [
                        ...(sub.subSubCategories || []),
                        { name: newSubSubName.trim(), image: '', icon: '' }
                    ]
                };
            }
            return sub;
        });
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
        setActiveSubSubIndex((currentSub.subSubCategories || []).length);
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

    const handleMoveSubSubCategory = (subSubIndex, direction) => {
        const currentSub = categoryForm.subCategories[activeSubIndex];
        if (!currentSub || !currentSub.subSubCategories) return;

        const list = currentSub.subSubCategories;
        const newIndex = subSubIndex + direction;
        if (newIndex < 0 || newIndex >= list.length) return;

        const updatedList = [...list];
        const [movedItem] = updatedList.splice(subSubIndex, 1);
        updatedList.splice(newIndex, 0, movedItem);

        const updatedSubs = categoryForm.subCategories.map((sub, i) => {
            if (i === activeSubIndex) {
                return {
                    ...sub,
                    subSubCategories: updatedList
                };
            }
            return sub;
        });
        setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
    };

    // Inline edit / rename handlers
    const handleStartEditSubCategory = (index, e) => {
        if (e) e.stopPropagation();
        setEditingSubIndex(index);
        setEditingSubText(categoryForm.subCategories[index].name);
    };

    const handleSaveEditSubCategory = (index, e) => {
        if (e) e.stopPropagation();
        const trimmed = editingSubText.trim();
        if (!trimmed) {
            setEditingSubIndex(null);
            return;
        }
        const currentSub = categoryForm.subCategories[index];
        if (trimmed !== currentSub.name) {
            const isDuplicate = categoryForm.subCategories.some((sub, i) => i !== index && sub.name.toLowerCase() === trimmed.toLowerCase());
            if (isDuplicate) {
                alert('A sub-category with this name already exists.');
                return;
            }

            setRenameMap(prev => {
                const list = [...prev.subCategories];
                const existing = list.find(r => r.newName === currentSub.name);
                if (existing) {
                    existing.newName = trimmed;
                } else {
                    list.push({ oldName: currentSub.name, newName: trimmed });
                }
                return { ...prev, subCategories: list };
            });

            const updatedSubs = categoryForm.subCategories.map((sub, i) => {
                if (i === index) {
                    return { ...sub, name: trimmed };
                }
                return sub;
            });
            setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
        }
        setEditingSubIndex(null);
    };

    const handleCancelEditSubCategory = (e) => {
        if (e) e.stopPropagation();
        setEditingSubIndex(null);
    };

    const handleStartEditSubSubCategory = (idx, e) => {
        if (e) e.stopPropagation();
        const currentSub = categoryForm.subCategories[activeSubIndex];
        if (!currentSub || !currentSub.subSubCategories) return;
        const item = currentSub.subSubCategories[idx];
        const name = typeof item === 'string' ? item : (item?.name || '');
        setEditingSubSubIndex(idx);
        setEditingSubSubText(name);
    };

    const handleSaveEditSubSubCategory = (idx, e) => {
        if (e) e.stopPropagation();
        const currentSub = categoryForm.subCategories[activeSubIndex];
        if (!currentSub || !currentSub.subSubCategories) return;
        const trimmed = editingSubSubText.trim();
        if (!trimmed) {
            setEditingSubSubIndex(null);
            return;
        }
        const item = currentSub.subSubCategories[idx];
        const oldSubSub = typeof item === 'string' ? item : (item?.name || '');
        if (trimmed !== oldSubSub) {
            const isDuplicate = currentSub.subSubCategories.some((ss, i) => {
                if (i === idx) return false;
                const name = typeof ss === 'string' ? ss : (ss?.name || '');
                return name.toLowerCase() === trimmed.toLowerCase();
            });
            if (isDuplicate) {
                alert('A sub-sub-category with this name already exists.');
                return;
            }

            setRenameMap(prev => {
                const list = [...prev.subSubCategories];
                const existing = list.find(r => r.subCategory === currentSub.name && r.newName === oldSubSub);
                if (existing) {
                    existing.newName = trimmed;
                } else {
                    list.push({ subCategory: currentSub.name, oldName: oldSubSub, newName: trimmed });
                }
                return { ...prev, subSubCategories: list };
            });

            const updatedSubs = categoryForm.subCategories.map((sub, i) => {
                if (i === activeSubIndex) {
                    const updatedList = (sub.subSubCategories || []).map((ss, ssi) => {
                        if (ssi === idx) {
                            if (typeof ss === 'string') return { name: trimmed, image: '', icon: '' };
                            return { ...ss, name: trimmed };
                        }
                        return ss;
                    });
                    return { ...sub, subSubCategories: updatedList };
                }
                return sub;
            });
            setCategoryForm({ ...categoryForm, subCategories: updatedSubs });
        }
        setEditingSubSubIndex(null);
    };

    const handleCancelEditSubSubCategory = (e) => {
        if (e) e.stopPropagation();
        setEditingSubSubIndex(null);
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name || !categoryForm.slug) {
            alert('Name and Slug are required');
            return;
        }
        setSaving(true);
        let uploadedCount = 0;
        try {
            // 1. Upload main category image if new file selected
            let imageUrl = categoryForm.image || '';
            if (categoryForm.pendingImage) {
                const formData = new FormData();
                formData.append('image', categoryForm.pendingImage);
                formData.append('context', 'category');
                formData.append('folderPath', categoryForm.name.trim());
                formData.append('index', '1');
                if (categoryForm.image) formData.append('oldImageUrl', categoryForm.image);
                const { data } = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = data.url;
                uploadedCount++;
            }

            // 2. Upload sub-category and sub-sub-category images
            const updatedSubCategories = await Promise.all(
                categoryForm.subCategories.map(async (sub) => {
                    let subImgUrl = sub.image || '';
                    if (sub.pendingImage) {
                        const formData = new FormData();
                        formData.append('image', sub.pendingImage);
                        formData.append('context', 'category');
                        formData.append('folderPath', `${categoryForm.name.trim()}/${sub.name.trim()}`);
                        formData.append('index', '1');
                        if (sub.image) formData.append('oldImageUrl', sub.image);
                        const { data } = await api.post('/api/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        subImgUrl = data.url;
                        uploadedCount++;
                    }

                    // Process sub-sub-categories
                    const updatedSubSubCategories = await Promise.all(
                        (sub.subSubCategories || []).map(async (ssub) => {
                            const ssName = typeof ssub === 'string' ? ssub : (ssub?.name || '');
                            let ssImgUrl = typeof ssub === 'object' ? (ssub?.image || '') : '';
                            if (ssub && ssub.pendingImage) {
                                const formData = new FormData();
                                formData.append('image', ssub.pendingImage);
                                formData.append('context', 'category');
                                formData.append('folderPath', `${categoryForm.name.trim()}/${sub.name.trim()}/${ssName.trim()}`);
                                formData.append('index', '1');
                                if (ssImgUrl) formData.append('oldImageUrl', ssImgUrl);
                                const { data } = await api.post('/api/upload', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                ssImgUrl = data.url;
                                uploadedCount++;
                            }
                            return {
                                name: ssName,
                                image: ssImgUrl,
                                icon: typeof ssub === 'object' ? (ssub?.icon || '') : ''
                            };
                        })
                    );

                    const cleanSub = { 
                        ...sub, 
                        image: subImgUrl,
                        subSubCategories: updatedSubSubCategories
                    };
                    delete cleanSub.pendingImage;
                    return cleanSub;
                })
            );

            const categoryPayload = { 
                ...categoryForm, 
                image: imageUrl, 
                subCategories: updatedSubCategories, 
                renameMap 
            };
            delete categoryPayload.pendingImage;

            if (editingCategory) {
                // Update mode
                await api.put(`/api/categories/${editingCategory._id}`, categoryPayload);
            } else {
                // Add mode
                await api.post('/api/categories', categoryPayload);
            }

            let msg = '';
            if (uploadedCount > 0) {
                msg = `${editingCategory ? 'Category updated' : 'Category created'} successfully and ${uploadedCount} image(s) uploaded successfully!`;
            } else {
                msg = editingCategory ? 'Category updated successfully!' : 'Category added successfully!';
            }

            setSaveSuccess(msg);
            setSaveError('');
            setThumbVersion(v => v + 1); // bust cached category thumbnail URLs
            setIsModalOpen(false);
            setCategoryForm({ name: '', slug: '', description: '', image: '', icon: 'Layers', isActive: true, subCategories: [] });
            setEditingCategory(null);
            setRenameMap({ subCategories: [], subSubCategories: [] });
            setEditingSubIndex(null);
            setEditingSubSubIndex(null);
            fetchCategories();

            alert(msg);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to save category');
            alert('Failed to save category: ' + (err.response?.data?.message || err.message));
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
                                            <div className="table-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <button 
                                                    className="secondary-btn" 
                                                    style={{ padding: '6px 10px', borderRadius: '6px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '12px' }} 
                                                    onClick={() => handleOpenEditModal(cat)}
                                                    title="Upload or Change Image / Icon"
                                                >
                                                    <Upload size={13} />
                                                    <span>Upload Image</span>
                                                </button>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px' }} onClick={() => handleOpenEditModal(cat)} title="Edit Category Details">
                                                    <Edit size={14} />
                                                </button>
                                                <button className="secondary-btn" style={{ padding: '6px 10px', borderRadius: '6px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDelete(cat._id)} title="Delete Category">
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
                                    <RichTextEditor 
                                        value={categoryForm.description} 
                                        onChange={(val) => setCategoryForm({ ...categoryForm, description: val })} 
                                        placeholder="Detailed category specifications and highlights..."
                                        height="140px"
                                        compact={true}
                                    />
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
                                <div className="input-group" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                                        Category Icon / Image Thumbnail
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                                        <div style={{ width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', background: 'white', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                                            {categoryForm.pendingImage ? (
                                                <img
                                                    src={URL.createObjectURL(categoryForm.pendingImage)}
                                                    alt="Category preview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                                />
                                            ) : categoryForm.image ? (
                                                <img
                                                    src={withCacheBust(categoryForm.image)}
                                                    alt="Category live image"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                                />
                                            ) : (
                                                <Layers size={30} style={{ color: '#94a3b8' }} />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    onClick={triggerCategoryFileInput}
                                                    style={{
                                                        background: '#0284c7',
                                                        color: 'white',
                                                        padding: '8px 14px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontWeight: '700',
                                                        fontSize: '12.5px',
                                                        boxShadow: '0 1px 3px rgba(2,132,199,0.3)'
                                                    }}
                                                >
                                                    <Upload size={14} />
                                                    <span>{categoryForm.pendingImage || categoryForm.image ? 'Change Category Image' : 'Upload Category Image'}</span>
                                                </button>
                                                {(categoryForm.pendingImage || categoryForm.image) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveCategoryImage}
                                                        style={{
                                                            background: '#fee2e2',
                                                            color: '#dc2626',
                                                            border: '1px solid #fca5a5',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            fontWeight: '700',
                                                            fontSize: '12.5px'
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                        <span>Remove Image</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                {categoryForm.pendingImage ? (
                                                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle size={13} /> Selected: {categoryForm.pendingImage.name} (Will upload on Save)
                                                    </span>
                                                ) : categoryForm.image ? (
                                                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>
                                                        Live on server. Click "Remove Image" to delete from server.
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                        Recommended: Square PNG/SVG icon or JPG up to 2 MB.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                                                            padding: '7px 8px', 
                                                            borderRadius: '6px', 
                                                            background: activeSubIndex === index ? 'white' : 'transparent', 
                                                            border: activeSubIndex === index ? '1px solid #e2e8f0' : '1px solid transparent',
                                                            boxShadow: activeSubIndex === index ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                                                            cursor: 'pointer',
                                                            fontWeight: activeSubIndex === index ? '700' : '500',
                                                            color: activeSubIndex === index ? 'var(--primary-orange)' : '#334155',
                                                            fontSize: '13px',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                    {editingSubIndex === index ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexGrow: 1, minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={editingSubText}
                                                                onChange={(e) => setEditingSubText(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleSaveEditSubCategory(index, e);
                                                                    } else if (e.key === 'Escape') {
                                                                        e.preventDefault();
                                                                        handleCancelEditSubCategory(e);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '4px 6px',
                                                                    fontSize: '12.5px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--primary-orange)',
                                                                    outline: 'none',
                                                                    flexGrow: 1,
                                                                    minWidth: 0,
                                                                    background: 'white'
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleSaveEditSubCategory(index, e)}
                                                                title="Confirm rename"
                                                                style={{
                                                                    background: '#22c55e',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    width: '22px',
                                                                    height: '22px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                <Check size={13} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEditSubCategory}
                                                                title="Cancel"
                                                                style={{
                                                                    background: '#e2e8f0',
                                                                    color: '#64748b',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    width: '22px',
                                                                    height: '22px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: 0 }}>
                                                                <div style={{ width: '26px', height: '26px', borderRadius: '6px', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    {sub.pendingImage ? (
                                                                        <img src={URL.createObjectURL(sub.pendingImage)} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                    ) : sub.image ? (
                                                                        <img src={withCacheBust(sub.image)} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                    ) : (
                                                                        <ImageIcon size={14} style={{ color: '#94a3b8' }} />
                                                                    )}
                                                                </div>
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1, minWidth: 0 }} title={sub.name}>{sub.name}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); triggerSubFileInput(index); }}
                                                                    title={`Upload or change icon for "${sub.name}"`}
                                                                    style={{
                                                                        background: sub.pendingImage ? '#dcfce7' : sub.image ? '#e0f2fe' : '#f1f5f9',
                                                                        color: sub.pendingImage ? '#15803d' : sub.image ? '#0369a1' : '#475569',
                                                                        border: sub.pendingImage ? '1px solid #86efac' : sub.image ? '1px solid #7dd3fc' : '1px solid #cbd5e1',
                                                                        padding: '3px 7px',
                                                                        borderRadius: '5px',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '3px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '700'
                                                                    }}
                                                                >
                                                                    <Upload size={11} />
                                                                    <span>{sub.pendingImage ? 'New Icon' : sub.image ? 'Change' : 'Icon'}</span>
                                                                </button>
                                                                {Boolean(sub.pendingImage || sub.image) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveSubImage(index); }}
                                                                        title={`Delete icon for "${sub.name}"`}
                                                                        style={{
                                                                            background: '#fee2e2',
                                                                            color: '#dc2626',
                                                                            border: '1px solid #fca5a5',
                                                                            padding: '3px 6px',
                                                                            borderRadius: '5px',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center'
                                                                        }}
                                                                    >
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleStartEditSubCategory(index, e)}
                                                                    title="Rename"
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        color: '#64748b',
                                                                        padding: '3px',
                                                                        borderRadius: '4px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'color 0.15s, background 0.15s'
                                                                    }}
                                                                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-orange)'; e.currentTarget.style.background = '#fff7ed'; }}
                                                                    onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
                                                                >
                                                                    <Edit size={13} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={index === 0}
                                                                    onClick={() => handleMoveSubCategory(index, -1)}
                                                                    title="Move Up"
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                                        color: index === 0 ? '#cbd5e1' : '#64748b',
                                                                        padding: '3px',
                                                                        borderRadius: '4px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'color 0.15s, background 0.15s'
                                                                    }}
                                                                    onMouseOver={(e) => { if (index !== 0) { e.currentTarget.style.color = 'var(--primary-orange)'; e.currentTarget.style.background = '#fff7ed'; } }}
                                                                    onMouseOut={(e) => { e.currentTarget.style.color = index === 0 ? '#cbd5e1' : '#64748b'; e.currentTarget.style.background = 'none'; }}
                                                                >
                                                                    <ChevronUp size={15} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={index === categoryForm.subCategories.length - 1}
                                                                    onClick={() => handleMoveSubCategory(index, 1)}
                                                                    title="Move Down"
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: index === categoryForm.subCategories.length - 1 ? 'not-allowed' : 'pointer',
                                                                        color: index === categoryForm.subCategories.length - 1 ? '#cbd5e1' : '#64748b',
                                                                        padding: '3px',
                                                                        borderRadius: '4px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'color 0.15s, background 0.15s'
                                                                    }}
                                                                    onMouseOver={(e) => { if (index !== categoryForm.subCategories.length - 1) { e.currentTarget.style.color = 'var(--primary-orange)'; e.currentTarget.style.background = '#fff7ed'; } }}
                                                                    onMouseOut={(e) => { e.currentTarget.style.color = index === categoryForm.subCategories.length - 1 ? '#cbd5e1' : '#64748b'; e.currentTarget.style.background = 'none'; }}
                                                                >
                                                                    <ChevronDown size={15} />
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => { if (window.confirm(`Are you absolutely sure you want to delete the sub-category "${sub.name}"?`)) handleRemoveSubCategory(index); }} 
                                                                    title="Delete"
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        color: '#94a3b8',
                                                                        padding: '3px',
                                                                        borderRadius: '4px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'color 0.15s, background 0.15s'
                                                                    }}
                                                                    onMouseOver={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                                                                    onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Active Sub-Category Icon & Image Manager */}
                                {categoryForm.subCategories[activeSubIndex] && (
                                    <div style={{ padding: '14px 16px', background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', background: 'white', border: '2px solid #7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                                {categoryForm.subCategories[activeSubIndex].pendingImage ? (
                                                    <img src={URL.createObjectURL(categoryForm.subCategories[activeSubIndex].pendingImage)} alt={categoryForm.subCategories[activeSubIndex].name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
                                                ) : categoryForm.subCategories[activeSubIndex].image ? (
                                                    <img src={withCacheBust(categoryForm.subCategories[activeSubIndex].image)} alt={categoryForm.subCategories[activeSubIndex].name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
                                                ) : (
                                                    <ImageIcon size={24} style={{ color: '#0284c7' }} />
                                                )}
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0c4a6e', display: 'block' }}>
                                                    &ldquo;{categoryForm.subCategories[activeSubIndex].name}&rdquo; Subcategory Icon
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#0369a1' }}>
                                                    {categoryForm.subCategories[activeSubIndex].pendingImage
                                                        ? 'New icon selected (Will be uploaded to server on Save)'
                                                        : categoryForm.subCategories[activeSubIndex].image
                                                            ? 'Live on storefront. Click "Remove Icon" to delete from server.'
                                                            : 'No custom icon assigned (displaying default emoji).'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => triggerSubFileInput(activeSubIndex)}
                                                style={{
                                                    background: '#0284c7',
                                                    color: 'white',
                                                    padding: '8px 14px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: '700',
                                                    fontSize: '12px',
                                                    boxShadow: '0 1px 3px rgba(2,132,199,0.3)'
                                                }}
                                            >
                                                <Upload size={14} />
                                                <span>{categoryForm.subCategories[activeSubIndex].pendingImage || categoryForm.subCategories[activeSubIndex].image ? 'Change Icon' : 'Upload Subcategory Icon'}</span>
                                            </button>
                                            {(categoryForm.subCategories[activeSubIndex].pendingImage || categoryForm.subCategories[activeSubIndex].image) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSubImage(activeSubIndex)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: '#fee2e2',
                                                        border: '1px solid #fca5a5',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        color: '#dc2626',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Trash2 size={13} />
                                                    <span>Remove Icon</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                                                    categoryForm.subCategories[activeSubIndex].subSubCategories.map((subSub, idx) => {
                                                        const ssName = typeof subSub === 'string' ? subSub : (subSub?.name || '');
                                                        const ssImage = typeof subSub === 'object' ? (subSub?.image || '') : '';
                                                        const ssPending = subSub?.pendingImage;
                                                        const isSelected = activeSubSubIndex === idx;

                                                        return (
                                                        <div 
                                                            key={idx} 
                                                            onClick={() => setActiveSubSubIndex(idx)}
                                                            style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between', 
                                                                alignItems: 'center', 
                                                                padding: '7px 8px', 
                                                                borderRadius: '6px', 
                                                                background: isSelected ? '#fdf4ff' : 'white', 
                                                                border: isSelected ? '1.5px solid #d946ef' : '1px solid #e2e8f0',
                                                                fontSize: '13px',
                                                                color: isSelected ? '#a21caf' : '#334155',
                                                                gap: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {editingSubSubIndex === idx ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexGrow: 1, minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        type="text"
                                                                        autoFocus
                                                                        value={editingSubSubText}
                                                                        onChange={(e) => setEditingSubSubText(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                handleSaveEditSubSubCategory(idx, e);
                                                                            } else if (e.key === 'Escape') {
                                                                                e.preventDefault();
                                                                                handleCancelEditSubSubCategory(e);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            padding: '4px 6px',
                                                                            fontSize: '12.5px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid var(--primary-orange)',
                                                                            outline: 'none',
                                                                            flexGrow: 1,
                                                                            minWidth: 0,
                                                                            background: 'white'
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleSaveEditSubSubCategory(idx, e)}
                                                                        title="Confirm rename"
                                                                        style={{
                                                                            background: '#22c55e',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            width: '22px',
                                                                            height: '22px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <Check size={13} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCancelEditSubSubCategory}
                                                                        title="Cancel"
                                                                        style={{
                                                                            background: '#e2e8f0',
                                                                            color: '#64748b',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            width: '22px',
                                                                            height: '22px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: 0 }}>
                                                                        <div style={{ width: '24px', height: '24px', borderRadius: '5px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                                                                            {ssPending ? (
                                                                                <img src={URL.createObjectURL(ssPending)} alt={ssName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                            ) : ssImage ? (
                                                                                <img src={withCacheBust(ssImage)} alt={ssName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                                            ) : (
                                                                                <Tag size={12} style={{ color: '#94a3b8' }} />
                                                                            )}
                                                                        </div>
                                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1, minWidth: 0, fontWeight: isSelected ? '700' : '500' }} title={ssName}>{ssName}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); triggerSubSubFileInput(idx); }}
                                                                            title={`Upload or change icon for "${ssName}"`}
                                                                            style={{
                                                                                background: ssPending ? '#dcfce7' : ssImage ? '#fdf4ff' : '#f8fafc',
                                                                                color: ssPending ? '#15803d' : ssImage ? '#c026d3' : '#475569',
                                                                                border: ssPending ? '1px solid #86efac' : ssImage ? '1px solid #f0abfc' : '1px solid #cbd5e1',
                                                                                padding: '3px 7px',
                                                                                borderRadius: '5px',
                                                                                cursor: 'pointer',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '3px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '700'
                                                                            }}
                                                                        >
                                                                            <Upload size={11} />
                                                                            <span>{ssPending ? 'New Icon' : ssImage ? 'Change' : 'Icon'}</span>
                                                                        </button>
                                                                        {Boolean(ssPending || ssImage) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); handleRemoveSubSubImage(idx); }}
                                                                                title={`Delete icon for "${ssName}"`}
                                                                                style={{
                                                                                    background: '#fee2e2',
                                                                                    color: '#dc2626',
                                                                                    border: '1px solid #fca5a5',
                                                                                    padding: '3px 6px',
                                                                                    borderRadius: '5px',
                                                                                    cursor: 'pointer',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center'
                                                                                }}
                                                                            >
                                                                                <Trash2 size={11} />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleStartEditSubSubCategory(idx, e)}
                                                                            title="Rename"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                color: '#64748b',
                                                                                padding: '3px',
                                                                                borderRadius: '4px',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                transition: 'color 0.15s, background 0.15s'
                                                                            }}
                                                                            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-orange)'; e.currentTarget.style.background = '#fff7ed'; }}
                                                                            onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none'; }}
                                                                        >
                                                                            <Edit size={13} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={idx === 0}
                                                                            onClick={() => handleMoveSubSubCategory(idx, -1)}
                                                                            title="Move Up"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                                                color: idx === 0 ? '#cbd5e1' : '#64748b',
                                                                                padding: '3px',
                                                                                borderRadius: '4px',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                transition: 'color 0.15s, background 0.15s'
                                                                            }}
                                                                            onMouseOver={(e) => { if (idx !== 0) { e.currentTarget.style.color = 'var(--primary-orange)'; e.currentTarget.style.background = '#fff7ed'; } }}
                                                                            onMouseOut={(e) => { e.currentTarget.style.color = idx === 0 ? '#cbd5e1' : '#64748b'; e.currentTarget.style.background = 'none'; }}
                                                                        >
                                                                            <ChevronUp size={15} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={idx === categoryForm.subCategories[activeSubIndex].subSubCategories.length - 1}
                                                                            onClick={() => handleMoveSubSubCategory(idx, 1)}
                                                                            title="Move Down"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: idx === categoryForm.subCategories[activeSubIndex].subSubCategories.length - 1 ? 'not-allowed' : 'pointer',
                                                                                color: idx === categoryForm.subCategories[activeSubIndex].subSubCategories.length - 1 ? '#cbd5e1' : '#64748b',
                                                                                padding: '3px',
                                                                                borderRadius: '4px',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                transition: 'color 0.15s, background 0.15s'
                                                                            }}
                                                                            onMouseOver={(e) => { if (idx !== categoryForm.subCategories[activeSubIndex].subSubCategories.length - 1) { e.currentTarget.style.color = 'var(--primary-orange)'; e.currentTarget.style.background = '#fff7ed'; } }}
                                                                            onMouseOut={(e) => { e.currentTarget.style.color = idx === categoryForm.subCategories[activeSubIndex].subSubCategories.length - 1 ? '#cbd5e1' : '#64748b'; e.currentTarget.style.background = 'none'; }}
                                                                        >
                                                                            <ChevronDown size={15} />
                                                                        </button>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => { if (window.confirm(`Are you absolutely sure you want to delete the sub-sub-category "${ssName}"?`)) handleRemoveSubSubCategory(idx); }} 
                                                                            title="Delete"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                color: '#94a3b8',
                                                                                padding: '3px',
                                                                                borderRadius: '4px',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                transition: 'color 0.15s, background 0.15s'
                                                                            }}
                                                                            onMouseOver={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                                                                            onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Active Sub-Sub-Category Icon & Image Manager Card */}
                                            {categoryForm.subCategories[activeSubIndex]?.subSubCategories?.[activeSubSubIndex] && (() => {
                                                const activeSubSub = categoryForm.subCategories[activeSubIndex].subSubCategories[activeSubSubIndex];
                                                const asName = typeof activeSubSub === 'string' ? activeSubSub : (activeSubSub?.name || '');
                                                const asImage = typeof activeSubSub === 'object' ? (activeSubSub?.image || '') : '';
                                                const asPending = activeSubSub?.pendingImage;
                                                return (
                                                    <div style={{ padding: '12px 14px', background: '#fdf4ff', border: '1.5px solid #f0abfc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '46px', height: '46px', borderRadius: '10px', overflow: 'hidden', background: 'white', border: '2px solid #e879f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                                                {asPending ? (
                                                                    <img src={URL.createObjectURL(asPending)} alt={asName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
                                                                ) : asImage ? (
                                                                    <img src={withCacheBust(asImage)} alt={asName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
                                                                ) : (
                                                                    <Tag size={22} style={{ color: '#c026d3' }} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#701a75', display: 'block' }}>
                                                                    &ldquo;{asName}&rdquo; Type / Sub-Sub Icon
                                                                </span>
                                                                <span style={{ fontSize: '11px', color: '#a21caf' }}>
                                                                    {asPending
                                                                        ? 'New icon selected (Will upload to server on Save)'
                                                                        : asImage
                                                                            ? 'Live on storefront card cover. Click "Remove Icon" to delete.'
                                                                            : 'No custom icon assigned (displaying default tag icon).'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => triggerSubSubFileInput(activeSubSubIndex)}
                                                                style={{
                                                                    background: '#c026d3',
                                                                    color: 'white',
                                                                    padding: '7px 13px',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    fontWeight: '700',
                                                                    fontSize: '12px',
                                                                    boxShadow: '0 1px 3px rgba(192,38,211,0.3)'
                                                                }}
                                                            >
                                                                <Upload size={13} />
                                                                <span>{asPending || asImage ? 'Change Icon' : 'Upload Type Icon'}</span>
                                                            </button>
                                                            {(asPending || asImage) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSubSubImage(activeSubSubIndex)}
                                                                    style={{
                                                                        padding: '7px 11px',
                                                                        background: '#fee2e2',
                                                                        border: '1px solid #fca5a5',
                                                                        borderRadius: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '700',
                                                                        color: '#dc2626',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <Trash2 size={13} />
                                                                    <span>Remove Icon</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
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

                        {/* Hidden inputs for reliable programmatic trigger */}
                        <input 
                            ref={catFileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                            style={{ display: 'none' }} 
                        />
                        <input 
                            ref={subFileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleSubFilePicked} 
                            style={{ display: 'none' }} 
                        />
                        <input 
                            ref={subSubFileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleSubSubFilePicked} 
                            style={{ display: 'none' }} 
                        />

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
