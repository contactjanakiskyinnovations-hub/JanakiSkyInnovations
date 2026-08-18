import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Upload, Plus, Trash2, ChevronRight, Loader2, Columns3 } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';


const AddProduct = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortSummary, setShortSummary] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [stock, setStock] = useState('');
    
    // Dynamic Category Taxonomy loaded from DB
    const [categoryTaxonomy, setCategoryTaxonomy] = useState({});
    
    // Category Taxonomy State
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [subSubCategory, setSubSubCategory] = useState('');
    const [brand, setBrand] = useState('Janaki Sky Innovations');
    
    // Dynamic Fields for Specs & dynamic instructions
    const [howToUse, setHowToUse] = useState('');
    const [assemblyMaintenance, setAssemblyMaintenance] = useState('');
    const [keyFeatures, setKeyFeatures] = useState('');
    const [inTheBox, setInTheBox] = useState('');
    const [specFields, setSpecFields] = useState([{ key: '', value: '' }]);
    const [comparisonEnabled, setComparisonEnabled] = useState(false);
    const [comparisonProductOneName, setComparisonProductOneName] = useState('');
    const [comparisonProductTwoName, setComparisonProductTwoName] = useState('');
    const [comparisonRows, setComparisonRows] = useState([]);
    const [images, setImages] = useState([]);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

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

                const mainCats = Object.keys(taxonomy);
                if (mainCats.length > 0) {
                    const firstMain = mainCats[0];
                    setCategory(firstMain);
                    
                    const subCats = Object.keys(taxonomy[firstMain]);
                    if (subCats.length > 0) {
                        const firstSub = subCats[0];
                        setSubCategory(firstSub);
                        
                        const subSubCats = taxonomy[firstMain][firstSub] || [];
                        setSubSubCategory(subSubCats.length > 0 ? subSubCats[0] : '');
                    } else {
                        setSubCategory('');
                        setSubSubCategory('');
                    }
                }
            } catch (err) {
                console.error('Failed to load categories hierarchy:', err);
                setError('Failed to load category taxonomy from server.');
            }
        };

        loadCategories();
    }, []);

    const handleCategoryChange = (e) => {
        const selectedCat = e.target.value;
        setCategory(selectedCat);
        const subCats = Object.keys(categoryTaxonomy[selectedCat] || {});
        if (subCats.length > 0) {
            const firstSubCat = subCats[0];
            setSubCategory(firstSubCat);
            const subSubCats = categoryTaxonomy[selectedCat][firstSubCat] || [];
            setSubSubCategory(subSubCats.length > 0 ? subSubCats[0] : '');
        } else {
            setSubCategory('');
            setSubSubCategory('');
        }
    };

    const handleSubCategoryChange = (e) => {
        const selectedSubCat = e.target.value;
        setSubCategory(selectedSubCat);
        const subSubCats = categoryTaxonomy[category][selectedSubCat] || [];
        setSubSubCategory(subSubCats.length > 0 ? subSubCats[0] : '');
    };

    const handleAddSpec = () => setSpecFields([...specFields, { key: '', value: '' }]);
    const handleRemoveSpec = (index) => setSpecFields(specFields.filter((_, i) => i !== index));
    const handleSpecChange = (index, field, value) => {
        const newFields = [...specFields];
        newFields[index][field] = value;
        setSpecFields(newFields);
    };
    const handleAddComparisonRow = () => setComparisonRows([...comparisonRows, {
        feature: '', selectedProductValue: '', comparisonProductOneValue: '', comparisonProductTwoValue: ''
    }]);
    const handleComparisonRowChange = (index, field, value) => {
        const rows = [...comparisonRows];
        rows[index][field] = value;
        setComparisonRows(rows);
    };
    const handleRemoveComparisonRow = (index) => setComparisonRows(comparisonRows.filter((_, rowIndex) => rowIndex !== index));

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = ''; // allow re-selecting the same file

        if (!file.type || !file.type.startsWith('image/')) {
            setError('Only image files are allowed (JPG, PNG, WEBP, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Image size must be 2 MB or less');
            return;
        }

        // Queue locally — the preview shows immediately and the actual ImageKit
        // upload happens when the user clicks "Save Product".
        setImages(prev => [...prev, { id: Date.now(), file, url: URL.createObjectURL(file) }]);
        setError('');
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async () => {
        if (!name || !price || !category) {
            setError('Please fill in all required fields (Name, Price, Category)');
            return;
        }
        if (!sku.trim()) {
            setError('Product SKU is required before saving');
            return;
        }
        if (images.length === 0) {
            setError('Please attach at least one product image before saving the product');
            return;
        }

        setLoading(true);
        setError('');

        // Filter out empty specs
        const technicalSpecs = specFields
            .filter(spec => spec.key.trim() !== '' && spec.value.trim() !== '')
            .reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

        // Upload the queued images to ImageKit now (deferred upload on Save).
        const finalImageUrls = [];
        let uploadFailed = false;
        for (let idx = 0; idx < images.length; idx++) {
            const img = images[idx];
            const formData = new FormData();
            formData.append('image', img.file);
            formData.append('context', 'product');
            formData.append('folderPath', sku.trim());
            formData.append('index', String(idx + 1));
            try {
                const { data } = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalImageUrls.push(data.url);
            } catch (err) {
                setError(err.response?.data?.message || `Failed to upload image ${idx + 1}. Please try again.`);
                uploadFailed = true;
                break;
            }
        }
        if (uploadFailed) {
            setLoading(false);
            return;
        }

        const productData = {
            name,
            sku,
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : undefined,
            description,
            shortSummary,
            category,
            subCategory,
            subSubCategory,
            brand,
            stock: Number(stock),
            images: finalImageUrls,
            technicalSpecs,
            comparisonTable: {
                isEnabled: comparisonEnabled,
                comparisonProductOneName,
                comparisonProductTwoName,
                rows: comparisonRows.filter(row => row.feature.trim())
            },
            howToUse,
            assemblyMaintenance,
            keyFeatures,
            inTheBox
        };

        try {
            await api.post('/api/products', productData);
                        navigate('/admin/products', { state: { added: true, productName: name } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
            setLoading(false);
        }
    };

    return (
        <div className="add-product-page">
            <div className="page-header-actions">
                <div className="header-text">
                    <button onClick={() => navigate('/admin/products')} className="back-link">
                        Products
                    </button>
                    <ChevronRight size={16} />
                    <h3>Add New Product</h3>
                </div>
                <div className="header-btns">
                    <button className="secondary-btn" onClick={() => navigate('/admin/products')} disabled={loading}>
                        Cancel
                    </button>
                                            <button className="primary-btn save-action" onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                        Save Product
                    </button>
                </div>
            </div>

            {error && <div className="error-banner" style={{background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>{error}</div>}

            <div className="product-form-grid">
                {/* Main Form Area */}
                <div className="form-main">
                    <div className="admin-card form-section">
                        <h4>General Information</h4>
                        <div className="input-group">
                            <label>Product Name *</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Soldering Iron Kit" />
                        </div>
                        <div className="input-group">
                            <label>Description</label>
                            <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed product description..."></textarea>
                        </div>
                        <div className="input-group">
                            <label>Short Summary</label>
                            <textarea rows="3" value={shortSummary} onChange={(e) => setShortSummary(e.target.value)} placeholder="Brief product summary for the detail page..."></textarea>
                        </div>
                    </div>

                    <div className="admin-card form-section">
                        <h4>User Instructions & Procedures</h4>
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label>How to Use (Step-by-step or guidelines)</label>
                            <textarea 
                                rows="4" 
                                value={howToUse} 
                                onChange={(e) => setHowToUse(e.target.value)} 
                                placeholder="Ensure the device is powered correctly...&#10;Turn on the system..."
                            ></textarea>
                        </div>
                        <div className="input-group">
                            <label>Assembly & Maintenance Information</label>
                            <textarea 
                                rows="3" 
                                value={assemblyMaintenance} 
                                onChange={(e) => setAssemblyMaintenance(e.target.value)} 
                                placeholder="Most components come pre-assembled. Periodically check connections..."
                            ></textarea>
                        </div>
                        <div className="input-group">
                            <label>Key Features</label>
                            <textarea 
                                rows="5" 
                                value={keyFeatures} 
                                onChange={(e) => setKeyFeatures(e.target.value)} 
                                placeholder={`● Ultra-lightweight design (~135g) – easy to carry.\n● 4K video with stabilization.\n● 18 minutes flight time per battery.`}
                            ></textarea>
                            <small style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'block' }}>Each feature on its own line. Start with ● for bullet styling.</small>
                        </div>
                        <div className="input-group">
                            <label>Accessorise in the Box</label>
                            <textarea 
                                rows="5" 
                                value={inTheBox} 
                                onChange={(e) => setInTheBox(e.target.value)} 
                                placeholder={`● DJI Neo Aircraft\n● Intelligent Flight Battery\n● Propeller Guards (Pair)`}
                            ></textarea>
                            <small style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'block' }}>Each item on its own line. Start with ● for bullet styling.</small>
                        </div>
                    </div>

                    <div className="admin-comparison-card">
                        <div className="admin-comparison-header">
                            <div className="admin-comparison-title">
                                <Columns3 size={20} />
                                <div>
                                    <h4>Comparison Table</h4>
                                    <div className="admin-comparison-subtitle">Compare specs against competing drone models</div>
                                </div>
                            </div>
                            <label className="admin-comparison-toggle">
                                <input type="checkbox" checked={comparisonEnabled} onChange={(event) => setComparisonEnabled(event.target.checked)} />
                                {comparisonEnabled ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>
                        {comparisonEnabled && (
                            <div className="admin-comparison-body">
                                <div className="admin-comparison-names-grid">
                                    <div className="admin-comparison-name-field">
                                        <label>Product 1 Name</label>
                                        <input type="text" value={comparisonProductOneName} onChange={(event) => setComparisonProductOneName(event.target.value)} placeholder="e.g. DJI Mini 4 Pro" />
                                    </div>
                                    <div className="admin-comparison-name-field">
                                        <label>Product 2 Name</label>
                                        <input type="text" value={comparisonProductTwoName} onChange={(event) => setComparisonProductTwoName(event.target.value)} placeholder="e.g. Autel EVO Nano+" />
                                    </div>
                                </div>

                                <div className="admin-comparison-table-wrapper">
                                    <div className="admin-comparison-table-head">
                                        <div>Feature Name</div>
                                        <div>This Product</div>
                                        <div>{comparisonProductOneName || 'Product 1'}</div>
                                        <div>{comparisonProductTwoName || 'Product 2'}</div>
                                        <div>Action</div>
                                    </div>
                                    {comparisonRows.length === 0 ? (
                                        <div className="admin-comparison-empty-rows">
                                            No comparison features added yet. Click &quot;Add Feature Row&quot; below to add rows.
                                        </div>
                                    ) : (
                                        comparisonRows.map((row, index) => (
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


                    <div className="admin-card form-section">
                        <h4>Product Images</h4>
                        <div 
                            className="upload-zone" 
                            style={{cursor: 'pointer'}} 
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{display: 'none'}} 
                                onChange={handleImageUpload}
                                accept="image/*"
                            />
                            {uploading ? (
                                <Loader2 size={32} className="spin" style={{color: 'var(--primary-orange)'}} />
                            ) : (
                                <Upload size={32} />
                            )}
                            <p>{uploading ? 'Uploading images...' : <>Click to add an image - <strong>uploaded on Save</strong></>}</p>
                            <span>Any image format, max 2 MB</span>
                        </div>
                        
                        {images.length > 0 && (
                            <div className="images-preview" style={{display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap'}}>
                                {images.map((img, idx) => (
                                    <div key={img.id || idx} style={{position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                                        <img src={img.url} alt={`Preview ${idx}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                        <span style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(255,143,0,0.9)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>Pending</span>
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            style={{position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="admin-card form-section">
                        <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h4>Technical Specifications</h4>
                            <button type="button" onClick={handleAddSpec} className="icon-btn-sm primary" style={{background: 'var(--primary-orange)', color: 'white', border: 'none'}}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <p className="section-desc" style={{marginBottom: '15px', color: '#6b7280', fontSize: '14px'}}>Add technical details like Voltage, Weight, Dimensions, etc.</p>
                        
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
                                    <button type="button" onClick={() => handleRemoveSpec(index)} className="icon-btn-sm danger" style={{height: '100%'}}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Form Area */}
                <div className="form-sidebar">
                    <div className="admin-card form-section">
                        <h4>Pricing & Inventory</h4>
                        <div className="input-group">
                            <label>SKU</label>
                            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="JSI-001" />
                        </div>
                        <div className="input-group">
                            <label>Base Price (₹) *</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="input-group">
                            <label>Discount Price (Optional)</label>
                            <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="input-group">
                            <label>Stock Quantity</label>
                            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
                        </div>
                    </div>

                    <div className="admin-card form-section">
                        <h4>Organization</h4>
                        <div className="input-group">
                            <label>Brand</label>
                            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand Name" />
                        </div>
                        <div className="input-group">
                            <label>Main Category *</label>
                            <select 
                                value={category} 
                                onChange={handleCategoryChange} 
                                style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white'}}
                            >
                                {Object.keys(categoryTaxonomy).length === 0 ? (
                                    <option value="">Loading categories...</option>
                                ) : (
                                    Object.keys(categoryTaxonomy).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Sub-Category *</label>
                            <select 
                                value={subCategory} 
                                onChange={handleSubCategoryChange} 
                                style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white'}}
                                disabled={!category}
                            >
                                {!category ? (
                                    <option value="">Select main category first</option>
                                ) : Object.keys(categoryTaxonomy[category] || {}).length === 0 ? (
                                    <option value="">No sub-categories available</option>
                                ) : (
                                    Object.keys(categoryTaxonomy[category] || {}).map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Sub-Sub-Category *</label>
                            <select 
                                value={subSubCategory} 
                                onChange={(e) => setSubSubCategory(e.target.value)} 
                                style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white'}}
                                disabled={!subCategory}
                            >
                                {!subCategory ? (
                                    <option value="">Select sub-category first</option>
                                ) : (categoryTaxonomy[category]?.[subCategory] || []).length === 0 ? (
                                    <option value="">No sub-sub-categories available</option>
                                ) : (
                                    (categoryTaxonomy[category]?.[subCategory] || []).map(subSub => (
                                        <option key={subSub} value={subSub}>{subSub}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
