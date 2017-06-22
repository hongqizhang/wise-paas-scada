'use strict';

const datastore = require('./api/datastore.js');
const deviceManager = require('./api/device-manager.js');
const waamqp = require('./communication/waamqp.js');
const waTopics = require('./common/watopics.js');

module.exports.datastore = datastore;
module.exports.deviceManager = deviceManager;
module.exports.waamqp = waamqp;
module.exports.amqpTopics = waTopics.amqpTopics;
module.exports.mqttTopics = waTopics.mqttTopics;
