const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommercedrone';
mongoose.connect(MONGO_URI).then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const productsWithNbsp = await Product.find({
        $or: [
            { shortSummary: /&nbsp;/ },
            { description: /&nbsp;/ }
        ]
    });
    console.log(`Found ${productsWithNbsp.length} products with &nbsp;`);
    for (const p of productsWithNbsp) {
        console.log(`Cleaning product: ${p.name} (${p._id})`);
        const newShort = (p.shortSummary || '').replace(/&nbsp;/g, ' ');
        const newDesc = (p.description || '').replace(/&nbsp;/g, ' ');
        await Product.updateOne({ _id: p._id }, { $set: { shortSummary: newShort, description: newDesc } });
    }
    console.log('Finished updating MongoDB products.');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
