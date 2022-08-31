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
    projectID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      require: [true, 'A session must blongs to a project.']
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
