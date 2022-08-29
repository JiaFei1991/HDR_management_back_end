const Session = require('../models/sessionModel');
const controllerFnGenerator = require('./controllerFnGenerator');
const authControllers = require('./authControllers');

// set the student id from nested routes, this means that a user does not need to provide
// id in the get operation, the backend will grab that info from the nested route
exports.setUserId = (req, res, next) => {
  if (!req.body.userId) req.body.userId = req.params.userId;
  next();
};

exports.getAllSessions = controllerFnGenerator.getAll(Session);
exports.getOneSession = controllerFnGenerator.getOne(Session);
exports.createSession = controllerFnGenerator.createOne(Session);
exports.updateSession = controllerFnGenerator.updateOne(Session);
exports.deleteOneSession = controllerFnGenerator.deleteOne(Session);
exports.deleteAllSession = controllerFnGenerator.deleteAll(Session);

exports.interAccessProtection = authControllers.interAccessProtection(Session);
