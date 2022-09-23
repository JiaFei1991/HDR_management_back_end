const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const multer = require('multer');

const emailer = require('../util/emailer');
const User = require('../models/userModel');
const catchAsync = require('../util/catchAsync');
const ErrorGenerator = require('../util/errorGenerator');
const templateFilling = require('../util/templateFilling');
const controllerFnGenerator = require('./controllerFnGenerator');

exports.getAllUsers = controllerFnGenerator.getAll(User);
exports.getOneUser = controllerFnGenerator.getOne(User);
exports.createUser = controllerFnGenerator.createOne(User);
exports.updateUser = controllerFnGenerator.updateOne(User);
exports.deleteUser = controllerFnGenerator.deleteOne(User);
exports.deleteAllUsers = controllerFnGenerator.deleteAll(User);
exports.allStudentName = controllerFnGenerator.getAllNames(User, 'student');
exports.allSupervisorsName = controllerFnGenerator.getAllNames(
  User,
  'supervisor'
);

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ErrorGenerator('The uploaded file must be an image.', 400));
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadMultipartForm = upload.single('avatar');

exports.resizeProfileUpdate = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/profiles/${req.file.filename}`);

  next();
};

exports.resizeProfileCreate = (req, res, next) => {
  if (!req.file) return next();

  const newFileName = `create-${req.body.name}-${Date.now()}.jpeg`;
  req.file.filename = newFileName;
  req.body.avatar = newFileName;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/profiles/${req.file.filename}`);

  next();
};

exports.createSupervisor = catchAsync(async (req, res, next) => {
  if (!req.body.role) {
    return next(
      new ErrorGenerator('No role supplied to create new user.', 400)
    );
  }
  if (req.body.role === 'supervisor') {
    const creationURL = `${req.protocol}://${req.get(
      'host'
    )}/HDRapi/v1/users/protectedUserCreation`;

    const replyHtml =
      '<div>' +
      '<h2>Request to create supervisor account</h2>' +
      `<form action="${creationURL}" method="POST">` +
      '<label for="name">Name:</label><br>' +
      `<input name="name" type="text" id="name" value="${req.body.name}"><br>` +
      '<label for="DoB">DoB:</label><br>' +
      `<input name="DoB" type="text" id="DoB" value="${req.body.DoB}"><br>` +
      '<label for="email">Email:</label><br>' +
      `<input name="email" type="text" id="email" value="${req.body.email}"><br>` +
      '<label for="role">Role:</label><br>' +
      `<input name="role" type="text" id="role" value="${req.body.role}"><br>` +
      '<label for="students">Students:</label><br>' +
      `<input name="students" type="text" id="students" value="${req.body.students}"><br>` +
      '<label for="studentIds">StudentIds:</label><br>' +
      `<input name="studentIds" type="text" id="studentIds" value="${req.body.studentIds}"><br>` +
      '<label for="avatar">Avatar:</label><br>' +
      `<input name="avatar" type="text" id="avatar" value="${req.body.avatar}"><br>` +
      '<label for="adminEmail">Admin email:</label><br>' +
      `<input name="adminEmail" type="text" id="adminEmail"><br>` +
      '<label for="adminPassword">Admin password:</label><br>' +
      `<input name="adminPassword" type="password" id="adminPassword"><br><br>` +
      '<input type="submit" name="clickedButton" value="Accept">' +
      '<input type="submit" name="clickedButton" value="Reject">' +
      '</form>' +
      '<p>Click accept to create new account, reject to send an explanation.</p>' +
      '</div>';

    const emailOptions = {
      destination: 'feijiajidangao@gmail.com',
      subject: 'Account creation request',
      text: `This is the creation URL:${creationURL}`,
      replyHtml: replyHtml,
      debug: false,
      successMessage: 'Request has been send to an admin!'
    };
    // the execution will terminate after sending the email
    if (await emailer.sendEmail(res, next, emailOptions)) {
      res.status(200).json({
        status: 'success',
        data: 'Request has been send to an admin!'
      });
    }
    return;
  }
  // if the role is not supervisor, move on to the next middleware that creates student
  next();
});

exports.createProtectedUser = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  // if accepted, check the admin email and password to verify identity
  if (req.body.clickedButton === 'Accept') {
    if (!req.body.adminEmail || !req.body.adminPassword) {
      res
        .status(400)
        .set('Content-Type', 'text/html')
        .send(
          templateFilling.fill('must provide both admin email and password')
        );
      return;
    }
    const user = await User.findOne({ email: req.body.adminEmail }).select(
      '+password'
    );
    if (!user) {
      res
        .status(404)
        .set('Content-Type', 'text/html')
        .send(templateFilling.fill('the admin does not exists'));
      return;
    }
    if (user.role !== 'admin') {
      res
        .status(400)
        .set('Content-Type', 'text/html')
        .send(
          templateFilling.fill(
            'The email supplied does not belong to an admin.'
          )
        );
      return;
    }
    // 3) check if the password match
    if (!(await bcrypt.compare(req.body.adminPassword, user.password))) {
      res
        .status(400)
        .set('Content-Type', 'text/html')
        .send(templateFilling.fill('the password is incorrect'));
      return;
    }
    // pass the req.body with randomly generated password to User.create() if admin identity verification is successful
    const randomPassword = crypto.randomBytes(10).toString('hex');
    const body = {
      name: req.body.name,
      DoB: req.body.DoB,
      email: req.body.email,
      role: req.body.role,
      avatar: req.body.avatar,
      students: req.body.studentIds.split(','),
      password: randomPassword,
      passwordConfirm: randomPassword
    };
    const newSupervisor = await User.create(body);
    if (!newSupervisor) {
      res
        .status(400)
        .set('Content-Type', 'text/html')
        .send(templateFilling.fill('creation failed, try again.'));
      return;
    }
    // send an email to user with random password once account creation is successful
    const emailOptions = {
      // NOTE: destination: req.body.email,
      destination: 'feijiajidangao@gmail.com',
      subject: 'Successful account creation notice',
      text: `Your account is successfully created, use the following password to log in:${randomPassword}. You are encouraged to change the password immediately.`,
      debug: false,
      successMessage: 'Success notice has been send to the user!',
      appOrMailbox: 'mailbox'
    };
    // the execution will terminate after sending the email
    if (await emailer.sendEmail(res, next, emailOptions)) return;
  }
  // if rejected, send an email notifying the applicant
  if (req.body.clickedButton === 'Reject') {
    // delete profile picture
    const absolutePath = path.resolve('./public/profiles');
    const filenames = fs.readdirSync(`${absolutePath}`);
    filenames.forEach((filename) => {
      if (filename.startsWith(`create-${req.body.name}`)) {
        fs.unlink(`${absolutePath}/${filename}`, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('profile picture deleted!');
          }
        });
      }
    });
    const emailOptions = {
      // TODO: destination: req.body.email,
      destination: 'feijiajidangao@gmail.com',
      subject: 'Rejected account creation notice',
      text: `Your request to create a supervisor's account has been rejected by an admin.`,
      debug: false,
      successMessage: 'Reject notice has been send to the user!',
      appOrMailbox: 'mailbox'
    };
    // the execution will terminate after sending the email
    await emailer.sendEmail(res, next, emailOptions);
  }
});

// exports.test = catchAsync(async (req, res, next) => {
//   res
//     .status(200)
//     .set('Content-Type', 'text/html')
//     .send(templateFilling.fill('test message'));
// });
