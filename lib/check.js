'use strict';

var crypto = require('crypto');
var request = require('request');
var cheerio = require('cheerio');
var db = require('./db');

var fingerprint = function (data) {
  var shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};

module.exports = function (url, query, cb) {
  console.log('Fetching:', url);
  request(url, function (err, res, html) {
    if (err) return cb(err);

    var $ = cheerio.load(html);
    var content = $(query).html();
    if (typeof content !== 'string') return cb(new Error('Could not extract content from html'));
    content = new Buffer(content);
    var hash = fingerprint(content);

    db.log.find({ url: url }).sort({ when: -1 }).limit(1, function (err, docs) {
      if (err) return cb(err);
      var old = docs.length ? docs[0] : { html: { buffer: new Buffer('') }, content: { buffer: new Buffer('') } };
      if (hash === fingerprint(old.content.buffer)) return cb();
      console.log('Detected change:', url);
      db.log.insert({ url: url, hash: hash, when: new Date(), html: new Buffer(html), content: content }, function (err) {
        cb(err, old.html.buffer.toString(), html);
      });
    });
  });
};
