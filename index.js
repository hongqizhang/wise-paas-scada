'use strict';

const datastore = require('./api/datastore.js');
const deviceManager = require('./api/device-manager.js');
const waamqp = require('./communication/waamqp.js');

module.exports.datastore = datastore;
module.exports.deviceManager = deviceManager;
module.exports.waamqp = waamqp;
