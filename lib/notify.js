'use strict';

var opbeat = require('./opbeat');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

module.exports = function (config, url, a, b) {
  config.notify.forEach(function (email) {
    sendgrid.send({
      to: email,
      from: config.from,
      subject: 'Update to watched page',
      text: 'The following URL have changed:\n' + url,
      files: [
        { filename: 'old.html', contentType: 'text/html', content: a },
        { filename: 'new.html', contentType: 'text/html', content: b }
      ]
    }, function (err, json) {
      if (err) return opbeat.captureError(err);
      if (json.message !== 'success') return opbeat.captureError(new Error('Unexpected SendGrid response'), { extra: json });
      console.log('Sent notification to', email);
    });
  });
};
