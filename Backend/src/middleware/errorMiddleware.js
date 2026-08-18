const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        message = `Resource not found`;
        statusCode = 404;
    }

    // File-upload errors raised by multer
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Image file is too large. Maximum allowed size is 2 MB.';
        } else {
            message = `Image upload failed: ${err.message}`;
        }
    }

    // Respect explicit HTTP status codes set on thrown errors (e.g. image type rejection)
    if (err.status && Number.isInteger(err.status)) {
        statusCode = err.status;
    }

    // Log the actual error to the backend terminal
    console.error(`[Error]: ${err.message}`, err.stack);

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };
