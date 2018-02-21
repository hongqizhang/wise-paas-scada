'use strict';

const constant = require('../common/const');
const mongoHelper = require('../utils/statusMongoHelper');

function _createStatusHelper (databaseType) {
  switch (databaseType) {
    case constant.databaseType.mongodb:
      return mongoHelper;
    default:
      return mongoHelper;
  }
}

module.exports = {
  createStatusHelper: _createStatusHelper
};
