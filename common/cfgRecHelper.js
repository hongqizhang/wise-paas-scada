'use strict';
const util = require('util');
const merge = require('merge');

const wamqtt = require('../communication/wamqtt.js');
const watopics = require('../common/watopics.js');
const ConfigRecord = require('../models/config-record.js');

const mqttTopics = watopics.mqttTopics;

const cfgRecordBeforeKey = ['scadaDesc', 'deviceIP', 'devicePort', 'deviceDesc', 'tagDesc', 'dataLog', 'engUnit',
  'intDspFmt', 'fraDspFmt', 'spanHigh', 'spanLow', 'state0', 'state1', 'state2', 'state3', 'state4', 'state5', 'state6',
  'state7'];
const cfgRecordAfterKey = ['Desc', 'IP', 'Port', 'Desc', 'Desc', 'Log', 'EU', 'IDF', 'FDF', 'SH', 'SL', 'S0', 'S1', 'S2',
  'S3', 'S4', 'S5', 'S6', 'S7'];

function __findOrCreateConfigRecord (id, callback) {
  ConfigRecord.findOne({ _id: id }, (err, result) => {
    return result
      ? callback(err, result)
      : ConfigRecord.create({ _id: id }, (err, result) => {
        return callback(err, result);
      });
  });
}

function _addConfigRecord (id, record, callback) {
  // if device status not exists, create one.
  __findOrCreateConfigRecord(id, (err, result) => {
    if (err) {
      return callback(err);
    }
    ConfigRecord.findOneAndUpdate({ _id: id }, { $push: { records: { scada: record, ts: new Date() } } },
    { upsert: true }, (err, result) => {
      if (err) {
        return callback(err);
      }
      let response = { ok: (result !== null) };
      callback(null, response);
    });
  });
}

function _mergeModifiedConfigRecord (id, callback) {
  try {
    ConfigRecord.findById(id, { records: true }, (err, result) => {
      if (err) {
        return callback(err);
      }
      let mergedObj = {};
      if (result && result.records) {
        let records = [];
        for (let i = 0; i < result.records.length; i++) {
          records.push(result.records[i].scada);
          mergedObj = merge.recursive(true, mergedObj, result.records[i].scada);
        }
      }
      callback(null, mergedObj);
    });
  } catch (err) {
    callback(err);
  }
}

function __waitSyncAck (results, retryCount, callback) {
  setTimeout(() => {
    // console.log('wait...');
    let ok = true;
    let noRespList = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i].ok === false) {
        ok = false;
        noRespList.push(results[i].id);
      }
    }
    if (ok === true) {
      let response = { ok: true };
      return callback(null, response);
    } else {
      if (retryCount === 0) {
        let err = util.format('SCADA %s no response.', noRespList.join(','));
        return callback(err);
      } else {
        __waitSyncAck(results, retryCount - 1, callback);
      }
    }
  }, 1000);
}

function replacer (key, value) {
  if (typeof value === 'boolean') {
    return Number(value);
  }
  return value;
}

function _syncDeviceConfig (ids, callback) {
  try {
    let tenantId = 'general';
    let results = [];
    // subscribe cfgack topic for receiving ack from scada
    let subTopic = util.format(mqttTopics.cfgackTopic, tenantId, '+');
    wamqtt.subscribe(subTopic);
    wamqtt.events.on('message', (topic, message) => {
      let ack = JSON.parse(message.content.toString());
      if (ack.hasOwnProperty('d') === false) {
        return console.error('format is wrong ! ' + message.content.toString());
      }
      let d = ack.d;
      if (d.hasOwnProperty('Cfg') && d.Cfg === 0) {
        let result = results.find(o => o.id === message.scadaId);
        if (result) {
          result.ok = true;
        }
      }
    });
    for (let i = 0; i < ids.length; i++) {
      let scadaId = ids[i];
      let result = { id: ids[i], ok: false };
      results.push(result);

      _mergeModifiedConfigRecord(ids[i], (err, result) => {
        if (err) {
          return console.error(err);
        }
        let cmdObj = { d: { Cmd: 'WC', Action: 2, TenantID: tenantId, Scada: result }, ts: new Date() };
        let msg = JSON.stringify(cmdObj, replacer);
        for (let i = 0; i < cfgRecordBeforeKey.length; i++) {
          var regex = new RegExp(cfgRecordBeforeKey[i], 'g');
          msg = msg.replace(regex, cfgRecordAfterKey[i]);
        }

        let pubTopic = util.format(mqttTopics.cmdTopic, tenantId, scadaId);
        wamqtt.publish(pubTopic, msg, function (err) {
          if (err) {
            callback(err);
          }
        });
      });
    }

    let retryCount = 10;
    __waitSyncAck(results, retryCount, (err, result) => {
      wamqtt.unsubscribe(subTopic);
      callback(err, result);
    });
  } catch (err) {
    callback(err);
  }
}

module.exports = {
  addConfigRecord: _addConfigRecord,
  syncDeviceConfig: _syncDeviceConfig
};
