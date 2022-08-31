const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const utility = require('util');

const User = require('../models/userModel');
const ErrorGenerator = require('../util/errorGenerator');
const catchAsync = require('../util/catchAsync');

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

exports.routeProtection = catchAsync(async (req, res, next) => {
  // 1) extract token from the request header under 'authorization', the format is 'Bearer token'
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
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
      const refreshToken = req.headers.refreshtoken.split(' ')[1];
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
      if (req.user._id !== item.studentID) {
        return next(
          new ErrorGenerator('You cannot access other students ticket.', 403)
        );
      }
    }
    next();
  });
