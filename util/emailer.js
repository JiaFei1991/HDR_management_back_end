const nodemailer = require('nodemailer');
const ErrorGenerator = require('./errorGenerator');
const templateFilling = require('./templateFilling');

exports.sendEmail = async (res, next, options) => {
  const messageEmail = {
    from: process.env.EMAIL_ADDRESS,
    to: options.destination,
    subject: options.subject,
    text: options.text,
    html: options.replyHtml
  };

  // create reusable transporter object using the default SMTP transport
  const transporterOptions = {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    secureConnection: false,
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnAuthorized: true
    }
  };
  if (options.debug) {
    transporterOptions.logger = true;
    transporterOptions.debug = true;
  }
  const transporter = nodemailer.createTransport(transporterOptions);
  // try send out email
  try {
    const info = await transporter.sendMail(messageEmail);
    console.log('Message sent: %s', info.messageId);

    if (options.appOrMailbox === 'app') {
      res.status(200).json({
        status: 'success',
        message: options.successMessage
      });
    }

    if (options.appOrMailbox === 'mailbox') {
      res.status(200).send(templateFilling.fill(options.successMessage));
    }

    return true;
    // in case of failure, erase both field and send error to user
  } catch (err) {
    console.log(err);

    if (options.user) {
      options.user.passwordResetToken = undefined;
      options.user.passwordResetExpires = undefined;
      await options.user.save({ validateBeforeSave: false });
    }

    return next(
      new ErrorGenerator(
        'There was an error sending the email. Try again later!'
      ),
      500
    );
  }
};
