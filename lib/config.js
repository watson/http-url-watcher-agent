'use strict';

var db = require('./db');

module.exports = function (cb) {
  console.log('Loading config...');
  db.config.find(function (err, docs) {
    if (err) return cb(err);
    if (!docs.length) return cb(new Error('No config found! Please create a single MongoDB document in the config collection'));
    cb(null, docs[0]);
  });
};
