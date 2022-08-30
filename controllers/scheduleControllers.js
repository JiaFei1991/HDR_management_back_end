const Schedule = require('../models/scheduleModel');
const controllerFnGenerator = require('./controllerFnGenerator');
const authControllers = require('./authControllers');

// set the user id from nested routes, this means that a user does not need to provide
// id in the get operation, the backend will grab that info from the nested route
// TODO: how to do post operation with nested routes??
exports.setUserId = (req, res, next) => {
  if (!req.body.userId) req.body.userId = req.params.userId;
  next();
};

exports.getAllSchedules = controllerFnGenerator.getAll(Schedule);
exports.getOneSchedule = controllerFnGenerator.getOne(Schedule);
exports.createSchedule = controllerFnGenerator.createOne(Schedule);
exports.updateSchedule = controllerFnGenerator.updateOne(Schedule);
exports.deleteOneSchedule = controllerFnGenerator.deleteOne(Schedule);
exports.deleteAllSchedule = controllerFnGenerator.deleteAll(Schedule);

exports.interAccessProtection = authControllers.interAccessProtection(Schedule);
