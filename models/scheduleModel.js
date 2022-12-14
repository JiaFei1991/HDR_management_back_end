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
    startTime: {
      type: Date,
      require: [true, 'A schedule must have a start date.']
    },
    endTime: {
      type: Date,
      require: [true, 'A schedule must have a end date.']
    },
    repeat: {
      type: String,
      enum: ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly']
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    allday: {
      type: Boolean,
      require: [true, 'A schedule is either an all day event or not.']
    },
    eventDate: {
      type: String,
      require: [true, 'Event is missing its date.']
    },
    eventLengthInMin: {
      type: Number,
      require: [true, 'Event has to have a duration in mins.']
    },
    location: {
      type: String
    },
    participants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: undefined
      }
    ],
    // projectID: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'Project',
    //   require: [true, 'A schedule must blongs to a project.']
    // },
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'A schedule must blongs to a user.']
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

// QUERY MIDDLEWARE
// scheduleSchema.post(/^find/, async function (doc, next) {
//   console.log(doc);
//   let allday = false;
//   doc.forEach((element) => {
//     if (element.allday === true) {
//       allday = true;
//       return;
//     }
//   });

//   doc = { allday, data: doc };
//   // const result = await doc.find({ allday: { $ne: false } });
//   // console.log(result);
//   next();
// });

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
