const express = require('express');
const morgan = require('morgan');

const globalErrorHandler = require('./controllers/globalErrorHandler');

const userRouter = require('./routerHandlers/userRoutes');
const sessionRouter = require('./routerHandlers/sessionRoutes');
const ticketRouter = require('./routerHandlers/ticketRoutes');

const app = express();

if (process.env.ENVIRONMENT === 'development') {
  app.use(morgan('dev'));
}

// body parser
app.use(express.json());

app.use('/HDRapi/v1/users', userRouter);
app.use('/HDRapi/v1/sessions', sessionRouter);
app.use('/HDRapi/v1/tickets', ticketRouter);

app.use(globalErrorHandler);

module.exports = app;
