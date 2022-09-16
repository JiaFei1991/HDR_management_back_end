const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const globalErrorHandler = require('./controllers/globalErrorHandler');

const userRouter = require('./routerHandlers/userRoutes');
const projectRouter = require('./routerHandlers/projectRoutes');
const scheduleRouter = require('./routerHandlers/scheduleRoutes');
const sessionRouter = require('./routerHandlers/sessionRoutes');
const ticketRouter = require('./routerHandlers/ticketRoutes');

const app = express();

if (process.env.ENVIRONMENT === 'development') {
  app.use(morgan('dev'));
}

// body parser
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: false,
    parameterLimit: 1000
  })
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end();
    return;
  }
  next();
});

app.use(express.static('public'));

app.use('/HDRapi/v1/users', userRouter);
app.use('/HDRapi/v1/projects', projectRouter);
app.use('/HDRapi/v1/schedules', scheduleRouter);
app.use('/HDRapi/v1/sessions', sessionRouter);
app.use('/HDRapi/v1/tickets', ticketRouter);

app.use(globalErrorHandler);

module.exports = app;
