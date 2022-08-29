const express = require('express');
const ticketControllers = require('../controllers/ticketControllers');
const authControllers = require('../controllers/authControllers');

const router = express.Router({ mergeParams: true });

router.use(authControllers.routeProtection);

// if nested route is used, a single student is getting all tickets that belongs to him
// if nested route is not used, getAllTickets retrive all tickets only when the role is either admin or supervisor

router
  .route('/')
  .get(
    authControllers.checkNestedRoute,
    authControllers.restrictTo('admin', 'supervisor'),
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
