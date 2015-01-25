'use strict';

var opbeat = require('./opbeat');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

module.exports = function (job, result) {
  var body = 'The following URL have changed:\n' +
    result.url + '\n\n' +
    'Old timestamp: ' + result.old.when.toISOString() + '\n' +
    'New timestamp: ' + result.new.when.toISOString();

  job.notify.forEach(function (email) {
    sendgrid.send({
      to: email,
      from: process.env.SENDGRID_FROM || email,
      subject: 'Update to watched page',
      text: body,
      files: [
        { filename: 'old.html', contentType: 'text/html', content: result.old.data },
        { filename: 'new.html', contentType: 'text/html', content: result.new.data }
      ]
    }, function (err, json) {
      if (err) return opbeat.captureError(err);
      if (json.message !== 'success') return opbeat.captureError(new Error('Unexpected SendGrid response'), { extra: json });
      console.log('Sent notification to', email);
    });
  });
};
