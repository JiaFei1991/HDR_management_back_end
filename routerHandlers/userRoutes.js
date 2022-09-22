const express = require('express');
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');
const projectRouter = require('./projectRoutes');
const scheduleRouter = require('./scheduleRoutes');

const router = express.Router();

// router.route('/test').get(userControllers.test);

router
  .route('/signup')
  .post(
    userControllers.uploadMultipartForm,
    userControllers.resizeProfileCreate,
    userControllers.createSupervisor,
    userControllers.createUser
  );
router.route('/login').post(authControllers.login);
router.route('/logout').get(authControllers.logout);
router.route('/supervisors').get(userControllers.allSupervisorsName);
router.route('/students').get(userControllers.allStudentName);
router.route('/forgetPassword').post(authControllers.forgetPassword);
router
  .route('/updatePassword')
  .post(authControllers.routeProtection, authControllers.updatePassword);
router
  .route('/protectedUserCreation')
  .post(userControllers.createProtectedUser);
router.route('/:resetToken/resetPassword').post(authControllers.resetPassword);

// when a user id is present in a route followed by the 'project' keyword
// use the projectRouter, passing the user id using nested routes
router.use('/:userId/projects', projectRouter);
router.use('/:userId/schedules', scheduleRouter);

// access to all following routes require login
router.use(authControllers.routeProtection);
router
  .route('/')
  .get(
    authControllers.checkNestedRoute,
    authControllers.restrictTo('admin', 'supervisor'),
    authControllers.roleBasedQueryFilling,
    userControllers.getAllUsers
  )
  .delete(authControllers.restrictTo('admin'), userControllers.deleteAllUsers);

router
  .route('/:id')
  .get(authControllers.interStudentProtection, userControllers.getOneUser)
  .patch(
    authControllers.interStudentProtection,
    userControllers.uploadMultipartForm,
    userControllers.resizeProfileUpdate,
    userControllers.updateUser
  )
  .delete(
    authControllers.restrictTo('admin', 'supervisor'),
    userControllers.deleteUser
  );

module.exports = router;
