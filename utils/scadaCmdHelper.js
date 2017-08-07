'use strict';

const util = require('util');
const wamqtt = require('../communication/wamqtt.js');
const watopics = require('../common/watopics.js');
const constant = require('../common/const.js');

const mqttTopics = watopics.mqttTopics;
const tenantId = constant.tenantId;

function _writeTagValue (param, callback) {
  try {
    let topic = util.format(mqttTopics.cmdTopic, tenantId, param.scadaId);
    let value = param.value;
    if (param.hasOwnProperty('index') === true) {   // for array tag
      value = {};
      value[param.index] = param.value;
    }

    let msg = { d: { Cmd: 'WV', Val: {} }, ts: new Date() };
    msg.d.Val[param.tagName] = value;
    wamqtt.publish(topic, msg, (err) => {
      if (err) {
        return callback(err);
      }
      return callback();
    });
  } catch (ex) {
    return callback(ex.message);
  }
}

module.exports = {
  writeTagValue: _writeTagValue
};
