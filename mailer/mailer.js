const nodemailer = require('nodemailer');
var fs = require('fs');
var CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8').trim());


async function SendMail(to, subject, html) {

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport(CONFIG.MailConfig.Transporter);

  // setup email data with unicode symbols
  let mailOptions = {
      from: CONFIG.MailConfig.From, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    }
    console.log("TCL: SendMail -> info", info)
  });

}

module.exports = {
  SendMail
};