var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "videostreamer60@gmail.com",
    pass: "myzftkwjjtigjkok",
  },
});

exports.sendResetCodeMail = (email, code, next) => {
  try {
    var mailOptions = {
      from: '<videostreamer60@gmail.com> "BARS"',
      to: email,
      subject: "Password Reset Request",
      text: "Your verification code is: " + code,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        //console.log(error);
        return false;
      } else {
        console.log("Email sent: " + info.response);
        return true;
      }
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
