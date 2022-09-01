const catchAsync = require('../util/catchAsync');
const ErrorGenerator = require('../util/errorGenerator');
const APIFeatures = require('../util/APIFeatures');

const returnObjConstruction = (dataObj) => {
  const returnObj = {
    status: 'success',
    data: dataObj
  };

  return returnObj;
};

const populateOptions = (Model, req) => {
  let option;
  switch (Model.modelName) {
    case 'Session':
      option = [{ path: 'tickets' }];
      break;
    case 'User':
      option = [
        { path: 'supervisors' },
        { path: 'students' },
        { path: 'projects' },
        { path: 'schedules' }
      ];
      break;
    case 'Project':
      option = [{ path: 'schedules' }, { path: 'sessions' }];
      break;
    default:
      option = '';
      break;
  }
  return option;
};

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // let filterObj = {};
    // if (req.params.userId) filterObj = { studentID: req.params.userId };
    // if (req.params.projectId) filterObj = { projectID: req.params.projectId };

    const queryFeatures = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const allEntries = await queryFeatures.query;

    const dataObj = {};
    dataObj[Model.collection.name] = allEntries;
    res.status(200).json(returnObjConstruction(dataObj));
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const populateFilter = populateOptions(Model, req);
    const newEntry = await Model.findById(req.params.id).populate(
      populateFilter
    );

    if (!newEntry) {
      return next(
        new ErrorGenerator(`no entry found under id: ${req.params.id}`, 404)
      );
    }

    const dataObj = {};
    dataObj[Model.collection.name] = newEntry;
    res.status(200).json(returnObjConstruction(dataObj));
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const updatedEntry = await Model.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true
      }
    );

    if (!updatedEntry) {
      return next(
        new ErrorGenerator(
          `Could not find entry with the id: ${req.params.id}`,
          404
        )
      );
    }

    const dataObj = {};
    dataObj[Model.collection.name] = updatedEntry;
    res.status(200).json(returnObjConstruction(dataObj));
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let deletedEntry;
    // set softDelete to true and accountStatus to false in order to soft delete an account
    if (req.body.softDelete) {
      deletedEntry = await Model.findOneAndUpdate(req.params.id, req.body, {
        new: true
      });
    } else {
      deletedEntry = await Model.findByIdAndDelete(req.params.id);
    }

    if (!deletedEntry) {
      return next(
        new ErrorGenerator(
          `Could not find student with the id: ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  });

exports.deleteAll = (Model) => async (req, res, next) => {
  await Model.deleteMany();

  res.status(200).json({
    status: 'success',
    data: {
      data: null
    }
  });
};

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newEntry = await Model.create(req.body);

    const dataObj = {};
    dataObj[Model.collection.name] = newEntry;

    res.status(200).json({
      status: 'success',
      data: dataObj
    });
  });
