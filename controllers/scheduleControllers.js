const Schedule = require('../models/scheduleModel');
const controllerFnGenerator = require('./controllerFnGenerator');
const authControllers = require('./authControllers');
const catchAsync = require('../util/catchAsync');

function getFirstAndLastDay(month, year) {
  const date = new Date(Number(year), Number(month) - 1);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    .toLocaleString()
    .split(',')[0]
    .split('/');
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toLocaleString()
    .split(',')[0]
    .split('/');
  return [firstDay, lastDay];
}

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
    const doc = await Schedule.find({
      $or: [
        {
          userID: req.params.userId,
          eventDate: req.params.id
        },
        {
          participants: req.params.userId,
          eventDate: req.params.id
        }
      ]
    });

    // console.log(req.params.id);

    let allday = false;
    doc.forEach((element) => {
      if (element.allday === true) {
        allday = true;
      }
    });

    const result = { allday, data: doc };

    res.status(200).json({
      status: 'success',
      data: result
    });
    return;
  }

  next();
});

// setup route that check which day has schedules in a month
exports.getScheduleNotificationsFromOneMonth = catchAsync(
  async (req, res, next) => {
    if (req.isNestedRoute && req.params.id.split('-').length === 2) {
      const [month, year] = req.params.id.split('-');
      const [first, last] = getFirstAndLastDay(month, year);

      const [firstDay, firstMonth, firstYear] = first;
      const [lastDay, lastMonth, lastYear] = last;

      //       const doc = await Schedule.find({
      //         $or: [
      //           {
      //             userID: req.params.userId,
      //             eventDate: {
      //               $gte: `${firstDay}-${firstMonth}-${firstYear}`,
      //               $lte: `${lastDay}-${lastMonth}-${lastYear}`
      //             }
      //           },
      //           {
      //             participants: req.params.userId,
      //             eventDate: {
      //               $gte: `${firstDay}-${firstMonth}-${firstYear}`,
      //               $lte: `${lastDay}-${lastMonth}-${lastYear}`
      //             }
      //           }
      //         ]
      //       }).select('eventDate -_id');

      const doc = await Schedule.find({
        userID: req.params.userId,
        eventDate: {
          $gte: `${firstDay}-${firstMonth}-${firstYear}`,
          $lte: `${lastDay}-${lastMonth}-${lastYear}`
        }
      }).select('eventDate -_id');

      let dates = [];
      doc.forEach((element) => {
        dates.push(element.eventDate);
      });

      dates = [...new Set(dates)];

      res.status(200).json({
        status: 'success',
        data: dates
      });

      return;
    }
    next();
  }
);

function getRepeatingDatesInEventObj(start, end, frequency, dataObj) {
  let date = new Date(start);
  const endDate = new Date(end);

  const resultObjArray = [];
  while (date <= endDate) {
    resultObjArray.push({
      ...dataObj,
      eventDate: date
        .toLocaleDateString('en-au', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        })
        .split('/')
        .join('-'),
      //TODO: need to set the date of start and end time of a event to the eventDate, then while search for the notifications, compare start and end date with date in startTime.
      startTime: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        dataObj.startTime.getHours(),
        dataObj.startTime.getMinutes()
      ),
      endTime: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        dataObj.endTime.getHours(),
        dataObj.endTime.getMinutes()
      )
    });
    date = new Date(date);
    switch (frequency) {
      case 'Daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'Weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'Monthly':
        // date.setMonth(date.getMonth() + 1);
        date.setTime(
          new Date(date.getFullYear(), date.getMonth() + 2, 0).getTime()
        );
        break;
      case 'Yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        break;
    }
  }
  return resultObjArray;
}

exports.createRepeatingEvents = catchAsync(async (req, res, next) => {
  if (req.body.repeat === 'None') return;

  const resultObjArray = getRepeatingDatesInEventObj(
    req.body.startDate,
    req.body.endDate,
    req.body.repeat,
    req.body
  );
  resultObjArray.shift();

  // console.log(resultObjArray);

  const newEntry = await Schedule.create(resultObjArray);
  if (newEntry) {
    console.log('reached create repeate events!');
  }
});
