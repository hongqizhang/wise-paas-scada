'use strict';

const Influx = require('influx');

let _influxdb = null;

function _connect (conf) {
  _influxdb = new Influx.InfluxDB({
    host: conf.host,
    database: conf.database,
    port: conf.port,
    username: conf.username,
    password: conf.password,
    protocol: 'http', // optional, default 'http'
    schema: [
      {
        measurement: 'hist_raw_data',
        fields: {
          tval: Influx.FieldType.STRING,
          val: Influx.FieldType.FLOAT
        },
        tags: [
          'scadaId', 'deviceId', 'tagName'
        ]
      }
    ]
  });
}

function _writePoints (params) {
  if (Array.isArray(params) === false) {
    params = [params];
  }
  return _influxdb.writePoints(params);
}

function _query (sql) {
  if (typeof sql !== 'string') {
    Promise.reject(new Error('Query string is wrong !'));
  }
  return _influxdb.query(sql);
}

module.exports = {
  connect: _connect,
  writePoints: _writePoints,
  query: _query,
  escape: Influx.escape
};
