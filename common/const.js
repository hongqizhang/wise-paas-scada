'use strict';

module.exports = {
  badTagValue: '*',

  intervalType: {
    second: 0,
    minute: 1,
    hour: 2,
    day: 3
  },
  dataType: {
    last: 0,
    min: 1,
    max: 2,
    avg: 3,
    sum: 4
  },
  intervalRange: {
    second: 1000,
    minute: (1000 * 60),
    hour: (1000 * 60 * 60),
    day: (1000 * 60 * 60 * 24)
  },
  databaseType: {
    mongodb: 'mongodb',
    influxdb: 'influxdb'
  }
};
