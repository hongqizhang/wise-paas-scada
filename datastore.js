'use strict';

// const util = require('util');

const mongodb = require('./db/mongodb.js');

module.exports.init = (conf) => {
  if (mongodb) {
    mongodb.connect(conf);
  }
};

module.exports.quit = () => {
  if (mongodb) {
    mongodb.disconnect();
  }
};

module.exports.getRealData = (param, callback) => {
  if (mongodb) {
    mongodb.findOneRealData(param, callback);
  }
};
