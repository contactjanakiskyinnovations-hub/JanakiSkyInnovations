const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ImageKit = require('imagekit');
const Category = require('./src/models/Category');

dotenv.config();

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const sampleCategories = [
    {
        name: 'Payload Drones',
        description: 'Heavy duty drones designed for package carrying, parcel drop, and load lifting operations.',
        icon: 'Package',
        imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'
    },
    {
        name: 'Agriculture Drones',
        description: 'Advanced farming crop-spraying, irrigation, and field analysis aerial solutions.',
        icon: 'Sprout',
        imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800' // Verified working drone url
    },
    {
        name: 'Surveillance Drones',
        description: 'Thermal, security patrol, mapping, and night vision flight vehicles.',
        icon: 'Eye',
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800'
    },
    {
        name: 'Flower Showering Drones',
        description: 'Premium wedding, event, and ritual flower dropping drones engineered for perfect events.',
        icon: 'Heart',
        imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'
    },
    {
        name: 'FPV Drones',
        description: 'Extreme speed racing, freestyle, and cinematic first-person view flying setups.',
        icon: 'Zap',
        imageUrl: 'https://images.unsplash.com/photo-1597847494283-a27825b84365?w=800'
    },
    {
        name: 'Arduino',
        description: 'Microcontroller boards, starter kits, development modules, and custom shields.',
        icon: 'Cpu',
        imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800'
    },
    {
        name: 'Sensors',
        description: 'Ultrasonic, IMUs, GPS, telemetry, lidar, and environmental sensing boards.',
        icon: 'Radio',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800' // Verified working circuit board url
    },
    {
        name: 'Motors',
        description: 'High-performance brushless motors, servos, steppers, and electronic speed controllers.',
        icon: 'Settings',
        imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800' // Verified working tech url
    },
    {
        name: 'Batteries',
        description: 'High discharge rate LiPo batteries, chargers, converters, and power management units.',
        icon: 'Battery',
        imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800'
    },
    {
        name: 'Tools',
        description: 'Professional precision toolkits, soldering irons, wire cutters, and workbench gear.',
        icon: 'Wrench',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' // Verified working toolbox url
    }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected. Preparing to seed categories...');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories database.');

        const uploadedCategories = [];

        for (const cat of sampleCategories) {
            console.log(`Uploading thumbnail image to ImageKit for category: ${cat.name}`);
            const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
            try {
                // Pass Unsplash URL directly to ImageKit upload SDK!
                const uploadRes = await imagekit.upload({
                    file: cat.imageUrl,
                    fileName: `category-${slug}.jpg`,
                    folder: '/ecommerce-drone/categories'
                });

                console.log(`Uploaded successfully! URL: ${uploadRes.url}`);

                uploadedCategories.push({
                    name: cat.name,
                    slug: slug,
                    description: cat.description,
                    icon: cat.icon,
                    image: uploadRes.url
                });
            } catch (err) {
                console.error(`Failed to upload image for category ${cat.name}:`, err.message);
                uploadedCategories.push({
                    name: cat.name,
                    slug: slug,
                    description: cat.description,
                    icon: cat.icon,
                    image: cat.imageUrl // fallback
                });
            }
        }

        // Insert into MongoDB
        await Category.insertMany(uploadedCategories);
        console.log('Seeded all categories into MongoDB successfully!');
        
        process.exit();
    } catch (error) {
        console.error(`Error during category seeding: ${error.message}`);
        process.exit(1);
    }
};

seedCategories();
