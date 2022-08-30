const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    abstract: {
      type: String,
      require: [true, 'A schedule must have a title.'],
      maxlength: [500, 'Description must not exceeds 500 words.']
    },
    progress: {
      type: String,
      enum: [
        'Design',
        'Results',
        'Drafts',
        'Submission',
        'Revision',
        'Complete'
      ]
    },
    studentID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'A schedule must blongs to a student.']
    },
    supervisorID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'A schedule must blongs to a supervisor.']
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

// virtual populate for parent referencing
projectSchema.virtual('schedules', {
  ref: 'Schedule',
  foreignField: 'projectID',
  localField: '_id'
});
// virtual field that calculates the length of project from creation
projectSchema.virtual('project length').get(function () {
  const lapsedTimeSec = (Date.now() - this.createdAt) / 1000;
  const returnTime = {};

  // in the range between 1 min to an hour
  if (lapsedTimeSec > 60 && lapsedTimeSec <= 3600) {
    returnTime.val = lapsedTimeSec / 60;
    returnTime.unit = 'minutes';
  }
  // in the range between 1 hour to a day
  else if (lapsedTimeSec > 3600 && lapsedTimeSec <= 86400) {
    returnTime.val = lapsedTimeSec / (60 * 60);
    returnTime.unit = 'hours';
  }
  // in the range between 1 day to a month
  else if (lapsedTimeSec > 86400 && lapsedTimeSec <= 2592000) {
    returnTime.val = lapsedTimeSec / (60 * 60 * 24);
    returnTime.unit = 'days';
  }
  // in the range between 1 month to a year
  else if (lapsedTimeSec > 2592000 && lapsedTimeSec <= 31104000) {
    returnTime.val = lapsedTimeSec / (60 * 60 * 24 * 30);
    returnTime.unit = 'months';
  }
  // in the range between a year
  else if (lapsedTimeSec > 31104000) {
    returnTime.val = lapsedTimeSec / (60 * 60 * 24 * 30 * 12);
    returnTime.unit = 'years';
  }
  // default return time in seconds
  else {
    returnTime.val = lapsedTimeSec;
    returnTime.unit = 'seconds';
  }

  return returnTime;
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
