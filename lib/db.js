'use strict';

var mongojs = require('mongojs');

var db = mongojs(process.env.MONGO_URI || 'localhost/http-url-watcher-agent', ['config', 'log']);
db.log.ensureIndex({ url: 1, hash: 1 });

module.exports = db;

