'use strict';

const datastore = require('./api/datastore.js');
const deviceManager = require('./api/device-manager.js');

let conf = {
  hostname: '172.16.12.211',
  port: 27017,
  username: 'wisepaas',
  password: 'wisepaas',
  database: 'WISE-PaaS'
};

datastore.init(conf);
let dsParams = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
  deviceId: 'P01_Modsim',
  tagName: 'TestAO01',
  value: 100
};

datastore.upsertRealData(dsParams, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    datastore.getRealData(dsParams, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log(result);
      }
    });
  }
});

deviceManager.init(conf);
let id = 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce';
let dmParams = {
  status: true,
  freq: 5   // 5 seconds
};
deviceManager.upsertDeviceInfo(id, dmParams, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    deviceManager.getDeviceStatus(id, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log(result);
      }
    });
  }
});

// datastore.quit();
