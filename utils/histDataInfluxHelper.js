'use strict';
const util = require('util');
const Promise = require('bluebird');

const constant = require('../common/const');
const influxdb = require('../db/influxdb');

const MeasurementHistRawData = 'hist_raw_data';

function _getHistRawData (param) {
  return new Promise((resolve, reject) => {
    try {
      let scadaId = param.scadaId;
      let deviceId = param.deviceId;
      let tagName = param.tagName;
      let dataType = param.dataType;
      let startTs = param.startTs;
      let endTs = param.endTs;
      let interval = param.interval;
      let intervalType = param.intervalType;
      let orderby = param.orderby || 1;   // default is ASC
      let limit = param.limit || 1;
      let filled = param.filled || false;

      if (startTs) {
        if (startTs instanceof Date === false) {
          return reject(new Error('The format of start time must be Date !'));
        }
      }
      if (endTs) {
        if (endTs instanceof Date === false) {
          return reject(new Error('The format of end time must be Date !'));
        }
      }
      let sql = `
      SELECT * FROM ${influxdb.escape.measurement(MeasurementHistRawData)}
      WHERE scadaId = ${influxdb.escape.stringLit(scadaId)} AND
      deviceId = ${influxdb.escape.stringLit(deviceId)} AND
      tagName = ${influxdb.escape.stringLit(tagName)} AND
      time >= '${startTs.toISOString()}' AND time < '${endTs.toISOString()}'
      ORDER BY time ${(orderby === 1) ? 'ASC' : 'DESC'}
      LIMIT ${limit.toString()}`;

      return influxdb.query(sql)
        .then((rows) => {
          let output = { scadaId, deviceId, tagName, values: [] };
          if (rows && rows.length > 0) {
            for (let i = 0; i < rows.length; i++) {
              let row = rows[i];
              output.values.push({ value: (row.tval) ? row.tval : row.val, ts: row.time });
            }
          }
          if (filled) {
            let startTsSec = startTs.getTime();
            let count = limit;
            let values = [];
            for (let i = 0; i < count; i++) {
              let intTs = new Date();
              intTs.setTime(startTsSec + (i * interval * constant.intervalRange.second));
              values.push({value: constant.badTagValue, ts: intTs});
            }
            for (let i = 0; i < output.values.length; i++) {
              let tick = output.values[i];
              let tickTsSec = tick.ts.getTime();
              let index = parseInt((tickTsSec - startTsSec) / (interval * constant.intervalRange.second));
              let mod = (tickTsSec - startTsSec) % (interval * constant.intervalRange.second);
              if (mod > 0) {
                index++;
              }
              if (index < count) {
                values[index].value = tick.value;
              }
            }
            if (values.length > 0 && values[0].value === constant.badTagValue) {
              sql = `
              SELECT * FROM ${influxdb.escape.measurement(MeasurementHistRawData)}
              WHERE scadaId = ${influxdb.escape.stringLit(scadaId)} AND
              deviceId = ${influxdb.escape.stringLit(deviceId)} AND
              tagName = ${influxdb.escape.stringLit(tagName)} AND
              time < '${startTs.toISOString()}'
              LIMIT 1`;
              influxdb.query(sql)
                .then((results) => {
                  let prevValue = constant.badTagValue;
                  if (results && results.length > 0) {
                    prevValue = (results[0].tval) ? results[0].tval : results[0].val;
                  }
                  for (let i = 0; i < values.length; i++) {
                    if (values[i].value === constant.badTagValue && prevValue !== constant.badTagValue) {
                      values[i].value = prevValue;
                    } else {
                      prevValue = values[i].value;
                    }
                  }
                  output.values = values;
                  resolve(output);
                })
                .catch((err) => {
                  reject(err);
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
        }).catch((err) => {
          reject(err);
        });
    } catch (ex) {
      reject(ex);
    }
  });
}

function _insertHistRawData (params) {
  try {
    if (Array.isArray(params) === false) {
      params = [params];
    }
    let points = [];
    let point = {};
    let param = {};
    let val = {};
    for (let i = 0; i < params.length; i++) {
      param = params[i];
      if (Array.isArray(param.value)) {
        for (let j = 0; j < param.value.length; j++) {
          val = param.value[j];
          point = {
            measurement: 'hist_raw_data',
            tags: { scadaId: param.scadaId, deviceId: param.deviceId, tagName: param.tagName + '.' + j.toString() },
            fields: {},
            timestamp: params.ts
          };
          if (typeof val === 'string') {
            point.fields.tval = val;
          } else {
            point.fields.val = val;
          }
          points.push(point);
        }
      } else {
        val = param.value;
        point = {
          measurement: 'hist_raw_data',
          tags: { scadaId: param.scadaId, deviceId: param.deviceId, tagName: param.tagName },
          fields: {},
          timestamp: params.ts
        };
        if (typeof val === 'string') {
          point.fields.tval = val;
        } else {
          point.fields.val = val;
        }
        points.push(point);
      }
    }
    return influxdb.writePoints(points);
  } catch (ex) {
    Promise.reject(ex);
  }
}

module.exports = {
  getHistRawData: _getHistRawData,
  insertHistRawData: _insertHistRawData
};
