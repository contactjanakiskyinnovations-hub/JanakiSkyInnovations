const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./src/models/Category');

dotenv.config();

const sampleHierarchicalCategories = [
    {
        name: 'Drones',
        description: 'Complete high-quality aerial vehicles, kits, and professional heavy-duty drone equipment.',
        icon: 'Hexagon',
        image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800',
        isActive: true,
        subCategories: [
            {
                name: 'Payload Drones',
                subSubCategories: ['Package Carrier', 'Heavy Lifter', 'Tactical Drop']
            },
            {
                name: 'Agriculture Drones',
                subSubCategories: ['Crop Sprayer', 'Irrigation Drone', 'Soil Mapping']
            },
            {
                name: 'Surveillance Drones',
                subSubCategories: ['Thermal Night Vision', 'Security Patrol', 'Lidar Mapping']
            },
            {
                name: 'Flower Showering Drones',
                subSubCategories: ['Wedding & Event Specials', 'Ritual Flower Dropper']
            },
            {
                name: 'FPV Drones',
                subSubCategories: ['Racing Drone Kits', 'Cinematic FPV', 'Freestyle Ready-To-Fly']
            }
        ]
    },
    {
        name: 'Drones Accessories and Other electronic Accessories',
        description: 'Microcontroller boards, sensors, brushless motors, LiPo batteries, tools, and electronics accessories.',
        icon: 'Cpu',
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
        isActive: true,
        subCategories: [
            {
                name: 'Arduino',
                subSubCategories: ['Microcontroller Boards', 'Starter Kits', 'Shields & Modules']
            },
            {
                name: 'Sensors',
                subSubCategories: ['Ultrasonic Sensors', 'IMU & Gyroscopes', 'Telemetry & GPS', 'Lidar Sensors']
            },
            {
                name: 'Motors',
                subSubCategories: ['Brushless Motors', 'Servos', 'Electronic Speed Controllers (ESCs)']
            },
            {
                name: 'Batteries',
                subSubCategories: ['LiPo Batteries', 'Balance Chargers', 'Power Distribution Boards']
            },
            {
                name: 'Tools',
                subSubCategories: ['Precision Screwdriver Kits', 'Soldering Station Equipment', 'Workbench Accessories']
            }
        ]
    }
];

const seedHierarchicalCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected. Preparing to seed hierarchical categories...');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories database.');

        const categoriesToSave = sampleHierarchicalCategories.map(cat => {
            const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
            return {
                ...cat,
                slug
            };
        });

        // Insert into MongoDB
        await Category.insertMany(categoriesToSave);
        console.log('Seeded all hierarchical categories into MongoDB successfully!');
        
        process.exit();
    } catch (error) {
        console.error(`Error during category seeding: ${error.message}`);
        process.exit(1);
    }
};

seedHierarchicalCategories();

