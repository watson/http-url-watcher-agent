'use strict';

var db = require('./db');

exports.loadDueJobs = function (cb) {
  db.jobs.find({ $or: [{ due: { $exists: false } }, { due: { $lte: new Date() } }] }, cb);
};

exports.queueJob = function (job, cb) {
  // ensure that the interval can never be less than 10 minutes, but default to
  // 1 hour if no specific interval is given
  var intervalMinutes = Math.max(job.interval || 60, 10);
  var due = new Date(Date.now() + intervalMinutes * 1000 * 60);
  db.jobs.update({ _id: job._id }, { $set: { due: due } }, cb);
};
