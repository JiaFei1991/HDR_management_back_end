const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const utility = require('util');
const crypto = require('crypto');

const emailer = require('../util/emailer');
const User = require('../models/userModel');
const catchAsync = require('../util/catchAsync');
const ErrorGenerator = require('../util/errorGenerator');
const templateFilling = require('../util/templateFilling');

const jwtTokenCreation = (res, user, justJwt) => {
  // issue the jwt token to user and store it as secured cookie
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPRIRESIN
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  let refreshToken;
  if (!justJwt) {
    refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFERSH_SECRET, {
      expiresIn: process.env.JWT_REFERSH_EXPRIRESIN
    });
    res.cookie('jwtRefresh', refreshToken, cookieOptions);
  }
};

const eraseToken = (res) => {
  res.cookie('jwt', undefined);
  res.cookie('jwtRefresh', undefined);
};

exports.logout = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorGenerator('User is not logged in.', 401));
  }

  eraseToken(res);
  res.status(200).json({
    status: 'success',
    message: 'User has been logged out.'
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // 1)check if both email and password are provided in the request
  if (!req.body.email || !req.body.password) {
    return new ErrorGenerator('must provide both email and password', 400);
  }
  // 2) check if the user exist
  const user = await User.findOne({ email: req.body.email }).select(
    '+password'
  );
  if (!user) {
    return next(new ErrorGenerator('the user does not exists', 404));
  }
  // 3) check if the password match
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ErrorGenerator('the password is incorrect', 400));
  }
  // 4) remove password in the response
  user.password = undefined;
  // 5) create and send token
  jwtTokenCreation(res, user, false);
  res.status(200).json({
    status: 'success',
    user: user
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) find the user using the supplied email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorGenerator('No user under the supplied email', 404));
  }
  // 2) create the password reset token
  const resetToken = crypto.randomBytes(30).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const expireTime = Date.now() + 10 * 60 * 1000; // expires in 10 mins
  // 3) update the user's document with the plain reset token and expiration time
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expireTime;
  await user.save({ validateBeforeSave: false });
  // 4) create reset URL and embed it in html for reply.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/HDRapi/v1/users/${resetToken}/resetPassword`;

  const replyHtml =
    '<div>' +
    '<h2>Password Reset</h2>' +
    `<form action="${resetURL}" method="POST">` +
    '<label for="password">New password:</label><br>' +
    '<input name="password" type="password" id="password"><br>' +
    '<label for="passwordConfirm">Confirm password:</label><br>' +
    '<input name="passwordConfirm" type="password" id="passwordConfirm"><br><br>' +
    '<input type="submit" value="Submit">' +
    '</form>' +
    '<p>Enter a new password and password confirm to reset your password.</p>' +
    '</div>';
  // 5) send the email
  // NOTE: the destination email is suppose to be users, change it before going to prod
  const emailOptions = {
    destination: 'feijiajidangao@gmail.com',
    subject: 'Password reset (valid for 10 mins)',
    text: `This is the reset URL:${resetURL}`,
    replyHtml: replyHtml,
    debug: true,
    successMessage: 'Token sent to email!',
    user: user,
    appOrMailbox: 'app'
  };

  await emailer.sendEmail(res, next, emailOptions);
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) hash the reset token and find the user
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({ passwordResetToken: hashedToken });
  if (!user) {
    res
      .status(404)
      .send(templateFilling.fill('No user possess this reset token.'));
    return;
  }
  // 2) check if the token has expired
  if (Date.now() > user.passwordResetExpires) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res
      .status(401)
      .send(
        templateFilling.fill('The reset token has expired, please try again.')
      );
    return;
  }
  // 3) set new password and save document, the document middleware will encrypt the new password automatically
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res
    .status(200)
    .send(
      templateFilling.fill(
        'You have successfully changed the password, login again!'
      )
    );
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) check the required fields
  if (
    !req.body.originalPassword ||
    !req.body.password ||
    !req.body.passwordConfirm
  ) {
    return new ErrorGenerator(
      'must provide both original password, the new password, and the new password confirm.',
      400
    );
  }
  // 2) check if the user exist
  const user = await User.findOne({ _id: req.user._id }).select('+password');
  if (!user) {
    return next(new ErrorGenerator('the user does not exists', 404));
  }
  // 3) check if the password match
  if (!(await bcrypt.compare(req.body.originalPassword, user.password))) {
    return next(new ErrorGenerator('the original password is incorrect', 400));
  }
  // 4) update the password if all checked out
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.save();
  eraseToken(res);

  res.status(200).json({
    status: 'success',
    user: user,
    message: 'please log in again!'
  });
});

exports.routeProtection = catchAsync(async (req, res, next) => {
  // 1) extract token from the request header under 'authorization', the format is 'Bearer token'
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token || token === 'undefined') {
    return next(new ErrorGenerator('The user is not logged in', 401));
  }
  // 2) verify token
  let decodedPayload;
  try {
    decodedPayload = await utility.promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
  } catch (err) {
    // issue a new jwt token when the old one has expired
    if (err.message === 'jwt expired') {
      // check the validity of the refresh token
      const refreshToken = req.headers.refreshToken.split(' ')[1];
      decodedPayload = await utility.promisify(jwt.verify)(
        refreshToken,
        process.env.JWT_REFERSH_SECRET
      );
      const user = await User.findById(decodedPayload.id);
      if (!user)
        return next(
          new ErrorGenerator('The user logged in no longer exists', 404)
        );
      // only create the jwt token without the refresh token
      jwtTokenCreation(res, user, true);
    }
  }
  // 3) check if the user still exists after successful verification
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(new ErrorGenerator('The user logged in no longer exists', 404));
  }
  // 4) check if the user has changed password after login
  if (currentUser.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (changedTimeStamp > decodedPayload.iat) {
      return next(
        new ErrorGenerator('The password has been changed since login', 404)
      );
    }
  }
  // 5) go to the next middleware if verification is successful,
  // pass the authorized user info to the next middleware/controller
  req.user = currentUser;
  next();
});

exports.checkNestedRoute = (req, res, next) => {
  // in case of no nested route
  if (!req.params.userId) {
    req.isNestedRoute = false;
  } else {
    req.isNestedRoute = true;
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role) && !req.isNestedRoute) {
      return next(
        new ErrorGenerator('Your role does not have access to this route.', 401)
      );
    }
    next();
  };

exports.interStudentProtection = (req, res, next) => {
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    return next(
      new ErrorGenerator('You cannot access other students profile.', 403)
    );
  }
  next();
};

exports.interAccessProtection = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.user.role === 'student') {
      // need to first retrive the user using the session/ticket id in query param
      const item = await Model.findById(req.params.id);
      if (!item) {
        return next(
          new ErrorGenerator('No item matches the id in query.', 400)
        );
      }
      if (req.user._id !== item.studentID) {
        return next(
          new ErrorGenerator('You cannot access other students ticket.', 403)
        );
      }
    }
    next();
  });

exports.roleBasedQueryFilling = (req, res, next) => {
  if (req.user.role === 'supervisor') {
    req.query = { ...req.query, role: 'student' };
  }
  next();
};

exports.nestedRouteParamFilling = (req, res, next) => {
  if (req.params.userId)
    req.query = { ...req.query, studentID: req.params.userId };
  if (req.params.projectId)
    req.query = { ...req.query, projectID: req.params.projectId };
  if (req.params.sessionId)
    req.query = { ...req.query, sessionID: req.params.sessionId };
  next();
};
