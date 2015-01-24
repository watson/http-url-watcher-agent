'use strict';

var mongojs = require('mongojs');

var db = mongojs(process.env.MONGO_URI || 'localhost/website-watcher', ['config', 'log']);
db.log.ensureIndex({ url: 1, hash: 1 });

module.exports = db;

