const Schedule = require('../models/scheduleModel');
const controllerFnGenerator = require('./controllerFnGenerator');
const authControllers = require('./authControllers');
const catchAsync = require('../util/catchAsync');

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

exports.getSchedulesFromOneDay = catchAsync(async (req, res, next) => {
  if (req.isNestedRoute && req.params.id.split('-').length === 3) {
    // console.log(req.params);
    const result = await Schedule.find({
      userID: req.params.userId,
      eventDate: req.params.id
    });

    // console.log(result);

    res.status(200).json({
      status: 'success',
      data: {
        data: result
      }
    });
    return;
  }

  next();
});
