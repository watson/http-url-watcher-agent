'use strict';

module.exports = require('opbeat')({ active: process.env.NODE_ENV === 'production' });
