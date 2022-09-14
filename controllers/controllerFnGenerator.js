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

const populateOptions = (Model) => {
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

const filterObj = (body, ...fields) => {
  const bodyCopy = { ...body };
  fields.forEach((item, index) => {
    if (bodyCopy[item]) {
      delete bodyCopy[item];
    }
  });
  return bodyCopy;
};

const patchFieldCheck = (Model, req) => {
  let patchBody;
  switch (Model.modelName) {
    case 'Project':
      patchBody = filterObj(req.body, 'studentID', 'createdAt');
      break;
    case 'User':
      patchBody = filterObj(
        req.body,
        'email',
        'password',
        'passwordConfirm',
        'role',
        'accountStatus',
        'passwordChangedAt',
        'passwordResetToken',
        'passwordResetExpires',
        'slug'
      );
      break;
    case 'Schedule':
      patchBody = filterObj(req.body, 'studentID', 'projectID', 'createdAt');
      break;
    case 'Session':
      patchBody = filterObj(req.body, 'projectID', 'createdAt');
      break;
    case 'Ticket':
      patchBody = filterObj(req.body, 'studentID', 'sessionID', 'createdAt');
      break;
    default:
      patchBody = req.body;
      break;
  }
  return patchBody;
};

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
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
    const populateFilter = populateOptions(Model);
    const newEntry = await Model.findById({ _id: req.params.id }).populate(
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
    const patchBody = patchFieldCheck(Model, req);
    if (req.file) patchBody.avatar = req.file.filename;
    const updatedEntry = await Model.findOneAndUpdate(
      { _id: req.params.id },
      patchBody,
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
      deletedEntry = await Model.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        {
          new: true
        }
      );
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
