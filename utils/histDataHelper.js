'use strict';

const Promise = require('bluebird');

const constant = require('../common/const');
const HistRawData = require('../models/hist-rawdata');

function _getHistRawData (param) {
  return new Promise((resolve, reject) => {
    try {
      let condition = {};
      let pipeline = [];

      let scadaId = param.scadaId;
      let deviceId = param.deviceId;
      let tagName = param.tagName;
      let startTs = param.startTs;
      let endTs = param.endTs;
      let interval = param.interval;
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

      pipeline.push({ $match: condition });
      pipeline.push({ $sort: { ts: orderby } });
      if (filled === false) {
        pipeline.push({ $limit: limit });
      }
      pipeline.push({
        $group: {
          _id: { scadaId: '$scadaId', tagName: '$tagName' },
          values: { $push: { value: '$value', ts: '$ts' } }
        }
      });
      pipeline.push({ $project: { _id: 0 } });

      HistRawData.aggregate(pipeline, (err, results) => {
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
            let startTsSec = Math.floor(startTs.getTime() / 1000);
            let count = limit;

            let values = [];
            for (let i = 0; i < count; i++) {
              values.push({ value: constant.badTagValue, ts: new Date((startTsSec + i * interval) * 1000) });
            }

            // if (output.values.length > 0) {
            for (let i = 0; i < output.values.length; i++) {
              let tick = output.values[i];
              let tickTsSec = Math.floor(tick.ts.getTime() / 1000);
              let index = parseInt((tickTsSec - startTsSec) / interval);
              let mod = (tickTsSec - startTsSec) % interval;
              if (mod > 0) {
                index++;
              }
              if (index < count) {
                values[index].value = tick.value;
              }
            }
            if (values.length > 0 && values[0].value === constant.badTagValue) {
              HistRawData.find({ scadaId: scadaId, tagName: tagName, ts: { '$lt': startTs } }).sort({ ts: -1 })
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

function _insertHistRawData (params, callback) {
  try {
    var bulk = HistRawData.collection.initializeUnorderedBulkOp();
    let count = params.length;
    for (let i = 0; i < count; i++) {
      let param = params[i];
      if (typeof param.value === 'undefined') {
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
      if (typeof param.ts === 'string') {
        param.ts = new Date(param.ts);
      }
      param.opTS = new Date();
      bulk.insert(params[i]);
    }
    if (bulk.length === 0) {
      return callback();
    }
    bulk.execute((err, result) => {
      if (err) {
        return callback(err);
      }
      callback();
    });
  } catch (ex) {
    callback(ex);
  }
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
      if (typeof param.value === 'undefined' || param.value === constant.badTagValue) {
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
