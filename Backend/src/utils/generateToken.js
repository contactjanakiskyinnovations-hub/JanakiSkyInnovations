const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    // SECURITY: Never fall back to a hard-coded secret. If JWT_SECRET is
    // missing, fail loudly so tokens can never be forged with a known key.
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured. Set it in the Backend/.env file.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

module.exports = generateToken;
