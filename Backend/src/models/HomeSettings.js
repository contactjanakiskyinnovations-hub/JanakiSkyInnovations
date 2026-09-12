const mongoose = require('mongoose');

const homeSettingsSchema = new mongoose.Schema({
    logoImage: { 
        type: String, 
        default: 'https://ik.imagekit.io/ftcr3yz3y1/Ecommerce-Drone/Logo/logoWithName.jpeg' 
    },
    heroSliders: [
        {
            image: { type: String, required: true },
            title: { type: String },
            subtitle: { type: String },
            link: { type: String },
            isActive: { type: Boolean, default: true }
        }
    ],
    promoBanners: [
        {
            image: { type: String, required: true },
            title: { type: String },
            description: { type: String },
            link: { type: String },
            position: { type: String, enum: ['top', 'middle', 'bottom'] }
        }
    ],
    featuredCategories: [
        {
            categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
            image: String,
            title: String
        }
    ],
    categoryBanners: [
        {
            title: { type: String },
            category: { type: String },
            image: { type: String },
            link: { type: String },
            isActive: { type: Boolean, default: true }
        }
    ],
    imageVersion: { type: Number, default: 0 },
    coupons: [
        {
            code: { type: String, required: true },
            discount: { type: String, required: true },
            title: { type: String },
            description: { type: String },
            expiry: { type: String }
        }
    ],
    services: [
        {
            title: { type: String, required: true },
            iconName: { type: String, default: 'Shield' },
            description: { type: String },
            features: [{ type: String }],
            // Optional background image shown behind the service card on the
            // storefront. Uploaded to /ecommerce-drone/services/<ServiceName>.
            image: { type: String, default: '' }
        }
    ],
    serviceCategories: [
        {
            name: { type: String, default: '' },
            slug: { type: String, default: '' },
            description: { type: String, default: '' },
            iconName: { type: String, default: 'Shield' },
            services: [
                {
                    title: { type: String, default: '' },
                    iconName: { type: String, default: 'Shield' },
                    description: { type: String, default: '' },
                    features: [{ type: String }],
                    // Optional background image shown behind the service card on
                    // the storefront. Uploaded to /ecommerce-drone/services/<ServiceName>.
                    image: { type: String, default: '' }
                }
            ]
        }
    ],
    bestSellerThreshold: {
        type: Number,
        default: 10,
        min: 1
    },
    newArrivalDays: {
        type: Number,
        default: 30,
        min: 1
    },
    footer: {
        companyName: { type: String, default: 'Janaki Sky Innovations' },
        tagline: { type: String, default: 'India\'s Biggest Robotics, DIY & Engineering Online Store.' },
        address: { type: String, default: '123 Innovation Street, Campus Chowk, Dhanusha, India - 46800' },
        phone: { type: String, default: '+91 7742228345' },
        email: { type: String, default: 'support@janakiskyinnovations.com' },
        copyrightText: { type: String, default: '© 2026 Janaki Sky Innovations - All Rights Reserved.' },
        customerServiceLinks: [
            {
                label: { type: String },
                href: { type: String, default: '#' }
            }
        ],
        paymentMethods: [{ type: String }],
        newsletterEnabled: { type: Boolean, default: true },
        newsletterTitle: { type: String, default: 'NEWSLETTER' },
        newsletterDescription: { type: String, default: 'Don\'t miss any updates or promotions by signing up to our newsletter.' }
    },
    socialMediaIcons: [
        {
            platform: { type: String },
            iconName: { type: String },
            url: { type: String },
            isActive: { type: Boolean, default: true }
        }
    ],
    contactIcons: [
        {
            platform: { type: String },
            iconName: { type: String },
            url: { type: String },
            isActive: { type: Boolean, default: true }
        }
    ],
    offers: {
        heroTitle: { type: String, default: 'Flash Sale & Coupons' },
        heroSubtitle: { type: String, default: 'Unlock high-performance drone tech with active coupon codes, bundled sets, and seasonal flight reductions.' },
        bundleDeals: [
            {
                title: { type: String },
                items: [{ type: String }],
                price: { type: String },
                originalPrice: { type: String },
                discount: { type: String },
                image: { type: String }
            }
        ]
    },
    aboutStore: {
        title: { type: String, default: 'About Janaki Sky Innovations' },
        subtitle: { type: String, default: 'Pioneering Drone Tech & Advanced Engineering Solutions' },
        story: { type: String, default: 'Founded with a passion for robotics, aviation, and aerospace engineering, Janaki Sky Innovations is your premier destination for UAV technology, high-precision drone components, DIY robotics supplies, and specialized commercial flight solutions. We serve hobbyists, agricultural innovators, researchers, and professional aerial photographers across India and Nepal.' },
        mission: { type: String, default: 'To empower creators, agricultural pioneers, and tech enthusiasts with authentic, high-performance drone hardware, verified engineering parts, and personalized technical support.' },
        vision: { type: String, default: 'To be the leading unmanned systems and robotics ecosystem in South Asia, bridging cutting-edge aerospace advancements with accessible, reliable hardware.' },
        bannerImage: { type: String, default: '' },
        storeImage: { type: String, default: '' },
        features: [
            {
                icon: { type: String, default: 'ShieldCheck' },
                title: { type: String, default: '100% Genuine Components' },
                description: { type: String, default: 'All UAV flight controllers, motors, ESCs, and batteries are sourced directly from verified manufacturers.' }
            },
            {
                icon: { type: String, default: 'Zap' },
                title: { type: String, default: 'Fast & Secure Dispatch' },
                description: { type: String, default: 'Precision-packed sensitive electronics delivered swiftly and safely right to your workshop or field.' }
            },
            {
                icon: { type: String, default: 'Headphones' },
                title: { type: String, default: 'Expert Technical Support' },
                description: { type: String, default: 'Our team of aerospace and robotics engineers is available to help you build, tune, and fly.' }
            },
            {
                icon: { type: String, default: 'Award' },
                title: { type: String, default: 'Custom UAV Solutions' },
                description: { type: String, default: 'Specialized agricultural spraying drones, surveillance systems, and industrial inspection rigs.' }
            }
        ],
        stats: [
            { label: { type: String, default: 'Active Pilots & Builders' }, value: { type: String, default: '10,000+' } },
            { label: { type: String, default: 'Drone & Robotics Parts' }, value: { type: String, default: '5,000+' } },
            { label: { type: String, default: 'Custom Drones Delivered' }, value: { type: String, default: '500+' } },
            { label: { type: String, default: 'Years of Engineering' }, value: { type: String, default: '5+' } }
        ]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HomeSettings', homeSettingsSchema);
