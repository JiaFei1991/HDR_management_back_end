const express = require('express');
const projectControllers = require('../controllers/projectControllers');
const authControllers = require('../controllers/authControllers');
const sessionRouter = require('./sessionRoutes');
const scheduleRouter = require('./scheduleRoutes');

const router = express.Router({ mergeParams: true });

// user have to log in to access the following routes
router.use(authControllers.routeProtection);

// route to obtain all sessions that belongs to the same project
router.use('/:projectId/sessions', sessionRouter);
router.use('/:projectId/schedules', scheduleRouter);

// if nested route is used, a single student is getting all tickets that belongs to him
// if nested route is not used, getAllTickets retrive all tickets only when the role is either admin or supervisor

router
  .route('/')
  .get(
    authControllers.checkNestedRoute,
    authControllers.restrictTo('admin', 'supervisor'),
    authControllers.nestedRouteParamFilling,
    projectControllers.getAllProjects
  )
  .post(projectControllers.createProject)
  .delete(
    authControllers.restrictTo('admin', 'supervisor'),
    projectControllers.deleteAllProject
  );

// a student cannot access sessions or tickets that is not his/hers
router.use(projectControllers.interAccessProtection);

router
  .route('/:id')
  .get(projectControllers.getOneProject)
  .patch(projectControllers.updateProject)
  .delete(projectControllers.deleteOneProject);

module.exports = router;
