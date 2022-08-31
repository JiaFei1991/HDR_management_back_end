const mongoose = require('mongoose');

const scheduleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      require: [true, 'A schedule must have a title.'],
      maxlength: [50, 'Description must not exceeds 50 words.']
    },
    description: {
      type: String,
      maxlength: [200, 'Description must not exceeds 200 words.']
    },
    startDate: {
      type: Date,
      require: [true, 'A schedule must have a start date.']
    },
    endDate: {
      type: Date,
      require: [true, 'A schedule must have a end date.']
    },
    projectID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      require: [true, 'A schedule must blongs to a project.']
    },
    studentID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'A schedule must blongs to a student.']
    },
    // a non-required field, when provided, user will receive an email
    // alarting them about the schedule before x mins of its start
    alarm: {
      type: Number
    },
    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
