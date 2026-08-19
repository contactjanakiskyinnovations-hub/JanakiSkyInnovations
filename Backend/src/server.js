const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const seoRoutes = require('./routes/seoRoutes');

// Connect to Database
connectDB();

// Sync Mongoose indexes after connection to fix stale unique indexes
// (e.g. a non-sparse email_1 unique index causing E11000 on null emails).
mongoose.connection.once('open', async () => {
    try {
        const User = require('./models/User');
        await User.syncIndexes();
        console.log('MongoDB indexes synchronized.');
    } catch (err) {
        console.error('Failed to sync indexes:', err.message);
    }
});

const app = express();

// Middleware
// SECURITY: CORS is restricted to known origins.
//   - Development: any localhost/127.0.0.1 port is allowed (Vite 5173 etc.)
//   - Production: set CORS_ORIGINS in .env to a comma-separated list of your
//     deployed frontend origins, e.g.  CORS_ORIGINS=https://yourstore.com
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
        if (!origin) return callback(null, true);
        try {
            const url = new URL(origin);
            const isLocalhost = (
                url.hostname === 'localhost' ||
                url.hostname === '127.0.0.1' ||
                url.hostname === '::1'
            );
            if (isLocalhost || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
        } catch (e) {
            /* ignore malformed origins */
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
}));
app.use(express.json());

// SECURITY: Basic hardening headers (defense-in-depth, no external dependency).
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/service-requests', serviceRequestRoutes);

// SEO endpoints (robots.txt + live sitemap.xml generated from MongoDB)
app.use(seoRoutes);

app.get('/', (req, res) => {
    res.send('Ecommerce Drone API is running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Port Configuration
// On Vercel (serverless) the app is exported and Vercel invokes it per request.
// `app.listen` only runs when this file is executed directly (local dev / Render).
const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}

module.exports = app;
