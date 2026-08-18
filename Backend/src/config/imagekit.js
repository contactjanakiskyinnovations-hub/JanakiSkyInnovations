const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'your_public_key',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'your_private_key',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'your_url_endpoint'
});

module.exports = imagekit;
