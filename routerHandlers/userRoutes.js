const express = require('express');
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');
const projectRouter = require('./projectRoutes');
const scheduleRouter = require('./scheduleRoutes');

const router = express.Router();

router
  .route('/signup')
  .post(userControllers.createSupervisor, userControllers.createUser);
router.route('/login').post(authControllers.login);
router.route('/forgetPassword').post(authControllers.forgetPassword);
router
  .route('/updatePassword')
  .post(authControllers.routeProtection, authControllers.updatePassword);
router
  .route('/protectedUserCreation')
  .post(userControllers.createProtectedUser);
router
  .route('/logout')
  .get(authControllers.routeProtection, authControllers.logout);
router.route('/:resetToken/resetPassword').post(authControllers.resetPassword);

// when a user id is present in a route followed by the 'session' keyword
// use the sessionRouter, passing the user id using nested routes
router.use('/:userId/projects', projectRouter);
router.use('/:userId/schedules', scheduleRouter);

// access to all following routes require login
// router.use(authControllers.routeProtection);
router
  .route('/')
  // .get(
  //   authControllers.checkNestedRoute,
  //   authControllers.restrictTo('admin', 'supervisor'),
  //   authControllers.roleBasedQueryFilling,
  //   userControllers.getAllUsers
  // )
  .get(
    // authControllers.checkNestedRoute,
    // authControllers.restrictTo('admin', 'supervisor'),
    // authControllers.roleBasedQueryFilling,
    userControllers.getAllUsers
  )
  .delete(authControllers.restrictTo('admin'), userControllers.deleteAllUsers);

router
  .route('/:id')
  .get(authControllers.interStudentProtection, userControllers.getOneUser)
  .patch(
    authControllers.interStudentProtection,
    userControllers.uploadAvatar,
    userControllers.resizeProfile,
    userControllers.updateUser
  )
  .delete(
    authControllers.restrictTo('admin', 'supervisor'),
    userControllers.deleteUser
  );

module.exports = router;
