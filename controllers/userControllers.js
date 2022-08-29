const User = require('../models/userModel');
const controllerFnGenerator = require('./controllerFnGenerator');
// const ErrorGenerator = require('../util/errorGenerator');

exports.getAllUsers = controllerFnGenerator.getAll(User);
exports.getOneUser = controllerFnGenerator.getOne(User);
exports.createUser = controllerFnGenerator.createOne(User);
exports.updateUser = controllerFnGenerator.updateOne(User);
exports.deleteUser = controllerFnGenerator.deleteOne(User);
exports.deleteAllUsers = controllerFnGenerator.deleteAll(User);
