class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

exports.AppError = AppError;

module.exports = (err, req, res, next) => {
  if (err.isOperational) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  } else {
    console.error(err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};