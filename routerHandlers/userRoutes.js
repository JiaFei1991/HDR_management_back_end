const express = require('express');
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');
const sessionRouter = require('./sessionRoutes');

const router = express.Router();

router.route('/signup').post(userControllers.createUser);
router.route('/login').post(authControllers.login);

// when a user id is present in a route followed by the 'session' keyword
// use the sessionRouter, passing the user id using nested routes
router.use('/:userId/sessions', sessionRouter);

// access to all following routes require login
router.use(authControllers.routeProtection);
router
  .route('/')
  .get(
    authControllers.checkNestedRoute,
    authControllers.restrictTo('admin', 'supervisor'),
    userControllers.getAllUsers
  )
  .delete(authControllers.restrictTo('admin'), userControllers.deleteAllUsers);

router
  .route('/:id')
  .get(authControllers.interStudentProtection, userControllers.getOneUser)
  .patch(authControllers.interStudentProtection, userControllers.updateUser)
  .delete(
    authControllers.restrictTo('admin', 'supervisor'),
    userControllers.deleteUser
  );

module.exports = router;
