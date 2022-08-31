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
    age: {
      type: Number,
      required: [true, 'A user must have an age.'],
      max: [99, 'A student cannot be older than 99 years old.']
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
    researchStage: {
      type: String,
      enum: ['literature review', 'project', 'thesis']
    },
    admission: {
      type: Number,
      validate: {
        // only going to run on create and save
        validator: function (inputYear) {
          return Date.parse(inputYear) <= Date.now();
        },
        message: 'Year of admission must be in the past.'
      }
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
  foreignField: 'studentID',
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

// TODO: use a document middleware to populate the field of supervisors according to the input on student creation
// the supervisor field can be persisted on creation as it doesnt grow over time

// QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  this.find({ accountStatus: { $ne: false } }).select('-__v');
  next();
});

userSchema.post(/^find/, function (doc) {
  // console.log(doc);
  if (doc.role === 'student') {
    doc.students = undefined;
  } else if (doc.role === 'supervisor') {
    doc.supervisors = undefined;
    doc.projects = undefined;
    doc.schedules = undefined;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
