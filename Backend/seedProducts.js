const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ImageKit = require('imagekit');
const Product = require('./src/models/Product');

dotenv.config();

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const sampleProducts = [
    // --- THREE MAIN DRONE PRODUCTS WITH STATIC IDs & DETAILS ---
    {
        _id: new mongoose.Types.ObjectId('66a3b2b8c9e7a2b3c4d5e001'),
        name: 'DJI Mini 4 Neo (aka DJI Neo)',
        sku: 'DRN-DJI-NEO',
        description: 'To enhance creativity even more, the DJI Neo Fly More Combo includes six QuickShots modes, allowing beginners to capture cinematic-style footage with just a few taps. Additionally, you can control the drone through voice commands, your smartphone, or an optional remote, offering great flexibility. With up to 18 minutes of flight time, flexible storage options, and seamless editing via the DJI Fly App, your creative process remains smooth from takeoff to final edit. Whether you’re a hobbyist or a beginner content creator, the DJI Neo ensures your storytelling stays effortless and uninterrupted.\n\n● Ultra-Lightweight Design – Weighing only 135 grams, this drone is incredibly compact and palm-sized, making it perfect for on-the-go creators. Its lightweight design means you can carry it anywhere with ease—no bulky gear or special cases required.\n\n● Impressive Imaging – Equipped with a high-quality camera, it captures stunning 12-megapixel photos and shoots ultra-clear 4K video at 30 frames per second. Advanced electronic image stabilization ensures smooth, professional-looking footage even during fast movement or windy conditions.\n\n● Smart AI Tracking – Powered by intelligent AI algorithms, the drone tracks subjects effortlessly, keeping them center-frame during movement.',
        price: 29999,
        oldPrice: 34999,
        category: 'Drones',
        subCategory: 'dji-drones',
        stock: 15,
        isFeatured: true,
        mainImage: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1507504031003-b417219a0fde?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1473968512467-3e9c02c0a7e5?q=80&w=2070&auto=format&fit=crop'
        ],
        specifications: {
            'Product Name': 'DJI Mini 4 Neo (aka DJI Neo)',
            'Weight': '135 g (4.8 oz)',
            'Folded Dimensions': '86.5 × 142 × 57.5 mm',
            'Unfolded Dimensions': '211 × 142 × 57.5 mm',
            'Max Flight Time': '18 minutes',
            'Max Hover Time': '17 minutes',
            'Max Wind Resistance': '8 m/s (Level 4)',
            'Max Flight Speed': '16 m/s (S-mode)',
            'Max Altitude': '4000 m',
            'GNSS Systems': 'GPS + Galileo + BeiDou',
            'Internal Storage': '22 GB',
            'External Storage': 'None (Internal Storage only)',
            'Sensor': '1/2" CMOS, 12 MP',
            'Lens': 'FOV 117.6°, 14 mm equivalent, f/2.8',
            'ISO Range': '100-6400 (Photo & Video)',
            'Shutter Speed': '1/8000-1/50 s',
            'Photo Resolution': '4000 × 3000 (12 MP)',
            'Photo Modes': 'Single Shot, Timed Shot',
            'Video Resolutions': '4K @ 30fps, 1080p @ 60fps',
            'Video Format': 'MP4 (H.264)',
            'Stabilization': '1-axis mechanical gimbal (tilt) + EIS (RockSteady/HorizonSteady)',
            'Type': 'Li-ion (2S)',
            'Capacity': '1435 mAh',
            'Voltage': '7.3 V',
            'Charging Time': '50 minutes',
            'Model': 'Voice, App, or RC (N2/N3)',
            'Transmission': 'OcuSync 4 (O4)',
            'Max Transmission Range': '7 km',
            'Live View Quality': '1080p @ 30fps',
            'App Support': 'DJI Fly App',
            'Sensors': 'Downward Vision System',
            'Return to Home': 'Yes',
            'Beginner Mode': 'Yes',
            'Firmware Updates': 'Via DJI Fly App'
        },
        inTheBox: '● DJI Neo Aircraft\n● Intelligent Flight Battery\n● Propeller Guards (Pair)\n● Spare Propellers (Pair)\n● Gimbal Protector\n● Type-C to Type-C PD Cable\n● DJI RC-N3 Remote Controller\n● Documents (Quick Start Guide, Safety Guidelines)',
        keyFeatures: '● Ultra-lightweight design (~135g) – easy to carry and palm launch.\n● 4K video recording with RockSteady & HorizonBalancing stabilization.\n● Captures 12MP photos with good clarity for social content.\n● Advanced AI subject tracking for hands-free shooting.\n● Supports 6 QuickShots modes (Dronie, Rocket, Helix, Circle, etc.).\n● Palm takeoff & landing – no controller required for basic use.\n● Up to 18 minutes flight time per battery.'
    },
    {
        _id: new mongoose.Types.ObjectId('66a3b2b8c9e7a2b3c4d5e002'),
        name: 'DJI Flip',
        sku: 'DRN-DJI-FLIP',
        description: 'Unleash your creativity with the DJI Flip. Designed for active content creators, it features a 3-axis mechanical gimbal, 4K video at 60fps, and basic obstacle sensing. Lightweight and extremely compact, it fits in any pocket.',
        price: 45000,
        oldPrice: 49999,
        category: 'Drones',
        subCategory: 'dji-drones',
        stock: 10,
        isFeatured: true,
        mainImage: 'https://images.unsplash.com/photo-1524143878510-e3b8d6312402?q=80&w=2070&auto=format&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1524143878510-e3b8d6312402?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1521671713035-0f6fc3a0fd04?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=2070&auto=format&fit=crop'
        ],
        specifications: {
            'Product Name': 'DJI Flip',
            'Weight': '~105 g',
            'Camera Quality': '4K 60fps, up to 48MP',
            'Gimbal Stabilization': '3-axis mechanical',
            'Flight Time': '31 minutes',
            'Range': '14 km',
            'Wind Resistance': 'Medium (Level 5)',
            'Obstacle Avoidance': 'Basic sensors',
            'Storage': 'microSD supported',
            'Portability': 'Compact',
            'Ease of Use': 'Easy + creative modes',
            'Best For': 'Content creators',
            'Price Range': 'Mid-range'
        },
        inTheBox: '● DJI Flip Aircraft\n● Intelligent Flight Battery\n● RC-N2 Remote Controller\n● Spare Propellers (Pair)\n● Gimbal Shield\n● USB-C PD Cable\n● Screwdriver & Spare Screws'
    },
    {
        _id: new mongoose.Types.ObjectId('66a3b2b8c9e7a2b3c4d5e003'),
        name: 'DJI Mini Series (Mini 4 Pro)',
        sku: 'DRN-DJI-M4P',
        description: 'The ultimate advanced compact drone. Weighing less than 249g, the DJI Mini 4 Pro features omnidirectional obstacle sensing, 4K/60fps HDR video, and up to 34 minutes of flight time. Perfect for professional creators.',
        price: 95000,
        oldPrice: 105000,
        category: 'Drones',
        subCategory: 'dji-drones',
        stock: 8,
        isFeatured: true,
        mainImage: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1473968512467-3e9c02c0a7e5?q=80&w=2070&auto=format&fit=crop'
        ],
        specifications: {
            'Product Name': 'DJI Mini 4 Pro',
            'Weight': '249 g',
            'Camera Quality': 'Up to 4K 60fps / HDR (best quality)',
            'Gimbal Stabilization': '3-axis mechanical (best)',
            'Flight Time': '30-34 minutes',
            'Range': 'Up to 18 km',
            'Wind Resistance': 'High (Level 5)',
            'Obstacle Avoidance': 'Advanced (Mini 4 Pro - best)',
            'Storage': 'microSD supported',
            'Portability': 'Compact but bigger',
            'Ease of Use': 'Intermediate to advanced',
            'Best For': 'Photography, professional shots',
            'Price Range': 'Mid to premium'
        },
        inTheBox: '● DJI Mini 4 Pro\n● DJI RC 2 Remote Controller\n● 3x Intelligent Flight Batteries\n● Two-Way Charging Hub\n● Shoulder Bag\n● Spare Propellers (3 Pairs)\n● Gimbal Protector\n● Type-C to Type-C Cable'
    },

    // --- OTHER ELECTRONICS / ACCESSORIES ---
    {
        name: 'Arduino Uno R3 Compatible Board with Cable',
        sku: 'ARD-UNO-R3',
        description: 'The classic Arduino Uno R3 board. Perfect for beginners and advanced developers alike to start prototyping robotics and IoT devices.',
        price: 450,
        oldPrice: 599,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Arduino',
        stock: 150,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800'
    },
    {
        name: 'Arduino Mega 2560 R3 Board',
        sku: 'ARD-MEG-2560',
        description: 'Arduino Mega 2560 R3 with extra input/output pins, more memory, and hardware serial ports for larger-scale robotics systems.',
        price: 1100,
        oldPrice: 1499,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Arduino',
        stock: 75,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800'
    },
    {
        name: 'Ultrasonic Distance Sensor HC-SR04',
        sku: 'SEN-ULT-SR04',
        description: 'Easy-to-use ultrasonic distance sensor module. Perfect for obstacle avoidance in autonomous drones and robotic vehicles.',
        price: 120,
        oldPrice: 199,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Sensors',
        stock: 300,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800'
    },
    {
        name: 'MPU6050 6-Axis Gyroscope and Accelerometer',
        sku: 'SEN-GYR-MPU',
        description: 'High-precision IMU sensor module. Essential for stabilization systems, flight controllers, and motion tracking.',
        price: 250,
        oldPrice: 399,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Sensors',
        stock: 120,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800'
    },
    {
        name: 'Brushless Outrunner Motor 2212 1000KV',
        sku: 'MTR-BLDC-2212',
        description: 'High efficiency 1000KV brushless motor optimized for quadcopters, multirotors, and RC airplanes.',
        price: 850,
        oldPrice: 1200,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Motors',
        stock: 90,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800'
    },
    {
        name: 'SG90 Micro Servo Motor 9g',
        sku: 'MTR-SRV-SG90',
        description: 'Tiny and lightweight micro servo motor. Ideal for steering mechanisms, camera gimbals, and robotic arms.',
        price: 150,
        oldPrice: 250,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Motors',
        stock: 450,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800'
    },
    {
        name: 'Orange 3S 2200mAh 40C LiPo Battery',
        sku: 'PWR-LIP-2200',
        description: 'Premium quality 11.1V Lithium Polymer battery packs with high discharge rates for high-performance drones.',
        price: 1850,
        oldPrice: 2400,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Batteries',
        stock: 50,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800'
    },
    {
        name: 'Precision Screwdriver Toolkit 45-in-1',
        sku: 'TLS-PRC-45',
        description: 'Professional toolset containing magnetic bits, extension rod, and flexible shaft for delicate electronics disassembly.',
        price: 650,
        oldPrice: 999,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Tools',
        stock: 40,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'
    },
    {
        name: 'Soldering Iron Kit 60W with Temperature Control',
        sku: 'TLS-SLD-60W',
        description: 'Adjustable temperature soldering iron with stand, solder wire, and cleaning sponge. Essential for hobbyists.',
        price: 950,
        oldPrice: 1499,
        category: 'Drones Accessories and Other electronic Accessories',
        subCategory: 'Tools',
        stock: 35,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'
    },
    // --- TOP DRONE CATEGORIES PRODUCTS ---
    {
        name: 'AeroPayload Pro Heavy-Lift Cargo Drone',
        sku: 'DRN-PAY-PRO1',
        description: 'Heavy-duty industrial delivery drone capable of lifting up to 10kg payloads with dual GPS, obstacle avoidance sensors, and emergency parachute release system.',
        price: 125000,
        oldPrice: 140000,
        category: 'Drones',
        subCategory: 'Payload Drones',
        subSubCategory: 'Heavy Lift Cargo',
        stock: 6,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e03e59c9417d?w=800'
    },
    {
        name: 'AgriCrop Master 16L Agriculture Sprayer Drone',
        sku: 'DRN-AGR-16L',
        description: 'Advanced agricultural spraying drone with 16-liter tank, intelligent flight planning, radar terrain sensing, and precision centrifugal atomizing nozzles.',
        price: 185000,
        oldPrice: 210000,
        category: 'Drones',
        subCategory: 'Agriculture Drones',
        subSubCategory: 'Crop Sprayer',
        stock: 4,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1532509170117-98ef7500b411?w=800'
    },
    {
        name: 'GuardSky Thermal Night Vision Surveillance Drone',
        sku: 'DRN-SRV-THM1',
        description: 'Long-range thermal surveillance drone featuring dual optical + 640x512 thermal cameras, 45-min endurance, encrypted video link, and automated perimeter security flight routines.',
        price: 145000,
        oldPrice: 165000,
        category: 'Drones',
        subCategory: 'Surveillance Drones',
        subSubCategory: 'Thermal Night Vision',
        stock: 5,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800'
    },
    {
        name: 'FloralSky Wedding & Event Flower Dropper Drone',
        sku: 'DRN-FLW-EVT1',
        description: 'Specially engineered quiet drone with remote automated flower release mechanism for grand weddings, stage entrances, and religious ceremonies.',
        price: 65000,
        oldPrice: 75000,
        category: 'Drones',
        subCategory: 'Flower Showering Drones',
        subSubCategory: 'Wedding & Event Specials',
        stock: 8,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'
    },
    {
        name: 'Velocity-5 Freestyle Cinematic FPV Ready-To-Fly Drone',
        sku: 'DRN-FPV-VEL5',
        description: 'Pre-tuned 5-inch FPV drone equipped with O3 HD video transmitter, carbon fiber frame, F7 flight controller, and 50A 4-in-1 ESCs for high speed freestyle and cinematic recording.',
        price: 52000,
        oldPrice: 59999,
        category: 'Drones',
        subCategory: 'FPV Drones',
        subSubCategory: 'Freestyle Ready-To-Fly',
        stock: 12,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1597847494283-a27825b84365?w=800'
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected. Preparing to seed products...');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products.');

        const uploadedProducts = [];

        for (const prod of sampleProducts) {
            // If the product already has a full HTTP(S) URL for mainImage, insert it directly without re-uploading
            if (prod.mainImage && /^https?:\/\//.test(prod.mainImage)) {
                console.log(`Using existing image URL directly for: ${prod.name}`);
                uploadedProducts.push(prod);
                continue;
            }

            console.log(`Uploading image to ImageKit for: ${prod.name}`);
            try {
                // Pass Unsplash URL directly to ImageKit upload SDK!
                const uploadRes = await imagekit.upload({
                    file: prod.imageUrl,
                    fileName: `${prod.sku}.jpg`,
                    folder: '/ecommerce-drone/products'
                });

                console.log(`Uploaded successfully! URL: ${uploadRes.url}`);

                // Create database model object matching the Product schema
                uploadedProducts.push({
                    name: prod.name,
                    sku: prod.sku,
                    description: prod.description,
                    price: prod.price,
                    oldPrice: prod.oldPrice,
                    category: prod.category,
                    subCategory: prod.subCategory,
                    stock: prod.stock,
                    isFeatured: prod.isFeatured,
                    mainImage: uploadRes.url,
                    gallery: [uploadRes.url],
                    specifications: prod.specifications || {},
                    inTheBox: prod.inTheBox || ''
                });
            } catch (err) {
                console.error(`Failed to upload image for ${prod.name}:`, err.message);
                // Fallback to Unsplash URL directly in DB if upload fails
                uploadedProducts.push({
                    name: prod.name,
                    sku: prod.sku,
                    description: prod.description,
                    price: prod.price,
                    oldPrice: prod.oldPrice,
                    category: prod.category,
                    subCategory: prod.subCategory,
                    stock: prod.stock,
                    isFeatured: prod.isFeatured,
                    mainImage: prod.imageUrl,
                    gallery: [prod.imageUrl],
                    specifications: prod.specifications || {},
                    inTheBox: prod.inTheBox || ''
                });
            }
        }

        // Insert into MongoDB
        await Product.insertMany(uploadedProducts);
        console.log('Seeded products into database successfully!');
        
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedProducts();
