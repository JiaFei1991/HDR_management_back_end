const Ticket = require('../models/ticketModel');
const controllerFnGenerator = require('./controllerFnGenerator');
const authControllers = require('./authControllers');

// set the student id from nested routes, this means that a user does not need to provide
// id in the get operation, the backend will grab that info from the nested route
exports.setUserId = (req, res, next) => {
  if (!req.body.userId) req.body.userId = req.params.userId;
  next();
};

exports.getAllTickets = controllerFnGenerator.getAll(Ticket);
exports.getOneTicket = controllerFnGenerator.getOne(Ticket);
exports.createTicket = controllerFnGenerator.createOne(Ticket);
exports.updateTicket = controllerFnGenerator.updateOne(Ticket);
exports.deleteOneTicket = controllerFnGenerator.deleteOne(Ticket);
exports.deleteAllTicket = controllerFnGenerator.deleteAll(Ticket);

exports.interAccessProtection = authControllers.interAccessProtection(Ticket);
