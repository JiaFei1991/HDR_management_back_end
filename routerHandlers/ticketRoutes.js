const express = require('express');
const ticketControllers = require('../controllers/ticketControllers');
const authControllers = require('../controllers/authControllers');

const router = express.Router({ mergeParams: true });

router.use(authControllers.routeProtection);

router
  .route('/')
  .get(
    authControllers.checkNestedRoute,
    authControllers.restrictTo('admin', 'supervisor'),
    authControllers.nestedRouteParamFilling,
    ticketControllers.getAllTickets
  )
  // TODO: investigate nested route for creating ticket
  .post(ticketControllers.createTicket)
  .delete(
    authControllers.restrictTo('admin', 'supervisor'),
    ticketControllers.deleteAllTicket
  );

// a student cannot access sessions or tickets that is not his/hers
router.use(ticketControllers.interAccessProtection);

router
  .route('/:id')
  .get(ticketControllers.getOneTicket)
  .patch(ticketControllers.updateTicket)
  .delete(ticketControllers.deleteOneTicket);

module.exports = router;
