'use strict';

var opbeat = require('./lib/opbeat');
var config = require('./lib/config');
var check = require('./lib/check');
var notify = require('./lib/notify');

var run = function (cb) {
  config(function (err, config) {
    if (err) {
      opbeat.captureError(err);
      cb();
      return;
    }

    var callbacks = config.sites.length;
    config.sites.forEach(function (site) {
      check(site.url, site.query, function (err, result) {
        if (err) opbeat.captureError(err, { extra: { url: site.url, query: site.query } });
        if (result) notify(config, result);
        if (!--callbacks) cb();
      });
    });
  });
};

(function agent () {
  run(function () {
    console.log('Hibernating for 10 minutes...');
    setTimeout(agent, 1000*60*10);
  });
})();
