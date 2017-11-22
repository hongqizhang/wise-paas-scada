'use strict';

const util = require('util');
const Promise = require('bluebird');

const wamqtt = require('../communication/wamqtt.js');
const watopics = require('../common/watopics.js');
const constant = require('../common/const.js');

const mqttTopics = watopics.mqttTopics;

function _writeTagValue (params, callback) {
  try {
    if (Array.isArray(params) === false) {
      params = [params];
    }

    Promise.mapSeries(params, (param, index) => {
      return new Promise((resolve, reject) => {
        let topic = util.format(mqttTopics.cmdTopic, param.scadaId);
        let value = param.value;
        if (param.hasOwnProperty('index') === true) {   // for array tag
          value = {};
          value[param.index] = param.value;
        }

        let msg = { d: { Cmd: 'WV', Val: {} }, ts: new Date() };
        msg.d.Val[param.tagName] = value;
        wamqtt.publish(topic, msg, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }).then(() => {
      callback(null);
    })
    .catch((err) => {
      callback(err);
    });
  } catch (ex) {
    return callback(ex.message);
  }
}

module.exports = {
  writeTagValue: _writeTagValue
};
