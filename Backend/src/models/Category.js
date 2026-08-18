const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    icon: {
        type: String, // lucide-react icon name
        default: 'Layers'
    },
    image: {
        type: String, // ImageKit category thumbnail URL
        default: ''
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subCategories: [
        {
            name: { type: String, required: true },
            subSubCategories: [String]
        }
    ]
}, {
    timestamps: true
});

// Create slug from name before saving (async style - compatible with Mongoose 7+ and Express 5)
categorySchema.pre('save', async function() {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
});

module.exports = mongoose.model('Category', categorySchema);
