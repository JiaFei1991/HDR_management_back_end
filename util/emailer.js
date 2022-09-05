const nodemailer = require('nodemailer');
const ErrorGenerator = require('../util/errorGenerator');

exports.sendEmail = async (res, next, options) => {
  const message = {
    from: 'jia_fei1991@hotmail.com',
    to: options.destination,
    subject: options.subject,
    text: options.text,
    html: options.replyHtml
  };

  // create reusable transporter object using the default SMTP transport
  let transporterOptions = {
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
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);

    // TODO: need to customize return message depending on whether the user is in mailbox or app
    res.status(200).json({
      status: 'success',
      message: options.successMessage
    });

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
