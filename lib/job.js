'use strict';

var db = require('./db');

exports.loadDueJobs = function (cb) {
  db.jobs.find({ $or: [{ due: { $exists: false } }, { due: { $lte: new Date() } }] }, cb);
};

exports.queueJob = function (job, cb) {
  var interval = Math.max(parseInt(job.interval, 10) || 60, 10);
  interval = Math.max(interval, 60) * 1000*60;
  var due = new Date(Date.now() + interval);
  db.jobs.update({ _id: job._id }, { $set: { due: due } }, cb);
};
