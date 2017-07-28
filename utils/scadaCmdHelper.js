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
    let msg = { d: { Cmd: 'WV', Val: {} }, ts: new Date() };
    msg.d.Val[param.tagName] = param.value;
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
