'use strict';

const datastore = require('./api/datastore');
const deviceManager = require('./api/device-manager');
const waamqp = require('./communication/waamqp');
const wamqtt = require('./communication/wamqtt');
const waTopics = require('./common/watopics');

const constant = require('./common/const');

// constant
module.exports.const = constant;

module.exports.datastore = datastore;
module.exports.deviceManager = deviceManager;
module.exports.waamqp = waamqp;
module.exports.wamqtt = wamqtt;
module.exports.amqpTopics = waTopics.amqpTopics;
module.exports.mqttTopics = waTopics.mqttTopics;
