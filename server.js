'use strict';

var opbeat = require('./lib/opbeat');
var jobModel = require('./lib/job');
var check = require('./lib/check');
var notify = require('./lib/notify');

var run = function (cb) {
  jobModel.loadDueJobs(function (err, jobs) {
    if (err) {
      opbeat.captureError(err);
      cb();
      return;
    }
    if (!jobs.length) {
      console.log('No due jobs found!');
      cb();
      return;
    }

    var callbacks = jobs.length;
    jobs.forEach(function (job) {
      jobModel.queueJob(job, function (err) {
        if (err) opbeat.captureError(err);
      });

      check(job.url, job.query, function (err, result) {
        if (err) opbeat.captureError(err, { extra: { url: job.url, query: job.query } });
        if (result) notify(job, result);
        if (!--callbacks) cb();
      });
    });
  });
};

(function agent () {
  run(function () {
    setTimeout(agent, 1000*60);
  });
})();
