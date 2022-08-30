const Project = require('../models/projectModel');
const controllerFnGenerator = require('./controllerFnGenerator');
const authControllers = require('./authControllers');

// set the user id from nested routes, this means that a user does not need to provide
// id in the get operation, the backend will grab that info from the nested route
// TODO: how to do post operation with nested routes??
exports.setUserId = (req, res, next) => {
  if (!req.body.userId) req.body.userId = req.params.userId;
  next();
};

exports.getAllProjects = controllerFnGenerator.getAll(Project);
exports.getOneProject = controllerFnGenerator.getOne(Project);
exports.createProject = controllerFnGenerator.createOne(Project);
exports.updateProject = controllerFnGenerator.updateOne(Project);
exports.deleteOneProject = controllerFnGenerator.deleteOne(Project);
exports.deleteAllProject = controllerFnGenerator.deleteAll(Project);

exports.interAccessProtection = authControllers.interAccessProtection(Project);
