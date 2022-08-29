const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema(
  {
    topic: {
      type: String,
      require: [true, 'A session must have a topic']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    studentID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'A session must blongs to a student.']
    },
    supervisorID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'A session must blongs to a supervisor.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual populate for parent referencing
sessionSchema.virtual('tickets', {
  ref: 'Ticket',
  foreignField: 'sessionID',
  localField: '_id'
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
