const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A ticket must have a title.'],
      maxlength: [100, 'A name must have less than 100 characters.']
    },
    content: {
      type: String,
      required: [true, 'A ticket must have content.'],
      maxlength: [5000, 'A name must have less than 5000 characters.']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    sessionID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Session',
      required: [true, 'A ticket must belong to a session.']
    },
    studentID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A ticket must belong to a student.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// DOCUMENT MIDDLEWARES

// QUERY MIDDLEWARES
ticketSchema.pre(/^find/, async function (next) {
  this.find().select('-__v');
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
