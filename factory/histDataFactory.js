'use strict';

const constant = require('../common/const');
const mongoHelper = require('../utils/histDataHelper');
const influxHelper = require('../utils/histDataInfluxHelper');

function _createHistDataHelper (databaseType) {
  switch (databaseType) {
    case constant.databaseType.mongodb:
      return mongoHelper;
    case constant.databaseType.influxdb:
      return influxHelper;
    default:
      return mongoHelper;
  }
}

module.exports = {
  createHistDataHelper: _createHistDataHelper
};
