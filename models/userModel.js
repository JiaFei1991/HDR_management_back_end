const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const emailValidator = require('validator');
const ErrorGenerator = require('../util/errorGenerator');

const userSchema = new mongoose.Schema(
  {
    // REQUIRED fields, all roles must have following fields
    name: {
      type: String,
      required: [true, 'A user must have a name.'],
      maxlength: [40, 'A name must have less than 40 characters.']
    },
    DoB: {
      type: Date
    },
    avatar: {
      type: String,
      default: 'default.jpg'
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [emailValidator.isEmail, 'please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'a password is required.'],
      minlength: [6, 'a password must be at least 6 characters long.'],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'must confirm password'],
      // TODO: need to handle validation error and send it back to user
      validate: {
        // only going to run on create and save
        validator: function (inputPassword) {
          return this.password === inputPassword;
        },
        message: 'Passwords do not match.'
      }
    },
    role: {
      type: String,
      enum: ['student', 'supervisor', 'admin'],
      require: [true, 'A role is required to create a user.']
    },
    // NON-REQUIRED fields
    // ----------- for students only -----------
    researchTopic: {
      type: String,
      maxlength: [1000, 'A name must have less than 1000 characters.']
    },
    researchStage: {
      type: String,
      enum: ['literature review', 'project', 'thesis']
    },
    MoA: {
      type: Date
    },
    supervisors: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: undefined
      }
    ],
    // ----------- for supervisor only -----------
    students: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: undefined
      }
    ],
    // ----------- for both -----------
    accountStatus: {
      type: Boolean,
      default: true,
      select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    slug: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// VIRTUAL PROPERTIES
// calculate age and length of study on request
userSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.DoB) / (1000 * 60 * 60 * 24 * 365));
});

userSchema.virtual('lengthOfStudy').get(function () {
  const lapsedTimeSec = (Date.now() - this.MoA) / 1000;

  const returnTime = {};
  const timeInSec = [60, 3600, 86400, 2592000, 31104000];
  const timeUnit = ['minutes', 'hours', 'days', 'months'];
  // check for middle cases
  for (let i = 0; i < timeInSec.length - 1; i += 1) {
    if (lapsedTimeSec > timeInSec[i] && lapsedTimeSec <= timeInSec[i + 1]) {
      returnTime.val = lapsedTimeSec / timeInSec[i];
      returnTime.unit = timeUnit[i];
      return returnTime;
    }
  }
  // check for begin and end case
  if (lapsedTimeSec > 31104000) {
    returnTime.val = lapsedTimeSec / 31104000;
    returnTime.unit = 'years';
  } else {
    returnTime.val = lapsedTimeSec;
    returnTime.unit = 'seconds';
  }

  return returnTime;
});

// VIRTUAL POPULATE for parent referencing
// project field is only available to students
// supervisors query a student first before seeing projects associated with him/her
userSchema.virtual('projects', {
  ref: 'Project',
  foreignField: 'studentID',
  localField: '_id'
});

// schedules are queried via students
userSchema.virtual('schedules', {
  ref: 'Schedule',
  foreignField: 'userID',
  localField: '_id'
});

// DOCUMENT MIDDLEWARES
// password encryption
userSchema.pre('save', async function (next) {
  // if the password is not modified, go to the next middleware
  if (!this.isModified('password')) {
    return next();
  }

  // otherwise, encrypt the password using bcrypt package and delete the passwordConfirm field
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  switch (this.role) {
    case 'student':
      this.students = undefined;
      break;
    case 'supervisor':
      this.researchStage = undefined;
      this.admission = undefined;
      this.supervisors = undefined;
      break;
    case 'admin':
      break;
    default:
      return next(new ErrorGenerator('Requested role does not exist.', 400));
  }

  next();
});

// change the name of profile pic to 'storage format' in the document
// post validate already contain the unique id for the document
userSchema.post('validate', function (doc, next) {
  if (!this.isNew) return next();

  const timeStamp = doc.avatar.split('-')[2];
  doc.avatar = `user-${doc._id}-${timeStamp}`;

  next();
});

// change the name of the actual file stored in public folder after saving the newly created document
userSchema.post('save', function (doc, next) {
  const absolutePath = path.resolve('./public/profiles');
  const filenames = fs.readdirSync(`${absolutePath}`);
  filenames.forEach((filename) => {
    if (filename.startsWith(`create-${doc.name}`)) {
      const timeStamp = filename.split('-')[2];
      fs.rename(
        `${absolutePath}/${filename}`,
        `${absolutePath}/user-${doc._id}-${timeStamp}`,
        (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('avatar file renamed!');
          }
        }
      );
    }
  });

  next();
});

// TODO: use a document middleware to populate the field of supervisors according to the input on student creation
// the supervisor field can be persisted on creation as it doesnt grow over time

// QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  this.find({ accountStatus: { $ne: false } }).select('-__v');
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
