'use strict';

const datastore = require('./api/datastore.js');
const deviceManager = require('./api/device-manager.js');
const waamqp = require('./communication/waamqp.js');
const wamqtt = require('./communication/wamqtt.js');
const waTopics = require('./common/watopics.js');

const constant = require('./common/const');

// constant
module.exports.const = constant;

module.exports.datastore = datastore;
module.exports.deviceManager = deviceManager;
module.exports.waamqp = waamqp;
module.exports.wamqtt = wamqtt;
module.exports.amqpTopics = waTopics.amqpTopics;
module.exports.mqttTopics = waTopics.mqttTopics;
