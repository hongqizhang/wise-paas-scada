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
  hostname: 'ei-mongodb-replica-stage.eastasia.cloudapp.azure.com',
  port: 27017,
  username: '7b801d2b-5417-47a4-a1c4-a216e840a95d',
  password: 'BLDYfE6zhbU4VHghUjesBuZYD',
  database: 'f78eaf9c-d8a5-41ab-b464-90d29f2c2460'
};

datastore.init(conf, mqttConf);
deviceManager.init(conf, mqttConf);

let dsParams1 = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
  deviceId: 'P01_Device',
  tagName: 'TestDO01',
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
  tags: [{
    scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
    tagName: 'TestAO01'
  }, {
    scadaId: '5374cfcc-8537-46b7-8c19-6c0d9a636a64',
    tagName: 'TestAO02'
  }],
  startTs: new Date('2015-01-01'),
  endTs: new Date(),
  orderby: -1,
  limit: 10
};

let histQueryParam1 = {
  tags: [{
    scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
    tagName: 'TestAO01'
  }, {
    scadaId: '5374cfcc-8537-46b7-8c19-6c0d9a636a64',
    tagName: 'TestAO02'
  }],
  startTs: new Date('2017-09-21T11:05:00.000Z'),
  interval: 1,
  intervalType: wisePaasScada.const.intervalType.second,  // second, minute, hour, day
  dataType: wisePaasScada.const.dataType.last,  // last, min, max, avg
  limit: 10000
};

function _getValueProc () {
  datastore.getRealData(dsParams1, function (err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log('getRealData: ' + result[0].value);
      // setTimeout(_getValueProc, 1000);
    }
  });
}
setTimeout(_getValueProc, 1000);

console.time('getHistRawData');
datastore.getHistRawData(histQueryParam, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.timeEnd('getHistRawData');
    console.log('getHistRawData: ');
    console.log(JSON.stringify(result));
  }
});

console.time('getHistDataLog');
datastore.getHistDataLog(histQueryParam1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.timeEnd('getHistDataLog');
    console.log('getHistDataLog: ');
    console.log(JSON.stringify(result));
  }
});

/* function _insertHist () {
  let tags = [];
  for (let i = 0; i < 5000; i++) {
    tags.push({
      scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
      deviceId: 'P01_Device',
      tagName: 'TestAO' + i,
      value: 500,
      ts: new Date()
    });
  }
  datastore.insertHistData(tags, function (err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log('insertHistData: ');
      setTimeout(_insertHist, 1000);
    }
  });
}
setTimeout(_insertHist, 1000); */

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
