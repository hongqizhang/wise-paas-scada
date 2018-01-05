'use strict';

const Promise = require('bluebird');

const constant = require('../common/const');
const HistMinData = require('../models/hist-mindata');
const HistHorData = require('../models/hist-hourdata');
const HistDayData = require('../models/hist-daydata');
const HistRawData = require('../models/hist-rawdata');

function _getHistRawData (param) {
  return new Promise((resolve, reject) => {
    try {
      let condition = {};
      let pipeline = [];

      let scadaId = param.scadaId;
      let deviceId = param.deviceId;
      let tagName = param.tagName;
      let dataType = param.dataType;
      let startTs = param.startTs;
      let endTs = param.endTs;
      let interval = param.interval;
      let intervalType = param.intervalType || constant.intervalType.second;
      let intervalRange = param.intervalRange || constant.intervalRange.second;
      let orderby = param.orderby || 1;   // default is ASC
      let limit = param.limit || 1;
      let filled = param.filled || false;

      if (param.condition) {
        for (let key in param.condition) {
          condition[key] = param.condition[key];
        }
      }
      condition.scadaId = scadaId;
      // condition.deviceId = deviceId;
      condition.tagName = tagName;
      condition.ts = { '$lte': new Date() };
      if (startTs) {
        if (startTs instanceof Date === false) {
          return reject(new Error('The format of start time must be Date !'));
        }
        condition.ts['$gte'] = startTs;
      }
      if (endTs) {
        if (endTs instanceof Date === false) {
          return reject(new Error('The format of end time must be Date !'));
        }
        condition.ts['$lte'] = endTs;
      }
      let dbDataType = '$last';
      switch (dataType) {
        case constant.dataType.min:
          dbDataType = '$min';
          break;
        case constant.dataType.max:
          dbDataType = '$max';
          break;
        case constant.dataType.last:
          dbDataType = '$last';
          break;
        case constant.dataType.avg:
          dbDataType = '$avg';
          break;
        case constant.dataType.sum:
          dbDataType = '$sum';
          break;
      }
      if (intervalType === constant.intervalType.second) dbDataType = '$value';

      pipeline.push({ $match: condition });
      pipeline.push({ $sort: { ts: orderby } });
      if (filled === false) {
        pipeline.push({ $limit: limit });
      }
      pipeline.push({
        $group: {
          _id: { scadaId: '$scadaId', tagName: '$tagName' },
          values: { $push: { value: dbDataType, ts: '$ts' } }
        }
      });
      pipeline.push({ $project: { _id: 0 } });
      // console.log('query = ', JSON.stringify(pipeline));

      let collPointer = HistRawData;
      switch (intervalType) {
        case constant.intervalType.second:
          collPointer = HistRawData;
          break;
        case constant.intervalType.minute:
          collPointer = HistMinData;
          break;
        case constant.intervalType.hour:
          collPointer = HistHorData;
          break;
        case constant.intervalType.day:
          collPointer = HistDayData;
          break;
      }
      collPointer.aggregate(pipeline, (err, results) => {
        if (err) {
          reject(err);
        } else {
          let output = {
            scadaId: scadaId,
            deviceId: deviceId,
            tagName: tagName,
            values: []
          };
          if (results.length > 0) {
            output.values = results[0].values;
          }
          if (filled) {
            let startTsSec = startTs.getTime();
            let count = limit;
            let values = [];
            for (let i = 0; i < count; i++) {
              let intTs = new Date();
              intTs.setTime(startTsSec + (i * interval * intervalRange));
              values.push({value: constant.badTagValue, ts: intTs});
            }
            // console.log('filled values = ', values);
            // if (output.values.length > 0) {
            for (let i = 0; i < output.values.length; i++) {
              let tick = output.values[i];
              let tickTsSec = tick.ts.getTime();
              let index = parseInt((tickTsSec - startTsSec) / (interval * intervalRange));
              let mod = (tickTsSec - startTsSec) % (interval * intervalRange);
              if (mod > 0) {
                index++;
              }
              if (index < count) {
                values[index].value = tick.value;
              }
            }
            // console.log('tick_values = ', values);
            if (values.length > 0 && values[0].value === constant.badTagValue) {
              collPointer.find({ scadaId: scadaId, tagName: tagName, ts: { '$lt': startTs } }).sort({ ts: -1 })
              .hint({ scadaId: 1, tagName: 1, ts: 1 }).limit(1).exec((err, results) => {
                if (err) {
                  reject(err);
                } else {
                  let prevValue = (results && results.length > 0 && results[0].value) ? results[0].value : constant.badTagValue;
                  for (let i = 0; i < values.length; i++) {
                    if (values[i].value === constant.badTagValue && prevValue !== constant.badTagValue) {
                      values[i].value = prevValue;
                    } else {
                      prevValue = values[i].value;
                    }
                  }
                  output.values = values;
                  resolve(output);
                }
              });
            } else {
              let prevValue = constant.badTagValue;
              for (let i = 0; i < values.length; i++) {
                if (values[i].value === constant.badTagValue && prevValue !== constant.badTagValue) {
                  values[i].value = prevValue;
                } else {
                  prevValue = values[i].value;
                }
              }
              output.values = values;
              resolve(output);
            }
          } else {
            resolve(output);
          }
        }
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

function _insertHistRawData (params) {
  return new Promise((resolve, reject) => {
    try {
      var bulk = HistRawData.collection.initializeUnorderedBulkOp();
      let count = params.length;
      for (let i = 0; i < count; i++) {
        let param = params[i];
        if (param.value === undefined) {
          continue;
        } else if (param.value === constant.badTagValue) {
          continue;
        } else if (typeof param.value === 'object') {
          for (let key in param.value) {
            if (param.value[key] === constant.badTagValue) {
              delete param.value[key];
            }
          }
        }
        if (param.hasOwnProperty('deviceId')) {
          delete param.deviceId;
        }
        if (typeof param.ts === 'string') {
          param.ts = new Date(param.ts);
        }
        param.opTS = new Date();
        bulk.insert(param);
      }
      if (bulk.length === 0) {
        return resolve();
      }
      bulk.execute((err, result) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

/* function _insertHistRawData (params, callback) {
  try {
    let hist = {
      scadaId: params[0].scadaId,
      ts: new Date(params[0].ts),
      opTS: new Date(),
      tags: []
    };
    let count = params.length;
    for (let i = 0; i < count; i++) {
      let param = params[i];
      if (param.value === undefined || param.value === constant.badTagValue) {
        continue;
      }
      if (typeof param.ts === 'string') {
        param.ts = new Date(param.ts);
      }

      hist.tags.push({ name: param.tagName, value: param.value });
    }

    HistRawData.collection.insert(hist);
    callback();
  } catch (ex) {
    callback(ex);
  }
} */

module.exports = {
  getHistRawData: _getHistRawData,
  insertHistRawData: _insertHistRawData
};
