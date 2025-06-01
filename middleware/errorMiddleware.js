const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Internal Server Error' 
    });
};

const notFound = (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found' 
    });
};

module.exports = { errorHandler, notFound };