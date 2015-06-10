'use strict';

var crypto = require('crypto');
var request = require('request');
var cheerio = require('cheerio');
var db = require('./db');

var fingerprint = function (data) {
  var shasum = crypto.createHash('sha1');
  shasum.update(data || '');
  return shasum.digest('hex');
};

var getExcerpt = function (data, query) {
  if (!data) return null;
  var $ = cheerio.load(data);
  var excerpt = $(query).html();
  if (typeof excerpt !== 'string') return null;
  return new Buffer(excerpt);
};

var getNewData = function (url, cb) {
  console.log('Fetching:', url);

  var opts = {
    url: url,
    headers: {
      'pragma': 'no-cache',
      'accept-language': 'en-US,en;q=0.8,da;q=0.6',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2421.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'cache-control': 'no-cache'
    }
  };

  request(opts, function (err, res, data) {
    if (err) return cb(err);
    if (res.statusCode >= 300) return cb(new Error('Unexpected HTTP status code: ' + res.statusCode));
    cb(null, new Buffer(data));
  });
};

var getOldData = function (url, cb) {
  db.log.find({ url: url }).sort({ when: -1 }).limit(1, function (err, docs) {
    if (err) return cb(err);
    if (!docs.length) return cb();
    cb(null, docs[0].data.buffer, docs[0].when);
  });
};

module.exports = function (url, query, cb) {
  getNewData(url, function (err, data) {
    if (err) return cb(err);
    getOldData(url, function (err, oldData, when) {
      if (err) return cb(err);
      if (query) {
        var excerpt = getExcerpt(data, query);
        var oldExcerpt = getExcerpt(oldData, query);
        if (!excerpt) {
          err = new Error('Could not get excerpt from new data');
          err.bodySize = data.length;
          cb(err);
          return;
        }
        if (oldData && !oldExcerpt) return cb(new Error('Could not get excerpt from old data'));
      }

      var hash = fingerprint(excerpt || data);
      var oldHash = fingerprint(oldExcerpt || oldData);
      if (hash === oldHash) return cb();

      console.log('Detected change:', url);
      var doc = { url: url, hash: hash, when: new Date(), data: data };
      db.log.insert(doc, function (err) {
        cb(err, {
          url: url,
          old: {
            data: (oldData || '').toString(),
            when: when || new Date(0)
          },
          new: {
            data: data.toString(),
            when: doc.when
          }
        });
      });
    });
  });
};
