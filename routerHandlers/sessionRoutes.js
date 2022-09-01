const express = require('express');
const sessionControllers = require('../controllers/sessionControllers');
const authControllers = require('../controllers/authControllers');
const ticketRouter = require('./ticketRoutes');

const router = express.Router({ mergeParams: true });

router.use(authControllers.routeProtection);

// if nested route is used, a single student is getting all tickets that belongs to him
// if nested route is not used, getAllTickets retrive all tickets only when the role is either admin or supervisor
router.use('/:sessionId/tickets', ticketRouter);

router
  .route('/')
  .get(
    authControllers.checkNestedRoute,
    authControllers.restrictTo('admin', 'supervisor'),
    authControllers.nestedRouteParamFilling,
    sessionControllers.getAllSessions
  )
  .post(sessionControllers.createSession)
  .delete(
    authControllers.restrictTo('admin', 'supervisor'),
    sessionControllers.deleteAllSession
  );

// a student cannot access sessions or tickets that is not his/hers
router.use(sessionControllers.interAccessProtection);

router
  .route('/:id')
  .get(sessionControllers.getOneSession)
  .patch(sessionControllers.updateSession)
  .delete(sessionControllers.deleteOneSession);

module.exports = router;
