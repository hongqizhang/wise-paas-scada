'use strict';
const util = require('util');
const merge = require('merge');

const wamqtt = require('../communication/wamqtt.js');
const watopics = require('../common/watopics.js');
const ConfigRecord = require('../models/config-record.js');
const constant = require('../common/const.js');

const mqttTopics = watopics.mqttTopics;

const cfgRecordBeforeKey = ['description', 'deviceIP', 'devicePort', 'dataLog', 'engUnit', 'intDspFmt', 'fraDspFmt',
  'spanHigh', 'spanLow', 'state0', 'state1', 'state2', 'state3', 'state4', 'state5', 'state6', 'state7'];
const cfgRecordAfterKey = ['Desc', 'IP', 'Port', 'Log', 'EU', 'IDF', 'FDF', 'SH', 'SL', 'S0', 'S1', 'S2', 'S3', 'S4',
  'S5', 'S6', 'S7'];

const errorMessage = {
  updateFailed: 'SCADA [%s] update configuration error ! Please contact the administrator.',
  noRecvAck: 'SCADA [%s] has no response. Please contact the administrator.'
};

function __findOrCreateConfigRecord (id, callback) {
  ConfigRecord.findOne({ _id: id }, (err, result) => {
    return result
      ? callback(err, result)
      : ConfigRecord.create({ _id: id }, (err, result) => {
        return callback(err, result);
      });
  });
}

function __mergeModifiedConfigRecord (id, callback) {
  try {
    ConfigRecord.findById(id, { records: true }, (err, result) => {
      if (err) {
        return callback(err);
      }
      let mergedObj = {};
      if (result && result.records) {
        for (let i = 0; i < result.records.length; i++) {
          let scada = result.records[i].scada;
          if (scada[id] === null || Object.keys(scada[id]).length === 0) {
            mergedObj = result.records[i].scada;
            break;
          } else {
            mergedObj = merge.recursive(true, mergedObj, scada);
          }
        }
      }
      callback(null, mergedObj);
    });
  } catch (err) {
    callback(err);
  }
}

function __deleteAllModifiedConfigRecord (ids, callback) {
  try {
    if (ids.length === 0) {
      return callback();
    }
    ConfigRecord.remove({ _id: { $in: ids } }, (err, result) => {
      return callback(err, result);
    });
  } catch (err) {
    callback(err);
  }
}

function __waitAllSyncAck (results, retryCount, callback) {
  setTimeout(() => {
    // console.log('wait...');
    let ok = true;
    for (let i = 0; i < results.length; i++) {
      if (results[i].ok === false) {
        ok = false;
      }
    }
    if (ok === true) {
      return callback(null, results);
    } else {
      if (retryCount === 0) {
        return callback(null, results);
      } else {
        __waitAllSyncAck(results, retryCount - 1, callback);
      }
    }
  }, 1000);
}

function __replacer (key, value) {
  if (typeof value === 'boolean') {
    return Number(value);
  }
  return value;
}

function _addModifiedConfigRecord (id, record, callback) {
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

function _syncDeviceConfig (ids, callback) {
  try {
    let results = [];
    // subscribe cfgack topic for receiving ack from scada
    let subTopic = util.format(mqttTopics.cfgackTopic, '+');
    wamqtt.subscribe(subTopic);
    wamqtt.events.on('message', (topic, message) => {
      let ack = JSON.parse(message.content.toString());
      if (ack.hasOwnProperty('d') === false) {
        return console.error('format is wrong ! ' + message.content.toString());
      }
      let d = ack.d;
      if (d.hasOwnProperty('Cfg') === true) {
        let result = results.find(o => o.id === message.scadaId);
        if (!result) {
          return;
        }
        if (d.Cfg === 1) {
          result.ok = true;
          result.message = '';
        } else {
          result.message = util.format(errorMessage.updateFailed, result.id);
        }
      }
    });
    for (let i = 0; i < ids.length; i++) {
      let scadaId = ids[i];
      let result = { id: ids[i], ok: false, message: util.format(errorMessage.noRecvAck, ids[i]) };
      results.push(result);

      __mergeModifiedConfigRecord(ids[i], (err, result) => {
        if (err) {
          return console.error(err);
        }
        let cmdObj = {};
        for (let scadaId in result) {
          let scada = result[scadaId];
          if (scada === null) {
            result[scadaId] = {};
            continue;
          }
          let devices = scada.Device;
          for (let deviceId in devices) {
            let device = devices[deviceId];
            if (device === null) {
              result[scadaId].Device[deviceId] = {};
              continue;
            }
            let tags = device.Tag;
            for (let tagName in tags) {
              let tag = tags[tagName];
              if (tag === null) {
                result[scadaId].Device[deviceId].Tag[tagName] = {};
                continue;
              }
            }
          }
        }

        if (result && Object.keys(result[scadaId]).length > 0) {
          cmdObj = { d: { Cmd: 'WC', Action: 3, Scada: result }, ts: new Date() };
        } else {
          cmdObj = { d: { Cmd: 'WC', Action: 2, Scada: result }, ts: new Date() };
        }

        let msg = JSON.stringify(cmdObj, __replacer);
        for (let i = 0; i < cfgRecordBeforeKey.length; i++) {
          var regex = new RegExp(cfgRecordBeforeKey[i], 'g');
          msg = msg.replace(regex, cfgRecordAfterKey[i]);
        }
        let pubTopic = util.format(mqttTopics.scadaCmdTopic, scadaId);
        wamqtt.publish(pubTopic, msg, (err) => {
          if (err) {
            callback(err);
          }
        });
      });
    }
    let retryCount = 10;
    __waitAllSyncAck(results, retryCount, (err) => {
      // unsubscribe topic cfgack
      wamqtt.unsubscribe(subTopic);
      if (err) {
        return callback(err);
      }

      let delIds = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i].ok === true) {
          delIds.push(results[i].id);
        }
      }
        // delete all records
      __deleteAllModifiedConfigRecord(delIds, (err, result) => {
        if (err) {
          return callback(err);
        }
      });
      callback(err, results);
    });
  } catch (err) {
    callback(err);
  }
}

module.exports = {
  addModifiedConfigRecord: _addModifiedConfigRecord,
  syncDeviceConfig: _syncDeviceConfig
};
