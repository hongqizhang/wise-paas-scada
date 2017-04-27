'use strict';

const datastore = require('./datastore.js');

let conf = {
  hostname: '172.16.12.211',
  port: 27017,
  username: 'wisepaas',
  password: 'wisepaas',
  database: 'WISE-PaaS'
};

datastore.init(conf);
let params = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
  deviceId: 'P01_Modsim',
  tagName: 'TestAO01'
};

datastore.getRealData(params, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log(result);

    datastore.quit();
  }
});
