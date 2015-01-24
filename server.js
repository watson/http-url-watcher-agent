var opbeat = require('opbeat')({ active: process.env.NODE_ENV === 'production' });
var crypto = require('crypto');
var request = require('request');
var mongojs = require('mongojs');
var cheerio = require('cheerio');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var db = mongojs(process.env.MONGO_URI || 'localhost/website-watcher', ['config', 'log']);
db.log.ensureIndex({ url: 1, hash: 1 });

var notify = function (config, url, a, b) {
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

var loadConfig = function (cb) {
  console.log('Loading config...');
  db.config.find(function (err, docs) {
    if (err) return cb(err);
    if (!docs.length) return cb(new Error('No config found! Please create a single MongoDB document in the config collection'));
    cb(null, docs[0]);
  });
};

var fingerprint = function (data) {
  var shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};

var checkUrl = function (url, query, cb) {
  console.log('Fetching:', url);
  request(url, function (err, res, html) {
    if (err) return cb(err);

    $ = cheerio.load(html);
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

var run = function (cb) {
  loadConfig(function (err, config) {
    if (err) {
      opbeat.captureError(err);
      cb();
      return;
    }

    var callbacks = config.sites.length;
    config.sites.forEach(function (site) {
      checkUrl(site.url, site.query, function (err, a, b) {
        if (err) opbeat.captureError(err, { extra: { url: site.url, query: site.query } });
        if (a || b) notify(config, site.url, a, b);
        if (!--callbacks) cb();
      });
    });
  });
};

var agent = function () {
  run(function () {
    console.log('Hibernating for 10 minutes...');
    setTimeout(agent, 1000*60*10);
  });
};

agent();
