import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, Plus, Trash2, Link as LinkIcon, Save, Edit2, Loader2, X, Percent, Gift, CheckCircle, HelpCircle, Eye, Inbox, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import './Admin.css';

const AdminCMS = ({ defaultTab }) => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(defaultTab || searchParams.get('tab') || 'home-content');
    const [settings, setSettings] = useState({ 
        heroSliders: [], 
        promoBanners: [], 
        featuredCategories: [],
        categoryBanners: [],
        imageVersion: 0,
        coupons: [],
        services: [],
        serviceCategories: [],
        footer: {
            companyName: 'Janaki Sky Innovations',
            tagline: 'India\'s Biggest Robotics, DIY & Engineering Online Store.',
            address: '123 Innovation Street, Campus Chowk, Dhanusha, India - 46800',
            phone: '+91 7742228345',
            email: 'support@janakiskyinnovations.com',
            copyrightText: '© 2026 Janaki Sky Innovations - All Rights Reserved.',
            customerServiceLinks: [
                { label: 'About Us', href: '/about' },
                { label: 'Shipping Policy', href: '/shipping' },
                { label: 'Technical Support', href: '/support' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'FAQs', href: '/faq' }
            ],
            paymentMethods: ['VISA', 'MasterCard', 'UPI', 'Rupay'],
            newsletterEnabled: true,
            newsletterTitle: 'NEWSLETTER',
            newsletterDescription: 'Don\'t miss any updates or promotions by signing up to our newsletter.'
        },
        socialMediaIcons: [
            { platform: 'Facebook', iconName: 'Facebook', url: 'https://facebook.com/janakiskyinnovations', isActive: true },
            { platform: 'Twitter', iconName: 'Twitter', url: 'https://twitter.com/janakiskyinnovations', isActive: true },
            { platform: 'Instagram', iconName: 'Instagram', url: 'https://instagram.com/janakiskyinnovations', isActive: true },
            { platform: 'YouTube', iconName: 'Youtube', url: 'https://youtube.com/janakiskyinnovations', isActive: true }
        ],
        contactIcons: [
            { platform: 'Messenger', iconName: 'MessageCircle', url: 'https://m.me/janakiskyinnovations', isActive: true },
            { platform: 'WhatsApp', iconName: 'WhatsApp', url: 'https://wa.me/917742228345?text=Hi!%20I%20need%20some%20assistance%20with%20Janaki%20Sky%20Innovations.', isActive: true }
        ],
        offers: {
            heroTitle: 'Flash Sale & Coupons',
            heroSubtitle: 'Unlock high-performance drone tech with active coupon codes, bundled sets, and seasonal flight reductions.',
            bundleDeals: [
                {
                    title: 'Agri-Spray Complete Bundle',
                    items: ['1x Janaki Agriculture Drone (10L)', '2x Smart Flight Batteries', '1x Toolkit & Storage Box'],
                    price: 'Rs. 1,45,000',
                    originalPrice: 'Rs. 1,75,000',
                    discount: 'Save Rs. 30,000',
                    image: 'https://images.unsplash.com/photo-1532509170117-98ef7500b411?q=80&w=2070&auto=format&fit=crop'
                },
                {
                    title: 'FPV Pilot Starter Kit',
                    items: ['1x Janaki FPV Racer', '1x FPV Goggles Pro', '1x 2.4GHz Controller Link'],
                    price: 'Rs. 34,999',
                    originalPrice: 'Rs. 42,000',
                    discount: 'Save Rs. 7,001',
                    image: 'https://images.unsplash.com/photo-1597847494283-a27825b84365?q=80&w=1168&auto=format&fit=crop'
                }
            ]
        },
        aboutStore: {
            title: 'About Janaki Sky Innovations',
            subtitle: 'Pioneering Drone Tech & Advanced Engineering Solutions across South Asia',
            story: 'Founded with a passion for robotics, aviation, and aerospace engineering, Janaki Sky Innovations is your premier destination for UAV technology, high-precision drone components, DIY robotics supplies, and specialized commercial flight solutions. We serve hobbyists, agricultural innovators, researchers, and professional aerial photographers across India and Nepal.',
            mission: 'To empower creators, agricultural pioneers, and tech enthusiasts with authentic, high-performance drone hardware, verified engineering parts, and personalized technical support.',
            vision: 'To be the leading unmanned systems and robotics ecosystem in South Asia, bridging cutting-edge aerospace advancements with accessible, reliable hardware.',
            bannerImage: '',
            storeImage: '',
            features: [
                {
                    icon: 'ShieldCheck',
                    title: '100% Genuine Components',
                    description: 'All UAV flight controllers, motors, ESCs, and batteries are sourced directly from verified manufacturers.'
                },
                {
                    icon: 'Zap',
                    title: 'Fast & Secure Dispatch',
                    description: 'Precision-packed sensitive electronics delivered swiftly and safely right to your workshop or field.'
                },
                {
                    icon: 'Headphones',
                    title: 'Expert Technical Support',
                    description: 'Our team of aerospace and robotics engineers is available to help you build, tune, and fly.'
                },
                {
                    icon: 'Award',
                    title: 'Custom UAV Solutions',
                    description: 'Specialized agricultural spraying drones, surveillance systems, and industrial inspection rigs.'
                }
            ],
            stats: [
                { label: 'Active Pilots & Builders', value: '10,000+' },
                { label: 'Drone & Robotics Parts', value: '5,000+' },
                { label: 'Custom Drones Delivered', value: '500+' },
                { label: 'Years of Engineering', value: '5+' }
            ]
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [uploadingIndex, setUploadingIndex] = useState(null);

    // Logo state
    const [logoImage, setLogoImage] = useState('https://ik.imagekit.io/ftcr3yz3y1/Ecommerce-Drone/Logo/logoWithName.jpeg');
    const [logoPendingFile, setLogoPendingFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef(null);

    // About Store Image States
    const [aboutBannerPendingFile, setAboutBannerPendingFile] = useState(null);
    const [aboutBannerPreview, setAboutBannerPreview] = useState(null);
    const aboutBannerInputRef = useRef(null);

    const [aboutStorePendingFile, setAboutStorePendingFile] = useState(null);
    const [aboutStorePreview, setAboutStorePreview] = useState(null);
    const aboutStoreInputRef = useRef(null);

    // Raw text for the payment methods input so commas are preserved while typing.
    // Committed to settings.footer.paymentMethods (array) on blur / save.
    const [paymentMethodsText, setPaymentMethodsText] = useState('VISA, MasterCard, UPI, Rupay');

    // Sync the text whenever the loaded payment methods change (e.g. after fetching CMS data).
    // NOTE: typing only updates paymentMethodsText, so this never clobbers an in-progress edit.
    useEffect(() => {
        const arr = settings.footer?.paymentMethods;
        if (Array.isArray(arr)) {
            setPaymentMethodsText(arr.join(', '));
        }
    }, [settings.footer?.paymentMethods]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/cms');
            let fetchedContactIcons = data?.contactIcons || [];
            if (!Array.isArray(fetchedContactIcons) || fetchedContactIcons.length === 0) {
                fetchedContactIcons = [
                    { platform: 'Messenger', iconName: 'MessageCircle', url: 'https://m.me/janakiskyinnovations', isActive: true },
                    { platform: 'WhatsApp', iconName: 'WhatsApp', url: 'https://wa.me/917742228345?text=Hi!%20I%20need%20some%20assistance%20with%20Janaki%20Sky%20Innovations.', isActive: true }
                ];
            } else {
                const hasWhatsApp = fetchedContactIcons.some(c => c.platform?.toLowerCase().includes('whatsapp') || c.iconName === 'WhatsApp');
                if (!hasWhatsApp) {
                    fetchedContactIcons.push({ platform: 'WhatsApp', iconName: 'WhatsApp', url: 'https://wa.me/917742228345?text=Hi!%20I%20need%20some%20assistance%20with%20Janaki%20Sky%20Innovations.', isActive: true });
                }
            }

            setSettings({
                heroSliders: data?.heroSliders || [],
                promoBanners: data?.promoBanners || [],
                
                featuredCategories: data?.featuredCategories || [],
                categoryBanners: data?.categoryBanners || [],
                imageVersion: data?.imageVersion || 0,
                coupons: data?.coupons || [],
                services: data?.services || [],
                serviceCategories: data?.serviceCategories || [],
                footer: data?.footer || settings.footer,
                socialMediaIcons: data?.socialMediaIcons || settings.socialMediaIcons,
                contactIcons: fetchedContactIcons,
                offers: data?.offers || settings.offers,
                aboutStore: data?.aboutStore || settings.aboutStore
            });
            if (data?.logoImage) {
                setLogoImage(data.logoImage);
            }
        } catch (err) {
            setError('Failed to fetch CMS settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        if (loading) {
            setError('Settings are still loading - please wait a moment before saving.');
            setSaving(false);
            return;
        }
        try {
            // Ensure the latest payment methods text is committed before publishing,
            // even if the input was never blurred.
            // Upload any newly picked logo file (deferred) before publishing.
            let finalLogoImage = logoImage;
            if (logoPendingFile) {
                const formData = new FormData();
                formData.append('image', logoPendingFile);
                formData.append('context', 'logo');
                formData.append('name', 'logo-image');
                const { data } = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalLogoImage = data.url;
                setLogoImage(data.url);
                setLogoPendingFile(null);
                if (logoPreview) URL.revokeObjectURL(logoPreview);
                setLogoPreview(null);
            }

            // Upload any newly picked hero-slider images (deferred) before publishing.
            const heroSliders = (settings.heroSliders || []).map((slide) => ({ ...slide }));
            for (let i = 0; i < heroSliders.length; i++) {
                const pendingFile = heroSliders[i].pendingFile;
                if (pendingFile) {
                    const formData = new FormData();
                    formData.append('image', pendingFile);
                    formData.append('context', 'homebanner');
                    formData.append('index', String(i + 1));
                    formData.append('name', `homebanner-image${i + 1}`);
                    const { data } = await api.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    heroSliders[i] = { ...heroSliders[i], image: data.url };
                    delete heroSliders[i].pendingFile;
                }
            }

            // Upload any newly picked category-banner images (deferred) before publishing.
            const categoryBanners = (settings.categoryBanners || []).map((b) => ({ ...b }));
            for (let i = 0; i < categoryBanners.length; i++) {
                const pendingFile = categoryBanners[i].pendingFile;
                if (pendingFile) {
                    const formData = new FormData();
                    formData.append('image', pendingFile);
                    formData.append('context', 'cms');
                    formData.append('folderPath', 'category-banners');
                    formData.append('index', String(i + 1));
                    const { data } = await api.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    categoryBanners[i] = { ...categoryBanners[i], image: data.url };
                    delete categoryBanners[i].pendingFile;
                }
            }

            // Upload any newly picked promo banner images (deferred) before publishing.
            const promoBanners = (settings.promoBanners || []).map((b) => ({ ...b }));
            for (let i = 0; i < promoBanners.length; i++) {
                const pendingFile = promoBanners[i].pendingFile;
                if (pendingFile) {
                    const formData = new FormData();
                    formData.append('image', pendingFile);
                    formData.append('context', 'homebanner');
                    formData.append('index', String(i + 1));
                    formData.append('name', `homebanner-promo${i + 1}`);
                    const { data } = await api.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    promoBanners[i] = { ...promoBanners[i], image: data.url };
                    delete promoBanners[i].pendingFile;
                }
            }

            // Upload any newly picked service background images (deferred) before publishing.
            const serviceCategories = (settings.serviceCategories || []).map((cat) => ({
                ...cat,
                services: (cat.services || []).map((svc) => ({ ...svc }))
            }));
            for (let ci = 0; ci < serviceCategories.length; ci++) {
                const services = serviceCategories[ci].services;
                for (let si = 0; si < services.length; si++) {
                    const svc = services[si];
                    if (svc._pendingFile) {
                        const title = (svc.title || '').trim();
                        const formData = new FormData();
                        formData.append('image', svc._pendingFile);
                        formData.append('context', 'service');
                        formData.append('folderPath', title || 'service-default');
                        formData.append('name', title || 'service-default');
                        const { data } = await api.post('/api/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        services[si] = { ...svc, image: data.url };
                        if (svc._previewUrl) URL.revokeObjectURL(svc._previewUrl);
                    }
                    // Strip temp client-only fields before persisting.
                    delete services[si]._pendingFile;
                    delete services[si]._previewUrl;
                    delete services[si]._previewChanged;
                }
            }

            // Upload any newly picked About Store images before publishing.
            let finalAboutBanner = settings.aboutStore?.bannerImage || '';
            if (aboutBannerPendingFile) {
                const formData = new FormData();
                formData.append('image', aboutBannerPendingFile);
                formData.append('context', 'cms');
                formData.append('folderPath', 'about-store');
                formData.append('name', 'about-banner');
                const { data } = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalAboutBanner = data.url;
                setAboutBannerPendingFile(null);
                if (aboutBannerPreview) URL.revokeObjectURL(aboutBannerPreview);
                setAboutBannerPreview(null);
            }

            let finalAboutStoreImg = settings.aboutStore?.storeImage || '';
            if (aboutStorePendingFile) {
                const formData = new FormData();
                formData.append('image', aboutStorePendingFile);
                formData.append('context', 'cms');
                formData.append('folderPath', 'about-store');
                formData.append('name', 'about-store-image');
                const { data } = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalAboutStoreImg = data.url;
                setAboutStorePendingFile(null);
                if (aboutStorePreview) URL.revokeObjectURL(aboutStorePreview);
                setAboutStorePreview(null);
            }

            const finalSettings = {
                ...settings,
                logoImage: finalLogoImage,
                heroSliders,
                promoBanners,
                categoryBanners,
                serviceCategories,
                aboutStore: {
                    ...(settings.aboutStore || {}),
                    bannerImage: finalAboutBanner,
                    storeImage: finalAboutStoreImg
                },
                footer: {
                    ...settings.footer,
                    paymentMethods: paymentMethodsText.split(',').map(m => m.trim()).filter(Boolean)
                }
            };
            await api.put('/api/cms', finalSettings);
            alert('CMS Settings published successfully!');
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // About Store helper functions
    const handleAboutStoreFieldChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            aboutStore: {
                ...(prev.aboutStore || {}),
                [field]: value
            }
        }));
    };

    const handleAboutFeatureChange = (index, field, value) => {
        const features = [...(settings.aboutStore?.features || [])];
        features[index] = { ...features[index], [field]: value };
        handleAboutStoreFieldChange('features', features);
    };

    const handleAddAboutFeature = () => {
        const features = [...(settings.aboutStore?.features || [])];
        features.push({ icon: 'ShieldCheck', title: 'New Guarantee', description: 'Description of store guarantee or capability.' });
        handleAboutStoreFieldChange('features', features);
    };

    const handleRemoveAboutFeature = (index) => {
        const features = (settings.aboutStore?.features || []).filter((_, idx) => idx !== index);
        handleAboutStoreFieldChange('features', features);
    };

    const handleAboutStatChange = (index, field, value) => {
        const stats = [...(settings.aboutStore?.stats || [])];
        stats[index] = { ...stats[index], [field]: value };
        handleAboutStoreFieldChange('stats', stats);
    };

    const handleAddAboutStat = () => {
        const stats = [...(settings.aboutStore?.stats || [])];
        stats.push({ label: 'New Metric', value: '1,000+' });
        handleAboutStoreFieldChange('stats', stats);
    };

    const handleRemoveAboutStat = (index) => {
        const stats = (settings.aboutStore?.stats || []).filter((_, idx) => idx !== index);
        handleAboutStoreFieldChange('stats', stats);
    };

    const handleAboutBannerSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        if (!file.type?.startsWith('image/')) {
            alert('Only image files are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be 5 MB or less');
            return;
        }
        if (aboutBannerPreview) URL.revokeObjectURL(aboutBannerPreview);
        setAboutBannerPendingFile(file);
        setAboutBannerPreview(URL.createObjectURL(file));
    };

    const handleRemoveAboutBanner = () => {
        if (aboutBannerPreview) URL.revokeObjectURL(aboutBannerPreview);
        setAboutBannerPendingFile(null);
        setAboutBannerPreview(null);
        handleAboutStoreFieldChange('bannerImage', '');
    };

    const handleAboutStoreImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        if (!file.type?.startsWith('image/')) {
            alert('Only image files are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be 5 MB or less');
            return;
        }
        if (aboutStorePreview) URL.revokeObjectURL(aboutStorePreview);
        setAboutStorePendingFile(file);
        setAboutStorePreview(URL.createObjectURL(file));
    };

    const handleRemoveAboutStoreImage = () => {
        if (aboutStorePreview) URL.revokeObjectURL(aboutStorePreview);
        setAboutStorePendingFile(null);
        setAboutStorePreview(null);
        handleAboutStoreFieldChange('storeImage', '');
    };

    // Hero Slider functions
    const handleAddSlide = () => {
        setSettings({
            ...settings,
            heroSliders: [...(settings.heroSliders || []), { image: '', title: '', subtitle: '', link: '', isActive: true }]
        });
    };

    const handleRemoveSlide = (index) => {
        if (!window.confirm('Are you absolutely sure you want to delete this hero slider?')) return;
        const newSliders = [...settings.heroSliders];
        newSliders.splice(index, 1);
        setSettings({ ...settings, heroSliders: newSliders });
    };

    const handleRemoveSlideImage = (index) => {
        const newSliders = [...settings.heroSliders];
        newSliders[index] = { ...newSliders[index], image: '' };
        delete newSliders[index].pendingFile;
        setSettings({ ...settings, heroSliders: newSliders });
    };

    const handleSlideChange = (index, field, value) => {
        const newSliders = [...settings.heroSliders];
        newSliders[index][field] = value;
        setSettings({ ...settings, heroSliders: newSliders });
    };

    const handleImageUpload = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = ''; // allow re-selecting the same file

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed (JPG, PNG, WEBP, etc.)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be 5 MB or less');
            return;
        }

        // Deferred upload: keep the chosen file on the slide; it is previewed immediately
        // and uploaded to ImageKit when the user clicks "Publish Changes".
        handleSlideChange(index, 'pendingFile', file);
    };

    const handleRemovePromoBannerImage = (index) => {
        const newBanners = [...settings.promoBanners];
        newBanners[index] = { ...newBanners[index], image: '' };
        delete newBanners[index].pendingFile;
        setSettings({ ...settings, promoBanners: newBanners });
    };

    const handlePromoBannerImageUpload = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        if (!file.type || !file.type.startsWith('image/')) {
            alert('Only image files are allowed (JPG, PNG, WEBP, etc.)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be 5 MB or less');
            return;
        }
        const updated = (settings.promoBanners || []).map((b, idx) => idx === index ? { ...b, pendingFile: file } : b);
        setSettings({ ...settings, promoBanners: updated });
    };

    // Category Banner functions
    const handleAddCategoryBanner = () => {
        setSettings({
            ...settings,
            categoryBanners: [...(settings.categoryBanners || []), { image: '', title: '', category: '', link: '', isActive: true }]
        });
    };

    const handleRemoveCategoryBanner = (index) => {
        if (!window.confirm('Are you absolutely sure you want to delete this category banner?')) return;
        const newBanners = [...settings.categoryBanners];
        newBanners.splice(index, 1);
        setSettings({ ...settings, categoryBanners: newBanners });
    };

    const handleCategoryBannerChange = (index, field, value) => {
        const newBanners = [...settings.categoryBanners];
        newBanners[index][field] = value;
        setSettings({ ...settings, categoryBanners: newBanners });
    };

    const handleCategoryBannerImageUpload = (e, index) => {
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
        // Deferred upload: keep the chosen file on the banner; it is uploaded
        // to ImageKit when the user clicks "Publish Changes".
        handleCategoryBannerChange(index, 'pendingFile', file);
    };

    // Coupons functions
    const handleAddCoupon = () => {
        setSettings({
            ...settings,
            coupons: [...(settings.coupons || []), { code: '', discount: '', title: '', description: '', expiry: '' }]
        });
    };

    const handleRemoveCoupon = (index) => {
        if (!window.confirm('Are you absolutely sure you want to delete this coupon?')) return;
        const newCoupons = [...settings.coupons];
        newCoupons.splice(index, 1);
        setSettings({ ...settings, coupons: newCoupons });
    };

    const handleCouponChange = (index, field, value) => {
        const newCoupons = [...settings.coupons];
        newCoupons[index][field] = value;
        setSettings({ ...settings, coupons: newCoupons });
    };

    // Services functions
    const handleAddService = () => {
        setSettings({
            ...settings,
            services: [...(settings.services || []), { title: '', iconName: 'Shield', description: '', features: [] }]
        });
    };

    const handleRemoveService = (index) => {
        const newServices = [...settings.services];
        newServices.splice(index, 1);
        setSettings({ ...settings, services: newServices });
    };

    const handleServiceChange = (index, field, value) => {
        const newServices = [...settings.services];
        if (field === 'features') {
            // Split features by comma
            newServices[index][field] = value.split(',').map(item => item.trim());
        } else {
            newServices[index][field] = value;
        }
        setSettings({ ...settings, services: newServices });
    };

    // Service Category functions
    const handleAddServiceCategory = () => {
        const newCats = [...(settings.serviceCategories || []), { name: '', slug: '', description: '', iconName: 'Shield', services: [] }];
        setSettings({ ...settings, serviceCategories: newCats });
    };

    const handleRemoveServiceCategory = (catIndex) => {
        const newCats = [...settings.serviceCategories];
        newCats.splice(catIndex, 1);
        setSettings({ ...settings, serviceCategories: newCats });
    };

    const handleCatChange = (catIndex, field, value) => {
        const newCats = [...settings.serviceCategories];
        newCats[catIndex][field] = value;
        if (field === 'name') {
            // Auto-generate slug from name so nav links work without a manual slug field
            newCats[catIndex].slug = value.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        setSettings({ ...settings, serviceCategories: newCats });
    };

    const handleAddServiceInCat = (catIndex) => {
        const newCats = [...settings.serviceCategories];
        newCats[catIndex].services = [...(newCats[catIndex].services || []), { title: '', iconName: 'Shield', description: '', features: [] }];
        setSettings({ ...settings, serviceCategories: newCats });
    };

    const handleRemoveServiceInCat = (catIndex, svcIndex) => {
        if (!window.confirm('Are you absolutely sure you want to delete this service?')) return;
        const newCats = [...settings.serviceCategories];
        newCats[catIndex].services.splice(svcIndex, 1);
        setSettings({ ...settings, serviceCategories: newCats });
    };

    const handleServiceInCatChange = (catIndex, svcIndex, field, value) => {
        const newCats = [...settings.serviceCategories];
        if (field === 'features') {
            newCats[catIndex].services[svcIndex][field] = value.split(',').map(item => item.trim());
        } else {
            newCats[catIndex].services[svcIndex][field] = value;
        }
        setSettings({ ...settings, serviceCategories: newCats });
    };

    // ---- Service background image (deferred upload) ----
    // When the admin picks a file we ONLY keep it in state and show a live
    // browser preview. The actual ImageKit upload happens in handleSave()
    // when "Publish Changes" is clicked — mirroring the hero-slider/category
    // banner behavior, so nothing hits the server until publish.
    const selectServiceImage = (catIndex, svcIndex, file) => {
        const service = settings.serviceCategories[catIndex]?.services?.[svcIndex];
        if (!service) return;
        const title = (service.title || '').trim();
        if (!title) {
            alert('Please set the Service Title first — the background image is named after the service.');
            return;
        }
        const newCats = [...settings.serviceCategories];
        const target = { ...service };
        // Revoke an old object-URL (if any) to avoid leaking memory.
        if (target._previewUrl) URL.revokeObjectURL(target._previewUrl);
        target._pendingFile = file;
        target._previewUrl = URL.createObjectURL(file);
        target._previewChanged = true;
        newCats[catIndex].services[svcIndex] = target;
        setSettings({ ...settings, serviceCategories: newCats });
    };

    const removeServiceImage = async (catIndex, svcIndex) => {
        const service = settings.serviceCategories[catIndex]?.services?.[svcIndex];
        if (!service) return;

        // If a new file was picked but never published, just drop the pending file.
        if (service._pendingFile) {
            if (service._previewUrl) URL.revokeObjectURL(service._previewUrl);
            handleServiceInCatChange(catIndex, svcIndex, '_pendingFile', undefined);
            handleServiceInCatChange(catIndex, svcIndex, '_previewUrl', undefined);
            handleServiceInCatChange(catIndex, svcIndex, '_previewChanged', undefined);
            // If an old published image exists, keep it for now (it will be
            // cleared below only when the admin confirms via the button).
            return;
        }

        // Best-effort cleanup of the ImageKit file(s) stored in the service folder.
        try {
            const title = (service.title || '').trim() || 'service-default';
            await api.delete('/api/upload', { params: { context: 'service', folderPath: title } });
        } catch (err) {
            // Non-fatal — the URL is still cleared from the CMS below.
        }
        handleServiceInCatChange(catIndex, svcIndex, 'image', '');
    };

    // Service Requests (View sub-section)
    const [servicesSubview, setServicesSubview] = useState('manage');
    const [serviceRequests, setServiceRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchServiceRequests = useCallback(async () => {
        setRequestsLoading(true);
        setRequestsError('');
        try {
            const { data } = await api.get('/api/service-requests');
            setServiceRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setRequestsError(err.response?.data?.message || 'Failed to load service requests');
        } finally {
            setRequestsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'services' && servicesSubview === 'requests') {
            fetchServiceRequests();
        }
    }, [activeTab, servicesSubview, fetchServiceRequests]);

    if (loading) return <div style={{padding: '100px', textAlign: 'center'}}><Loader2 className="spin" size={40} color="var(--primary-orange)" /></div>;

    return (
        <div className="admin-cms">
            <div className="page-actions">
                <div className="action-header">
                    <h3>Content Management (CMS)</h3>
                    <p>Update homepage items, slides, dynamic coupon offers, and structural service offerings.</p>
                </div>
                <button className="primary-btn" onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                    Publish Changes
                </button>
            </div>
            
            {error && <div className="error-banner" style={{ color: 'white', background: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>{error}</div>}

            <div className="cms-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'home-content' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home-content')}
                >
                    🏠 Home Page Content
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'slider' ? 'active' : ''}`}
                    onClick={() => setActiveTab('slider')}
                >
                    Hero Slider
                </button>
                <button
                    className={`tab-btn ${activeTab === 'categoryBanners' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categoryBanners')}
                >
                    Category Banners
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coupons')}
                >
                    Active Coupons
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('offers')}
                >
                    Offers & Bundles
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => setActiveTab('services')}
                >
                    Our Services
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'about-store' ? 'active' : ''}`}
                    onClick={() => setActiveTab('about-store')}
                >
                    🏪 About Store
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('footer')}
                >
                    Footer
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
                    onClick={() => setActiveTab('social')}
                >
                    Social Icons
                </button>
            </div>

            <div className="cms-content">
                {/* ========== HOME PAGE CONTENT TAB ========== */}
                {activeTab === 'home-content' && (
                    <div className="home-content-manager">
                        {/* LOGO SECTION */}
                        <div className="cms-section-card" style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: '12px', padding: '24px', marginBottom: '32px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                            <h4 style={{ marginBottom: '6px', fontSize: '1.1rem', fontWeight: 700 }}>🖼️ Site Logo Image</h4>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '18px' }}>This logo is displayed on both the Admin Panel sidebar and the Storefront header. When you choose a new image, you will see an instant preview, and it will be uploaded when you click "Publish Changes".</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                {/* Preview */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '200px', height: '80px', borderRadius: '10px', border: '2px dashed #d1d5db', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                        {(logoPreview || logoImage) ? (
                                            <img
                                                src={logoPreview || logoImage}
                                                alt="Logo Preview"
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No Logo Uploaded</span>
                                        )}
                                    </div>
                                    {(logoPreview || logoImage) && (
                                        <button
                                            type="button"
                                            className="danger-btn btn-sm"
                                            style={{ width: '100%' }}
                                            onClick={() => {
                                                setLogoImage('');
                                                setLogoPendingFile(null);
                                                if (logoPreview) URL.revokeObjectURL(logoPreview);
                                                setLogoPreview(null);
                                            }}
                                        >
                                            <Trash2 size={13} /> Remove Logo
                                        </button>
                                    )}
                                    {logoPendingFile && (
                                        <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>🟡 Pending upload on Publish</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setLogoPendingFile(file);
                                            const previewUrl = URL.createObjectURL(file);
                                            setLogoPreview(previewUrl);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => logoInputRef.current && logoInputRef.current.click()}
                                    >
                                        <ImageIcon size={14} /> Choose New Logo Image
                                    </button>

                                    {logoPendingFile && (
                                        <button
                                            type="button"
                                            className="danger-btn btn-sm"
                                            onClick={() => {
                                                setLogoPendingFile(null);
                                                if (logoPreview) URL.revokeObjectURL(logoPreview);
                                                setLogoPreview(null);
                                            }}
                                        >
                                            <X size={14} /> Cancel Selection
                                        </button>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: '220px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Or enter image URL directly:</label>
                                    <input
                                        className="cms-input"
                                        type="url"
                                        value={logoImage}
                                        placeholder="https://ik.imagekit.io/..."
                                        onChange={(e) => {
                                            setLogoImage(e.target.value);
                                            setLogoPendingFile(null);
                                            if (logoPreview) URL.revokeObjectURL(logoPreview);
                                            setLogoPreview(null);
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* HERO SLIDER BANNERS SECTION */}
                        <div className="cms-section-card" style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: '12px', padding: '24px', marginBottom: '32px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ marginBottom: '4px', fontSize: '1.1rem', fontWeight: 700 }}>🎞️ Hero Slider Banners</h4>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Images are previewed instantly and saved to ImageKit folder <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>homebanner</code> on "Publish Changes".</p>
                                </div>
                                <button className="secondary-btn btn-sm" onClick={handleAddSlide}><Plus size={16} /> Add Slide</button>
                            </div>
                            <div className="cms-grid">
                                {(settings.heroSliders || []).length === 0 && (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', gridColumn: '1/-1' }}>
                                        <ImageIcon size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        <p>No hero sliders added yet. Click "Add Slide" to get started.</p>
                                    </div>
                                )}
                                {(settings.heroSliders || []).map((slide, i) => (
                                    <div key={i} className="cms-card shadow-sm">
                                        <div className="cms-image-preview">
                                            {slide.pendingFile ? (
                                                <img src={URL.createObjectURL(slide.pendingFile)} alt="Slide preview" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                            ) : slide.image ? (
                                                <img src={slide.image} alt="Slide" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                            ) : (
                                                <div className="img-placeholder"><ImageIcon size={32} /><span>No Image Selected</span></div>
                                            )}
                                            <input type="file" id={`hc-slide-upload-${i}`} style={{display:'none'}} onChange={(e) => handleImageUpload(e, i)} accept="image/*" />
                                            <button className="edit-img-btn" onClick={() => document.getElementById(`hc-slide-upload-${i}`).click()} title="Choose Image">
                                                <Edit2 size={14} />
                                            </button>
                                        </div>

                                        {/* REMOVE IMAGE BUTTON BELOW PREVIEW */}
                                        <div style={{ padding: '0 12px', marginTop: '6px' }}>
                                            {(slide.image || slide.pendingFile) && (
                                                <button
                                                    type="button"
                                                    className="danger-btn btn-sm"
                                                    style={{ width: '100%', fontSize: '0.78rem', padding: '4px 8px' }}
                                                    onClick={() => handleRemoveSlideImage(i)}
                                                >
                                                    <Trash2 size={12} /> Remove Image
                                                </button>
                                            )}
                                            {slide.pendingFile && (
                                                <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, display: 'block', marginTop: '3px', textAlign: 'center' }}>
                                                    🟡 New image preview (uploads on Publish)
                                                </span>
                                            )}
                                        </div>

                                        <div className="cms-details">
                                            <div className="input-group">
                                                <label>Title</label>
                                                <input className="cms-input" value={slide.title || ''} onChange={(e) => handleSlideChange(i,'title',e.target.value)} placeholder="Slide Title" />
                                            </div>
                                            <div className="input-group">
                                                <label>Subtitle</label>
                                                <input className="cms-input" value={slide.subtitle || ''} onChange={(e) => handleSlideChange(i,'subtitle',e.target.value)} placeholder="Slide subtitle" />
                                            </div>
                                            <div className="input-group">
                                                <label>Link URL</label>
                                                <input className="cms-input" value={slide.link || ''} onChange={(e) => handleSlideChange(i,'link',e.target.value)} placeholder="/category/drones or https://..." />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                                <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Active</label>
                                                <input type="checkbox" checked={!!slide.isActive} onChange={(e) => handleSlideChange(i,'isActive',e.target.checked)} />
                                            </div>
                                        </div>

                                        {/* FULL BANNER REMOVAL BUTTON */}
                                        <button className="danger-btn btn-sm" style={{ margin: '8px 12px 12px' }} onClick={() => handleRemoveSlide(i)}>
                                            <Trash2 size={14} /> Remove Slide (Delete Banner)
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PROMO BANNERS SECTION */}
                        <div className="cms-section-card" style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ marginBottom: '4px', fontSize: '1.1rem', fontWeight: 700 }}>📣 Promo Banners</h4>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Promotional banner images shown below the hero slider on the homepage (e.g. Smart Agriculture, High-Speed FPV).</p>
                                </div>
                                <button className="secondary-btn btn-sm" onClick={() => {
                                    setSettings({ ...settings, promoBanners: [...(settings.promoBanners || []), { image: '', title: '', description: '', link: '' }] });
                                }}><Plus size={16} /> Add Banner</button>
                            </div>
                            <div className="cms-grid">
                                {(settings.promoBanners || []).length === 0 && (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', gridColumn: '1/-1' }}>
                                        <ImageIcon size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        <p>No promo banners added yet.</p>
                                    </div>
                                )}
                                {(settings.promoBanners || []).map((banner, i) => (
                                    <div key={i} className="cms-card shadow-sm">
                                        <div className="cms-image-preview">
                                            {banner.pendingFile ? (
                                                <img src={URL.createObjectURL(banner.pendingFile)} alt="Banner preview" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                            ) : banner.image ? (
                                                <img src={banner.image} alt="Promo Banner" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                            ) : (
                                                <div className="img-placeholder"><ImageIcon size={32} /><span>No Image Selected</span></div>
                                            )}
                                            <input
                                                type="file"
                                                id={`promo-upload-${i}`}
                                                style={{display:'none'}}
                                                accept="image/*"
                                                onChange={(e) => handlePromoBannerImageUpload(e, i)}
                                            />
                                            <button className="edit-img-btn" onClick={() => document.getElementById(`promo-upload-${i}`).click()} title="Choose Image">
                                                <Edit2 size={14} />
                                            </button>
                                        </div>

                                        {/* REMOVE IMAGE BUTTON BELOW PREVIEW */}
                                        <div style={{ padding: '0 12px', marginTop: '6px' }}>
                                            {(banner.image || banner.pendingFile) && (
                                                <button
                                                    type="button"
                                                    className="danger-btn btn-sm"
                                                    style={{ width: '100%', fontSize: '0.78rem', padding: '4px 8px' }}
                                                    onClick={() => handleRemovePromoBannerImage(i)}
                                                >
                                                    <Trash2 size={12} /> Remove Image
                                                </button>
                                            )}
                                            {banner.pendingFile && (
                                                <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, display: 'block', marginTop: '3px', textAlign: 'center' }}>
                                                    🟡 New image preview (uploads on Publish)
                                                </span>
                                            )}
                                        </div>

                                        <div className="cms-details">
                                            <div className="input-group">
                                                <label>Title</label>
                                                <input className="cms-input" value={banner.title || ''} onChange={(e) => {
                                                    const updated = (settings.promoBanners || []).map((b,idx) => idx===i ? {...b, title: e.target.value} : b);
                                                    setSettings({ ...settings, promoBanners: updated });
                                                }} placeholder="e.g. Smart Agriculture" />
                                            </div>
                                            <div className="input-group">
                                                <label>Description</label>
                                                <input className="cms-input" value={banner.description || ''} onChange={(e) => {
                                                    const updated = (settings.promoBanners || []).map((b,idx) => idx===i ? {...b, description: e.target.value} : b);
                                                    setSettings({ ...settings, promoBanners: updated });
                                                }} placeholder="Short description..." />
                                            </div>
                                            <div className="input-group">
                                                <label>Link URL</label>
                                                <input className="cms-input" value={banner.link || ''} onChange={(e) => {
                                                    const updated = (settings.promoBanners || []).map((b,idx) => idx===i ? {...b, link: e.target.value} : b);
                                                    setSettings({ ...settings, promoBanners: updated });
                                                }} placeholder="/category/drones" />
                                            </div>
                                        </div>

                                        {/* FULL BANNER REMOVAL BUTTON */}
                                        <button className="danger-btn btn-sm" style={{ margin: '8px 12px 12px' }} onClick={() => {
                                            if (!window.confirm('Delete this promo banner completely?')) return;
                                            const updated = (settings.promoBanners || []).filter((_,idx) => idx !== i);
                                            setSettings({ ...settings, promoBanners: updated });
                                        }}>
                                            <Trash2 size={14} /> Remove Banner (Delete All)
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '20px', padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6', fontSize: '0.85rem', color: '#1d4ed8' }}>
                                💡 <strong>Tip:</strong> You can choose/replace images to see immediate previews or click <strong>"Remove Image"</strong> below any image. When ready, click the orange <strong>"Publish Changes"</strong> button at the top to upload all pending files to ImageKit and save everything.
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'slider' && (
                    <div className="slider-manager">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4>Active Hero Sliders</h4>
                            <button className="secondary-btn btn-sm" onClick={handleAddSlide}><Plus size={16} /> Add Slide</button>
                        </div>
                        <div className="cms-grid">
                            {(settings.heroSliders || []).map((slide, i) => (
                                <div key={i} className="cms-card shadow-sm">
                                    <div className="cms-image-preview">
                                        {slide.pendingFile ? (
                                            <img src={URL.createObjectURL(slide.pendingFile)} alt="Slide preview (pending)" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                        ) : slide.image ? (
                                            <img src={slide.image} alt="Slide" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                        ) : (
                                            <div className="img-placeholder">
                                                <ImageIcon size={32} />
                                                <span>Slide Image {i + 1}</span>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            id={`slide-upload-${i}`} 
                                            style={{display: 'none'}} 
                                            onChange={(e) => handleImageUpload(e, i)} 
                                            accept="image/*" 
                                        />
                                        <button className="edit-img-btn" onClick={() => document.getElementById(`slide-upload-${i}`).click()}>
                                            {uploadingIndex === i ? <Loader2 size={14} className="spin" /> : <Edit2 size={14} />}
                                        </button>
                                    </div>
                                    <div className="cms-details">
                                        <div className="input-group">
                                            <label>Title</label>
                                            <input type="text" value={slide.title} onChange={(e) => handleSlideChange(i, 'title', e.target.value)} placeholder="e.g. India's Biggest Drone Store" />
                                        </div>
                                        <div className="input-group">
                                            <label>Subtitle</label>
                                            <input type="text" value={slide.subtitle} onChange={(e) => handleSlideChange(i, 'subtitle', e.target.value)} placeholder="Explore 5000+ items" />
                                        </div>
                                        <div className="input-group">
                                            <label>Target Link</label>
                                            <div className="link-input">
                                                <LinkIcon size={14} />
                                                <input type="text" value={slide.link} onChange={(e) => handleSlideChange(i, 'link', e.target.value)} placeholder="/products" />
                                            </div>
                                        </div>
                                        <button className="remove-cms-btn" onClick={() => handleRemoveSlide(i)}><Trash2 size={14} /> Remove Slide</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                                {activeTab === 'categoryBanners' && (
                    <div className="category-banners-manager">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h4>Category Banners</h4>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Promotional banners for individual storefront categories (e.g. Drones / Agriculture). These render on the storefront, so pick clear, text-free imagery.</p>
                            </div>
                            <button className="secondary-btn btn-sm" onClick={handleAddCategoryBanner}><Plus size={16} /> Add Category Banner</button>
                        </div>
                        {(settings.categoryBanners || []).length === 0 && (
                            <div className="cms-card shadow-sm" style={{ padding: '25px', color: '#6b7280', textAlign: 'center' }}>
                                No category banners yet. Click "Add Category Banner" to create one.
                            </div>
                        )}
                        <div className="cms-grid">
                            {(settings.categoryBanners || []).map((banner, i) => (
                                <div key={i} className="cms-card shadow-sm" style={{ padding: '25px' }}>
                                    <div className="cms-image-preview">
                                        {banner.pendingFile ? (
                                            <img src={URL.createObjectURL(banner.pendingFile)} alt="Banner preview (pending)" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : banner.image ? (
                                            <img src={banner.image + (settings.imageVersion ? (banner.image.includes('?') ? '&' : '?') + 'v=' + settings.imageVersion : '')} alt="Category banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="img-placeholder">
                                                <ImageIcon size={32} />
                                                <span>Banner Image</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id={`catbanner-upload-${i}`}
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleCategoryBannerImageUpload(e, i)}
                                        />
                                        <button className="edit-img-btn" onClick={() => document.getElementById(`catbanner-upload-${i}`).click()}>
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                    <div className="cms-details">
                                        <div className="input-group">
                                            <label>Banner Title</label>
                                            <input type="text" value={banner.title} onChange={(e) => handleCategoryBannerChange(i, 'title', e.target.value)} placeholder="e.g. Drone Tech Hub" />
                                        </div>
                                        <div className="input-group">
                                            <label>Target Category (slug)</label>
                                            <div className="link-input">
                                                <LinkIcon size={14} />
                                                <input type="text" value={banner.category} onChange={(e) => handleCategoryBannerChange(i, 'category', e.target.value)} placeholder="e.g. agriculture-drones" />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Target Link</label>
                                            <div className="link-input">
                                                <LinkIcon size={14} />
                                                <input type="text" value={banner.link} onChange={(e) => handleCategoryBannerChange(i, 'link', e.target.value)} placeholder="/category/agriculture-drones" />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                                <input type="checkbox" checked={banner.isActive !== false} onChange={(e) => handleCategoryBannerChange(i, 'isActive', e.target.checked)} />
                                                Active on storefront
                                            </label>
                                        </div>
                                        <button className="remove-cms-btn" onClick={() => handleRemoveCategoryBanner(i)}><Trash2 size={14} /> Remove Banner</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="coupons-manager">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h4>Active Checkout Coupons</h4>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>These codes will be displayed on the storefront Offers page in real-time.</p>
                            </div>
                            <button className="secondary-btn btn-sm" onClick={handleAddCoupon}><Plus size={16} /> Add Coupon</button>
                        </div>
                        <div className="cms-grid">
                            {(settings.coupons || []).map((coupon, i) => (
                                <div key={i} className="cms-card shadow-sm" style={{ border: '1px dashed #cbd5e1', padding: '25px' }}>
                                    <div className="cms-details" style={{ width: '100%' }}>
                                        <div className="input-group">
                                            <label>Coupon Code (MUST BE UNIQUE / UPPERCASE)</label>
                                            <input 
                                                type="text" 
                                                value={coupon.code} 
                                                onChange={(e) => handleCouponChange(i, 'code', e.target.value.toUpperCase())} 
                                                placeholder="e.g. SKYDRONE10" 
                                                style={{ fontWeight: '800', fontFamily: 'monospace', letterSpacing: '0.5px' }}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Discount Label</label>
                                            <input type="text" value={coupon.discount} onChange={(e) => handleCouponChange(i, 'discount', e.target.value)} placeholder="e.g. 10% OFF or Rs. 500 FLAT" />
                                        </div>
                                        <div className="input-group">
                                            <label>Campaign Title</label>
                                            <input type="text" value={coupon.title} onChange={(e) => handleCouponChange(i, 'title', e.target.value)} placeholder="e.g. Winter Flight Clearance" />
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <input type="text" value={coupon.description} onChange={(e) => handleCouponChange(i, 'description', e.target.value)} placeholder="Apply at checkout to save on drones." />
                                        </div>
                                        <div className="input-group">
                                            <label>Expiry Label</label>
                                            <input type="text" value={coupon.expiry} onChange={(e) => handleCouponChange(i, 'expiry', e.target.value)} placeholder="e.g. Expires 31 Dec 2026" />
                                        </div>
                                        <button className="remove-cms-btn" onClick={() => handleRemoveCoupon(i)}><Trash2 size={14} /> Remove Coupon</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="services-manager">
                        <div className="services-subview-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                            <button
                                className={`secondary-btn btn-sm ${servicesSubview === 'manage' ? 'subview-active' : ''}`}
                                onClick={() => setServicesSubview('manage')}
                            >
                                Manage Services
                            </button>
                            <button
                                className={`secondary-btn btn-sm ${servicesSubview === 'requests' ? 'subview-active' : ''}`}
                                onClick={() => setServicesSubview('requests')}
                            >
                                View Service Requests
                            </button>
                        </div>

                        {servicesSubview === 'manage' && (
                            <>
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h4>Service Categories & Offerings</h4>
                                    <p style={{ color: '#6b7280', fontSize: '13px' }}>Create categories (shown in the nav dropdown) and manage the services inside each one.</p>
                                </div>
                                <button className="secondary-btn btn-sm" onClick={handleAddServiceCategory}><Plus size={16} /> Add Category</button>
                            </div>

                        {(settings.serviceCategories || []).length === 0 && (
                            <div className="cms-card shadow-sm" style={{ padding: '25px', color: '#6b7280', textAlign: 'center' }}>
                                No categories yet. Click "Add Category" to create your first service category.
                            </div>
                        )}

                        {(settings.serviceCategories || []).map((cat, ci) => (
                            <div key={ci} className="cms-card shadow-sm" style={{ padding: '25px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '12px' }}>
                                    <button className="remove-cms-btn" onClick={() => {
                                        if (window.confirm('Delete this category and all its services?')) handleRemoveServiceCategory(ci);
                                    }}><Trash2 size={14} /> Delete Category</button>
                                </div>
                                <div className="input-group">
                                    <label>Category Name (shown in nav dropdown)</label>
                                    <input type="text" value={cat.name} onChange={(e) => handleCatChange(ci, 'name', e.target.value)} placeholder="e.g. Drones" />
                                </div>
                                <div className="input-group">
                                    <label>Category Description</label>
                                    <textarea value={cat.description} onChange={(e) => handleCatChange(ci, 'description', e.target.value)} placeholder="Short intro shown on the services page." rows={2} />
                                </div>
                                <div className="input-group">
                                    <label>Category Icon</label>
                                    <select value={cat.iconName} onChange={(e) => handleCatChange(ci, 'iconName', e.target.value)}>
                                        <option value="Shield">Shield (Security/Certification)</option>
                                        <option value="Hammer">Hammer (Fabrication/Engineering)</option>
                                        <option value="MapPin">MapPin (Mapping/Surveying)</option>
                                        <option value="Wind">Wind (Agriculture/Spraying)</option>
                                        <option value="Sparkles">Sparkles (Floral/Events)</option>
                                    </select>
                                </div>

                                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 12px' }}>
                                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>Services in this category</h5>
                                    <button className="secondary-btn btn-sm" onClick={() => handleAddServiceInCat(ci)}><Plus size={14} /> Add Service</button>
                                </div>

                                {(cat.services || []).map((service, si) => (
                                    <div key={si} style={{ border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '18px', marginBottom: '14px', background: '#fafafc' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="input-group">
                                                <label>Service Title</label>
                                                <input type="text" value={service.title} onChange={(e) => handleServiceInCatChange(ci, si, 'title', e.target.value)} placeholder="e.g. Agricultural Drone Spraying" />
                                            </div>
                                            <div className="input-group">
                                                <label>Icon Identifier</label>
                                                <select value={service.iconName} onChange={(e) => handleServiceInCatChange(ci, si, 'iconName', e.target.value)}>
                                                    <option value="Shield">Shield (Security/Certification)</option>
                                                    <option value="Hammer">Hammer (Fabrication/Engineering)</option>
                                                    <option value="MapPin">MapPin (Mapping/Surveying)</option>
                                                    <option value="Wind">Wind (Agriculture/Spraying)</option>
                                                    <option value="Sparkles">Sparkles (Floral/Events)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="input-group" style={{ marginTop: '2px' }}>
                                            <label>Background Image <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '12px' }}>(optional — named after the service)</span></label>
                                            <div className="cms-image-preview" style={{ height: '130px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                {(service._previewUrl || service.image) ? (
                                                    <img src={service._previewUrl || service.image} alt={`${service.title || 'Service'} background`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="img-placeholder">
                                                        <ImageIcon size={26} />
                                                        <span>No background image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                                <label className="secondary-btn btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                                                    <ImageIcon size={14} />
                                                    {service.image || service._pendingFile ? ' Replace Image' : ' Upload Image'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const file = e.target.files && e.target.files[0];
                                                            e.target.value = '';
                                                            if (file) selectServiceImage(ci, si, file);
                                                        }}
                                                    />
                                                </label>
                                                {service._pendingFile && (
                                                    <span style={{ fontSize: '12px', color: 'var(--primary-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--primary-orange)' }} />
                                                        Pending publish
                                                    </span>
                                                )}
                                                {(service.image || service._pendingFile) && (
                                                    <button className="remove-cms-btn" onClick={() => removeServiceImage(ci, si)} style={{ margin: 0 }}>
                                                        <Trash2 size={14} /> Remove Image
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <textarea
                                                value={service.description}
                                                onChange={(e) => handleServiceInCatChange(ci, si, 'description', e.target.value)}
                                                placeholder="Describe the service details..."
                                                rows={3}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Service Features (Comma-Separated)</label>
                                            <input
                                                type="text"
                                                value={(service.features || []).join(', ')}
                                                onChange={(e) => handleServiceInCatChange(ci, si, 'features', e.target.value)}
                                                placeholder="Feature 1, Feature 2, Feature 3"
                                            />
                                        </div>
                                        <button className="remove-cms-btn" onClick={() => handleRemoveServiceInCat(ci, si)}><Trash2 size={14} /> Remove Service</button>
                                    </div>
                                ))}

                                {(cat.services || []).length === 0 && (
                                    <p style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>No services added to this category yet.</p>
                                )}
                            </div>
                        ))}
                        </>
                        )}
                        {servicesSubview === 'requests' && (
                            <div className="service-requests-view">
                                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h4>Service Requests</h4>
                                        <p style={{ color: '#6b7280', fontSize: '13px' }}>All enquiries from the /services form. Green = registered, Red = guest.</p>
                                    </div>
                                    <button className="secondary-btn btn-sm" onClick={fetchServiceRequests}><RefreshCw size={14} /> Refresh</button>
                                </div>

                                {requestsLoading ? (
                                    <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={28} className="spin" style={{ color: 'var(--primary-orange)' }} /></div>
                                ) : requestsError ? (
                                    <div className="cms-card shadow-sm" style={{ padding: '25px', color: '#dc2626', textAlign: 'center' }}>{requestsError}</div>
                                ) : serviceRequests.length === 0 ? (
                                    <div className="cms-card shadow-sm" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        <Inbox size={40} style={{ margin: '0 auto 15px', opacity: 0.4, color: 'var(--primary-orange)' }} />
                                        <p>No service requests found yet.</p>
                                    </div>
                                ) : (
                                    <div className="cms-card shadow-sm" style={{ padding: '20px', overflowX: 'auto' }}>
                                        <table className="admin-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Request ID</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Name</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Category</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {serviceRequests.map((req) => (
                                                    <tr key={req._id}>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontWeight: '700' }}>#{req._id ? req._id.toString().slice(-8).toUpperCase() : 'N/A'}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>{req.name}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>{req.category}</td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                            <span style={{ padding: '5px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700', background: req.isRegistered ? '#f0fdf4' : '#fef2f2', color: req.isRegistered ? '#15803d' : '#dc2626' }}>
                                                                {req.isRegistered ? 'Registered' : 'Unregistered'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                                                            <button className="secondary-btn" style={{ padding: '5px 9px', borderRadius: '6px', fontSize: '12px' }} onClick={() => setSelectedRequest(req)} title="View request details"><Eye size={13} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {selectedRequest && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                                        <div className="admin-card" style={{ width: '90%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative', margin: 0 }}>
                                            <button style={{ position: 'absolute', top: '15px', right: '18px', background: 'none', border: 'none', fontSize: '24px', fontWeight: '800', cursor: 'pointer', color: '#64748b', lineHeight: '1' }} onClick={() => setSelectedRequest(null)}>×</button>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', paddingRight: '20px' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px', fontSize: '17px' }}>Service Request Details</h4>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>#{selectedRequest._id}</span>
                                                </div>
                                                <span style={{ padding: '5px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700', background: selectedRequest.isRegistered ? '#f0fdf4' : '#fef2f2', color: selectedRequest.isRegistered ? '#15803d' : '#dc2626' }}>
                                                    {selectedRequest.isRegistered ? 'Registered' : 'Unregistered'}
                                                </span>
                                            </div>
                                            {[
                                                ['Name', selectedRequest.name],
                                                ['Phone', selectedRequest.phone],
                                                ['Email', selectedRequest.email],
                                                ['Category', selectedRequest.category],
                                                ['Interested Service', selectedRequest.service],
                                                ['Submitted', new Date(selectedRequest.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
                                            ].map(([label, val]) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                                                    <span style={{ color: '#64748b', fontWeight: '600' }}>{label}</span>
                                                    <span style={{ fontWeight: '700', color: '#1e293b', textAlign: 'right', marginLeft: '16px' }}>{val || 'N/A'}</span>
                                                </div>
                                            ))}
                                            <div style={{ marginTop: '16px' }}>
                                                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Message / Specifications</p>
                                                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                                    {selectedRequest.message || 'N/A'}
                                                </div>
                                            </div>
                                            {selectedRequest.user && (
                                                <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#15803d', fontWeight: '600', marginTop: '16px' }}>
                                                    Linked to registered user: {selectedRequest.user?.name || selectedRequest.user?._id}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                                <button className="secondary-btn" onClick={() => setSelectedRequest(null)}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'offers' && (
                    <div className="offers-manager">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h4>Offers Page Configuration</h4>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Manage hero content and bundle deals displayed on the /offers page.</p>
                            </div>
                        </div>
                        <div className="cms-card shadow-sm" style={{ padding: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '800' }}>Hero Section</h4>
                            <div className="input-group">
                                <label>Hero Title</label>
                                <input type="text" value={settings.offers?.heroTitle || ''} onChange={(e) => setSettings({ ...settings, offers: { ...settings.offers, heroTitle: e.target.value } })} placeholder="Flash Sale & Coupons" />
                            </div>
                            <div className="input-group">
                                <label>Hero Subtitle</label>
                                <textarea value={settings.offers?.heroSubtitle || ''} onChange={(e) => setSettings({ ...settings, offers: { ...settings.offers, heroSubtitle: e.target.value } })} rows={2} placeholder="Unlock high-performance drone tech..." />
                            </div>
                        </div>

                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4>Bundle Deals</h4>
                            <button className="secondary-btn btn-sm" onClick={() => setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: [...(settings.offers?.bundleDeals || []), { title: '', items: [], price: '', originalPrice: '', discount: '', image: '' }] } })}><Plus size={16} /> Add Bundle</button>
                        </div>
                        <div className="cms-grid">
                            {(settings.offers?.bundleDeals || []).map((bundle, i) => (
                                <div key={i} className="cms-card shadow-sm" style={{ padding: '25px' }}>
                                    <div className="cms-details" style={{ width: '100%' }}>
                                        <div className="input-group">
                                            <label>Bundle Title</label>
                                            <input type="text" value={bundle.title} onChange={(e) => {
                                                const newDeals = [...settings.offers.bundleDeals];
                                                newDeals[i].title = e.target.value;
                                                setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                            }} placeholder="e.g. Agri-Spray Complete Bundle" />
                                        </div>
                                        <div className="input-group">
                                            <label>Items (one per line)</label>
                                            <textarea value={bundle.items?.join('\n') || ''} onChange={(e) => {
                                                const newDeals = [...settings.offers.bundleDeals];
                                                newDeals[i].items = e.target.value.split('\n').map(item => item.trim()).filter(Boolean);
                                                setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                            }} rows={3} placeholder="1x Drone&#10;2x Batteries&#10;1x Toolkit" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="input-group">
                                                <label>Bundle Price</label>
                                                <input type="text" value={bundle.price} onChange={(e) => {
                                                    const newDeals = [...settings.offers.bundleDeals];
                                                    newDeals[i].price = e.target.value;
                                                    setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                                }} placeholder="Rs. 1,45,000" />
                                            </div>
                                            <div className="input-group">
                                                <label>Original Price</label>
                                                <input type="text" value={bundle.originalPrice} onChange={(e) => {
                                                    const newDeals = [...settings.offers.bundleDeals];
                                                    newDeals[i].originalPrice = e.target.value;
                                                    setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                                }} placeholder="Rs. 1,75,000" />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Discount Label</label>
                                            <input type="text" value={bundle.discount} onChange={(e) => {
                                                const newDeals = [...settings.offers.bundleDeals];
                                                newDeals[i].discount = e.target.value;
                                                setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                            }} placeholder="Save Rs. 30,000" />
                                        </div>
                                        <div className="input-group">
                                            <label>Bundle Image URL</label>
                                            <input type="text" value={bundle.image || ''} onChange={(e) => {
                                                const newDeals = [...settings.offers.bundleDeals];
                                                newDeals[i].image = e.target.value;
                                                setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                            }} placeholder="https://..." />
                                        </div>
                                        <button className="remove-cms-btn" onClick={() => {
                                            if (!window.confirm('Are you absolutely sure you want to delete this bundle deal?')) return;
                                            const newDeals = settings.offers.bundleDeals.filter((_, idx) => idx !== i);
                                            setSettings({ ...settings, offers: { ...settings.offers, bundleDeals: newDeals } });
                                        }}><Trash2 size={14} /> Remove Bundle</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'footer' && (
                    <div className="footer-manager">
                        <div className="section-header" style={{ marginBottom: '20px' }}>
                            <h4>Footer Configuration</h4>
                            <p style={{ color: '#6b7280', fontSize: '13px' }}>Manage footer content, contact info, and links displayed site-wide.</p>
                        </div>
                        <div className="cms-card shadow-sm" style={{ padding: '25px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label>Company Name</label>
                                    <input type="text" value={settings.footer?.companyName || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, companyName: e.target.value } })} placeholder="Janaki Sky Innovations" />
                                </div>
                                <div className="input-group">
                                    <label>Phone Number</label>
                                    <input type="text" value={settings.footer?.phone || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, phone: e.target.value } })} placeholder="+91 7742228345" />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Email Address</label>
                                    <input type="email" value={settings.footer?.email || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, email: e.target.value } })} placeholder="support@janakiskyinnovations.com" />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Address</label>
                                    <textarea value={settings.footer?.address || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, address: e.target.value } })} rows={2} placeholder="123 Innovation Street, Campus Chowk, Dhanusha, India - 46800" />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Tagline</label>
                                    <input type="text" value={settings.footer?.tagline || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, tagline: e.target.value } })} placeholder="India's Biggest Robotics, DIY & Engineering Online Store." />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Copyright Text</label>
                                    <input type="text" value={settings.footer?.copyrightText || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, copyrightText: e.target.value } })} placeholder="© 2026 Janaki Sky Innovations - All Rights Reserved." />
                                </div>
                            </div>
                        </div>

                        <div className="cms-card shadow-sm" style={{ padding: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '800' }}>Customer Service Links</h4>
                            {(settings.footer?.customerServiceLinks || []).map((link, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                    <input type="text" value={link.label} onChange={(e) => {
                                        const newLinks = [...settings.footer.customerServiceLinks];
                                        newLinks[i].label = e.target.value;
                                        setSettings({ ...settings, footer: { ...settings.footer, customerServiceLinks: newLinks } });
                                    }} placeholder="Label" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                    <input type="text" value={link.href} onChange={(e) => {
                                        const newLinks = [...settings.footer.customerServiceLinks];
                                        newLinks[i].href = e.target.value;
                                        setSettings({ ...settings, footer: { ...settings.footer, customerServiceLinks: newLinks } });
                                    }} placeholder="/about" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                                    <button className="remove-cms-btn" onClick={() => {
                                        if (!window.confirm('Are you absolutely sure you want to delete this footer link?')) return;
                                        const newLinks = settings.footer.customerServiceLinks.filter((_, idx) => idx !== i);
                                        setSettings({ ...settings, footer: { ...settings.footer, customerServiceLinks: newLinks } });
                                    }}><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button className="secondary-btn btn-sm" onClick={() => setSettings({ ...settings, footer: { ...settings.footer, customerServiceLinks: [...(settings.footer?.customerServiceLinks || []), { label: '', href: '#' }] } })}><Plus size={16} /> Add Link</button>
                        </div>

                        <div className="cms-card shadow-sm" style={{ padding: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '800' }}>Newsletter Settings</h4>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={settings.footer?.newsletterEnabled || false} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, newsletterEnabled: e.target.checked } })} />
                                    <span style={{ fontWeight: '600' }}>Enable Newsletter Section</span>
                                </label>
                            </div>
                            {settings.footer?.newsletterEnabled && (
                                <>
                                    <div className="input-group">
                                        <label>Newsletter Title</label>
                                        <input type="text" value={settings.footer?.newsletterTitle || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, newsletterTitle: e.target.value } })} placeholder="NEWSLETTER" />
                                    </div>
                                    <div className="input-group">
                                        <label>Newsletter Description</label>
                                        <textarea value={settings.footer?.newsletterDescription || ''} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, newsletterDescription: e.target.value } })} rows={2} placeholder="Don't miss any updates..." />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="cms-card shadow-sm" style={{ padding: '25px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '800' }}>Payment Methods</h4>
                            <div className="input-group">
                                <label>Payment Methods (comma-separated)</label>
                                <input
                                    type="text"
                                    value={paymentMethodsText}
                                    onChange={(e) => setPaymentMethodsText(e.target.value)}
                                    onBlur={() => {
                                        const arr = paymentMethodsText.split(',').map(m => m.trim()).filter(Boolean);
                                        setSettings(prev => ({ ...prev, footer: { ...prev.footer, paymentMethods: arr } }));
                                    }}
                                    placeholder="VISA, MasterCard, UPI, Rupay"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'social' && (
                    <div className="social-manager">
                        {/* Social Media Icons Section */}
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h4>Social Media Icons</h4>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Manage social media links displayed in the footer (Facebook, YouTube, Twitter, Instagram, etc.)</p>
                            </div>
                            <button className="secondary-btn btn-sm" onClick={() => setSettings({ ...settings, socialMediaIcons: [...(settings.socialMediaIcons || []), { platform: '', iconName: 'Facebook', url: '', isActive: true }] })}><Plus size={16} /> Add Social Icon</button>
                        </div>
                        <div className="cms-grid" style={{ marginBottom: '40px' }}>
                            {(settings.socialMediaIcons || []).map((social, i) => (
                                <div key={i} className="cms-card shadow-sm" style={{ padding: '25px' }}>
                                    <div className="cms-details" style={{ width: '100%' }}>
                                        <div className="input-group">
                                            <label>Platform Name</label>
                                            <input type="text" value={social.platform} onChange={(e) => {
                                                const newIcons = [...settings.socialMediaIcons];
                                                newIcons[i].platform = e.target.value;
                                                setSettings({ ...settings, socialMediaIcons: newIcons });
                                            }} placeholder="e.g. Facebook" />
                                        </div>
                                        <div className="input-group">
                                            <label>Icon Name (Lucide React)</label>
                                            <select value={social.iconName} onChange={(e) => {
                                                const newIcons = [...settings.socialMediaIcons];
                                                newIcons[i].iconName = e.target.value;
                                                setSettings({ ...settings, socialMediaIcons: newIcons });
                                            }}>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Twitter">Twitter</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Youtube">YouTube</option>
                                                <option value="Linkedin">LinkedIn</option>
                                                <option value="Github">GitHub</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Profile URL</label>
                                            <input type="text" value={social.url} onChange={(e) => {
                                                const newIcons = [...settings.socialMediaIcons];
                                                newIcons[i].url = e.target.value;
                                                setSettings({ ...settings, socialMediaIcons: newIcons });
                                            }} placeholder="https://facebook.com/..." />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={social.isActive} onChange={(e) => {
                                                    const newIcons = [...settings.socialMediaIcons];
                                                    newIcons[i].isActive = e.target.checked;
                                                    setSettings({ ...settings, socialMediaIcons: newIcons });
                                                }} />
                                                <span style={{ fontWeight: '600', fontSize: '14px' }}>Active</span>
                                            </label>
                                        </div>
                                        <button className="remove-cms-btn" onClick={() => {
                                            if (!window.confirm('Are you absolutely sure you want to delete this social media icon?')) return;
                                            const newIcons = settings.socialMediaIcons.filter((_, idx) => idx !== i);
                                            setSettings({ ...settings, socialMediaIcons: newIcons });
                                        }}><Trash2 size={14} /> Remove Icon</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Contact Icons Section */}
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' }}>
                            <div>
                                <h4>Contact Icons (Floating Buttons)</h4>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Manage direct contact buttons (WhatsApp, Messenger, Phone, Mail) that float on the storefront</p>
                            </div>
                            <button className="secondary-btn btn-sm" onClick={() => setSettings({ ...settings, contactIcons: [...(settings.contactIcons || []), { platform: 'WhatsApp', iconName: 'WhatsApp', url: 'https://wa.me/917742228345', isActive: true }] })}><Plus size={16} /> Add Contact Icon</button>
                        </div>
                        <div className="cms-grid">
                            {(settings.contactIcons || []).map((contact, i) => {
                                const isWA = contact.iconName === 'WhatsApp' || contact.platform?.toLowerCase().includes('whatsapp');
                                const isMessenger = contact.iconName === 'MessageCircle' || contact.platform?.toLowerCase().includes('messenger');
                                const badgeColor = isWA ? '#25D366' : isMessenger ? '#0084FF' : '#f97316';

                                return (
                                    <div key={i} className="cms-card shadow-sm" style={{ padding: '24px', border: '1px solid #e2e8f0', borderTop: `4px solid ${badgeColor}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                fontSize: '12px', 
                                                fontWeight: '800', 
                                                padding: '4px 10px', 
                                                borderRadius: '6px', 
                                                background: `${badgeColor}15`, 
                                                color: badgeColor 
                                            }}>
                                                ● {contact.platform || (isWA ? 'WhatsApp' : isMessenger ? 'Messenger' : 'Contact Icon')}
                                            </span>
                                            <button className="remove-cms-btn" style={{ padding: '4px 8px', margin: 0 }} onClick={() => {
                                                if (!window.confirm('Are you absolutely sure you want to delete this contact icon?')) return;
                                                const newIcons = settings.contactIcons.filter((_, idx) => idx !== i);
                                                setSettings({ ...settings, contactIcons: newIcons });
                                            }}><Trash2 size={13} /> Delete</button>
                                        </div>
                                        <div className="cms-details" style={{ width: '100%', padding: 0 }}>
                                            <div className="input-group">
                                                <label>Platform Name</label>
                                                <input type="text" value={contact.platform} onChange={(e) => {
                                                    const newIcons = [...settings.contactIcons];
                                                    newIcons[i].platform = e.target.value;
                                                    setSettings({ ...settings, contactIcons: newIcons });
                                                }} placeholder="e.g. WhatsApp, Messenger" />
                                            </div>
                                            <div className="input-group">
                                                <label>Icon Type</label>
                                                <select value={contact.iconName} onChange={(e) => {
                                                    const newIcons = [...settings.contactIcons];
                                                    newIcons[i].iconName = e.target.value;
                                                    if (e.target.value === 'WhatsApp' && !newIcons[i].platform) newIcons[i].platform = 'WhatsApp';
                                                    if (e.target.value === 'MessageCircle' && !newIcons[i].platform) newIcons[i].platform = 'Messenger';
                                                    setSettings({ ...settings, contactIcons: newIcons });
                                                }}>
                                                    <option value="WhatsApp">WhatsApp (Green Floating Button)</option>
                                                    <option value="MessageCircle">MessageCircle / Messenger (Blue Floating Button)</option>
                                                    <option value="MessageSquare">MessageSquare (Chat)</option>
                                                    <option value="Phone">Phone Call (tel:)</option>
                                                    <option value="Mail">Email (mailto:)</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>URL / Direct Contact Link</label>
                                                <input 
                                                    type="text" 
                                                    value={contact.url} 
                                                    onChange={(e) => {
                                                        const newIcons = [...settings.contactIcons];
                                                        newIcons[i].url = e.target.value;
                                                        setSettings({ ...settings, contactIcons: newIcons });
                                                    }} 
                                                    placeholder={contact.iconName === 'WhatsApp' ? 'https://wa.me/917742228345?text=Hi...' : 'https://m.me/yourpage'} 
                                                />
                                                <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                                                    {isWA
                                                        ? '💡 WhatsApp link: https://wa.me/<countrycode><phone>?text=<custom message>'
                                                        : isMessenger
                                                        ? '💡 Messenger link: https://m.me/<facebook_page_username>'
                                                        : '💡 Enter the full direct destination link'}
                                                </small>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={contact.isActive} onChange={(e) => {
                                                        const newIcons = [...settings.contactIcons];
                                                        newIcons[i].isActive = e.target.checked;
                                                        setSettings({ ...settings, contactIcons: newIcons });
                                                    }} />
                                                    <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#334155' }}>Active (Visible on storefront)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========== ABOUT STORE TAB ========== */}
                {activeTab === 'about-store' && (
                    <div className="about-store-manager">
                        {/* Section 1: Hero & Titles */}
                        <div className="cms-section-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                                        🏪 Store Identity & Hero Banner
                                    </h4>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                                        Configure the main headline, subtitle, and hero background displayed at the top of the About Store page.
                                    </p>
                                </div>
                                <a 
                                    href="/about" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary-orange)', fontWeight: '700', textDecoration: 'none' }}
                                >
                                    <Eye size={15} /> Preview Store Page
                                </a>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>Page Title / Store Name</label>
                                    <input 
                                        type="text" 
                                        value={settings.aboutStore?.title || ''} 
                                        onChange={(e) => handleAboutStoreFieldChange('title', e.target.value)} 
                                        placeholder="e.g. About Janaki Sky Innovations" 
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>Store Tagline / Subtitle</label>
                                    <input 
                                        type="text" 
                                        value={settings.aboutStore?.subtitle || ''} 
                                        onChange={(e) => handleAboutStoreFieldChange('subtitle', e.target.value)} 
                                        placeholder="e.g. Pioneering Drone Tech & Engineering Solutions" 
                                    />
                                </div>
                            </div>

                            {/* Banner Image Uploader */}
                            <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px' }}>
                                    Hero Banner Background Image (Optional)
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    {(aboutBannerPreview || settings.aboutStore?.bannerImage) && (
                                        <div style={{ width: '180px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                            <img 
                                                src={aboutBannerPreview || settings.aboutStore?.bannerImage} 
                                                alt="Banner Preview" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={aboutBannerInputRef} 
                                        onChange={handleAboutBannerSelect} 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-sm" 
                                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                        onClick={() => aboutBannerInputRef.current?.click()}
                                    >
                                        <ImageIcon size={14} style={{ marginRight: '6px' }} />
                                        {(aboutBannerPreview || settings.aboutStore?.bannerImage) ? 'Change Banner Image' : 'Upload Banner Image'}
                                    </button>
                                    {(aboutBannerPreview || settings.aboutStore?.bannerImage) && (
                                        <button 
                                            type="button" 
                                            className="danger-btn btn-sm" 
                                            onClick={handleRemoveAboutBanner}
                                        >
                                            <Trash2 size={14} style={{ marginRight: '4px' }} /> Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Our Story & Storefront Image */}
                        <div className="cms-section-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                                📖 The Store Story & Facility Showcase
                            </h4>
                            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13.5px' }}>
                                Share your store's origin, expertise, passion for robotics, and upload a workshop or storefront photo.
                            </p>

                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>Store Story / Description (Multi-Paragraph)</label>
                                <textarea 
                                    rows={5} 
                                    value={settings.aboutStore?.story || ''} 
                                    onChange={(e) => handleAboutStoreFieldChange('story', e.target.value)} 
                                    placeholder="Write your store narrative, engineering focus, and background..." 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit' }}
                                />
                            </div>

                            {/* Store Image Uploader */}
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px' }}>
                                    Storefront / Workshop / Lab Photo
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    {(aboutStorePreview || settings.aboutStore?.storeImage) && (
                                        <div style={{ width: '140px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                            <img 
                                                src={aboutStorePreview || settings.aboutStore?.storeImage} 
                                                alt="Store Preview" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={aboutStoreInputRef} 
                                        onChange={handleAboutStoreImageSelect} 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-sm" 
                                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                        onClick={() => aboutStoreInputRef.current?.click()}
                                    >
                                        <ImageIcon size={14} style={{ marginRight: '6px' }} />
                                        {(aboutStorePreview || settings.aboutStore?.storeImage) ? 'Change Store Photo' : 'Upload Store Photo'}
                                    </button>
                                    {(aboutStorePreview || settings.aboutStore?.storeImage) && (
                                        <button 
                                            type="button" 
                                            className="danger-btn btn-sm" 
                                            onClick={handleRemoveAboutStoreImage}
                                        >
                                            <Trash2 size={14} style={{ marginRight: '4px' }} /> Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Mission & Vision */}
                        <div className="cms-section-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                                🎯 Mission & Vision
                            </h4>
                            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13.5px' }}>
                                State what drives your drone company and your future roadmap.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>Our Mission Statement</label>
                                    <textarea 
                                        rows={4} 
                                        value={settings.aboutStore?.mission || ''} 
                                        onChange={(e) => handleAboutStoreFieldChange('mission', e.target.value)} 
                                        placeholder="State your store mission..." 
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>Our Vision Statement</label>
                                    <textarea 
                                        rows={4} 
                                        value={settings.aboutStore?.vision || ''} 
                                        onChange={(e) => handleAboutStoreFieldChange('vision', e.target.value)} 
                                        placeholder="State your long-term vision..." 
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Key Store Guarantees / Highlights */}
                        <div className="cms-section-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                                        ✨ Store Guarantees & Highlights ("Why Choose Us")
                                    </h4>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                                        Key value propositions displayed in the highlight grid.
                                    </p>
                                </div>
                                <button 
                                    type="button" 
                                    className="primary-btn btn-sm" 
                                    onClick={handleAddAboutFeature}
                                >
                                    <Plus size={15} /> Add Highlight
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                {(settings.aboutStore?.features || []).map((feat, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary-orange)', textTransform: 'uppercase' }}>
                                                Highlight #{idx + 1}
                                            </span>
                                            <button 
                                                type="button" 
                                                className="remove-cms-btn" 
                                                style={{ padding: '3px 6px', margin: 0 }}
                                                onClick={() => handleRemoveAboutFeature(idx)}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ fontSize: '12.5px' }}>Icon</label>
                                            <select 
                                                value={feat.icon || 'ShieldCheck'} 
                                                onChange={(e) => handleAboutFeatureChange(idx, 'icon', e.target.value)}
                                            >
                                                <option value="ShieldCheck">ShieldCheck (Security / Genuine)</option>
                                                <option value="Zap">Zap (Speed / Fast Shipping)</option>
                                                <option value="Headphones">Headphones (Support / Guidance)</option>
                                                <option value="Award">Award (Quality / Precision)</option>
                                                <option value="Plane">Plane (UAV / Flight)</option>
                                                <option value="Cpu">Cpu (Robotics / Electronics)</option>
                                                <option value="Users">Users (Community / Pilots)</option>
                                                <option value="Target">Target (Mission / Accuracy)</option>
                                                <option value="Compass">Compass (Navigation / Innovation)</option>
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ fontSize: '12.5px' }}>Title</label>
                                            <input 
                                                type="text" 
                                                value={feat.title || ''} 
                                                onChange={(e) => handleAboutFeatureChange(idx, 'title', e.target.value)} 
                                                placeholder="e.g. 100% Genuine Components" 
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '12.5px' }}>Description</label>
                                            <textarea 
                                                rows={2} 
                                                value={feat.description || ''} 
                                                onChange={(e) => handleAboutFeatureChange(idx, 'description', e.target.value)} 
                                                placeholder="Brief description..." 
                                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 5: Key Store Metrics & Stats */}
                        <div className="cms-section-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                                        📊 Key Store Metrics & Numeric Stats
                                    </h4>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                                        Four prominent counter metrics displayed in the ribbon below the hero.
                                    </p>
                                </div>
                                <button 
                                    type="button" 
                                    className="primary-btn btn-sm" 
                                    onClick={handleAddAboutStat}
                                >
                                    <Plus size={15} /> Add Stat
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                                {(settings.aboutStore?.stats || []).map((stat, idx) => (
                                    <div key={idx} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#64748b' }}>
                                                STAT #{idx + 1}
                                            </span>
                                            <button 
                                                type="button" 
                                                className="remove-cms-btn" 
                                                style={{ padding: '2px 5px', margin: 0 }}
                                                onClick={() => handleRemoveAboutStat(idx)}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: '8px' }}>
                                            <label style={{ fontSize: '12px' }}>Value (e.g. 10,000+)</label>
                                            <input 
                                                type="text" 
                                                value={stat.value || ''} 
                                                onChange={(e) => handleAboutStatChange(idx, 'value', e.target.value)} 
                                                placeholder="10,000+" 
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '12px' }}>Label (e.g. Active Pilots)</label>
                                            <input 
                                                type="text" 
                                                value={stat.label || ''} 
                                                onChange={(e) => handleAboutStatChange(idx, 'label', e.target.value)} 
                                                placeholder="Pilots & Builders" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Store Location / Contact Information Note */}
                        <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <HelpCircle size={20} />
                            </div>
                            <div style={{ flex: 1, fontSize: '13.5px', color: '#1e3a8a', lineHeight: '1.5' }}>
                                <strong>Tip:</strong> Store address, contact phone, and support email shown at the bottom of the About Store page are automatically synced from your <strong>Footer</strong> tab settings. You can edit them anytime in the Footer tab.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCMS;
