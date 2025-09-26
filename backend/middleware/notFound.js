const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFound;
