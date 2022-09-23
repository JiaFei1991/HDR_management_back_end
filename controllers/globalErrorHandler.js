const ErrorGenerator = require('../util/errorGenerator');

const validationErrorHandler = ({ errors, statusCode }) => {
  const message = errors.age.message;
  return new ErrorGenerator(message, statusCode);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'fail',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.ENVIRONMENT === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.ENVIRONMENT === 'production') {
    let error = { ...err };

    if (err.name === 'ValidationError') error = validationErrorHandler(err);

    sendErrorProd(error, res);
  }
};
