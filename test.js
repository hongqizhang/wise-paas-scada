'use strict';

const util = require('util');
var Promise = require('bluebird');
const wisePaasScada = require('./index.js');

const datastore = wisePaasScada.datastore;
const deviceManager = wisePaasScada.deviceManager;

// MQTT
let mqttConf = {
  host: '172.16.12.211',
  port: 1883,
  username: 'admin',
  password: 'admin'
};

let conf = {
  hostname: '172.16.12.211',
  port: 27017,
  username: 'wisepaas',
  password: 'wisepaas',
  database: 'WISE-PaaS'
};

datastore.init(conf, mqttConf);
deviceManager.init(conf, mqttConf);

let dsParams1 = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
  deviceId: 'P01_Device',
  tagName: 'TestAO5001',
  value: 500,
  ts: new Date()
};
let dsParams2 = {
  scadaId: '5374cfcc-8537-46b7-8c19-6c0d9a636a64',
  deviceId: 'P01_dev1',
  tagName: 'ATML_PACPRF:CTR1',
  value: 1
};

let histParam1 = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  value: 100,
  ts: new Date()
};

let histQueryParam = {
  scadaId: 'd417571c-c082-49be-b9fd-310d6f0217d0',
  tagName: 'Tag1',
  startTs: new Date('2015-01-01'),
  endTs: new Date(),
  orderby: -1,
  limit: 3
};

function _getValueProc () {
  datastore.getRealData([dsParams1, dsParams2], function (err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log('getRealData: ' + result);
      // setTimeout(_getValueProc, 100);
    }
  });
}
setTimeout(_getValueProc, 1000);

datastore.getHistRawData(histQueryParam, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('getHistData: ');
    console.log(result);
  }
});

/* datastore.insertHistData(histParam1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('insertHistData: ');
    datastore.getHistData(histQueryParam, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getHistData: ');
        console.log(result);
      }
    });
  }
}); */

/* let arr = [];
for (let i = 0; i < 1000; i++) {
  arr.push(
    {
      scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
      deviceId: 'P02_SCADA',
      tagName: 'ATML_PACPRF:CTR',
      value: 100,
      ts: new Date('2015-01-01')
    }
  );
} */

/* datastore.upsertRealData(dsParams1.scadaId, dsParams1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('upsertRealData: ');
    console.log(result);
    datastore.getRealData(dsParams1, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getRealData: ');
        console.log(result);
      }
    });
  }
}); */

/* deviceManager.updateDeviceStatus(dsParams1.scadaId, { modified: true }, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('updateRealData: ');
    console.log(result);
    deviceManager.getDeviceStatus(dsParams1.scadaId, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getDeviceStatus: ');
        console.log(result);
      }
    });
  }
}); */

deviceManager.getDeviceStatus('cda43195-7a0a-4903-a533-d333d8c5f9d9', function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('getDeviceStatus: ');
    console.log(result);
  }
});

/* datastore.deleteRealDataByScadaId(dsParams1.scadaId, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('deleteRealData: ');
    console.log(result);
  }
}); */

/* datastore.writeTagValue(dsParams1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('writeTagValue: ');
    console.log(result);
  }
});

let id = 'cda43195-7a0a-4903-a533-d333d8c5f9d9';
let dmParams = {
  status: true
};

deviceManager.getDeviceStatus(id, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('getDeviceStatus: ');
    console.log(result);
  }
});
*/
// datastore.quit();
