function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl
  });
}

function errorHandler(err, req, res, _next) {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = { errorHandler, notFoundHandler };
