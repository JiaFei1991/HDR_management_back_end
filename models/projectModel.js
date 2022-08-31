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
    // supervisorID: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'User',
    //   require: [true, 'A schedule must blongs to a supervisor.']
    // },
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

projectSchema.virtual('sessions', {
  ref: 'Session',
  foreignField: 'projectID',
  localField: '_id'
});

// virtual field that calculates the length of project from creation
projectSchema.virtual('project length').get(function () {
  const lapsedTimeSec = (Date.now() - this.createdAt) / 1000;

  const returnTime = {};
  const timeInSec = [60, 3600, 86400, 2592000, 31104000];
  const timeUnit = ['minutes', 'hours', 'days', 'months'];
  // check for middle cases
  for (let i = 0; i < timeInSec.length - 1; i++) {
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

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
