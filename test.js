'use strict';

const util = require('util');
var Promise = require('bluebird');
const wisePaasScada = require('./index.js');
const constant = require('./common/const');

const datastore = wisePaasScada.datastore;
const scadaManager = wisePaasScada.scadaManager;
const deviceManager = wisePaasScada.deviceManager;

// MQTT
let mqttConf = {
  host: 'PC031206',
  port: 1883,
  username: 'admin',
  password: 'admin'
};

let mongoConf = {
  host: 'PC031206',
  port: 27017,
  username: 'wisepaas',
  password: 'wisepaas',
  database: 'WISE-PaaS',
  uri: 'mongodb://wisepaas:wisepaas@PC031206:27017/WISE-PaaS'
};

let influxConf = {
  host: '127.0.0.1',
  database: 'test',
  port: 8086,
  username: '',
  password: ''
};

/* datastore.init({
  mongoConf: mongoConf,
  mqttConf: mqttConf,
  influxConf: influxConf,
  histDBType: constant.databaseType.influxdb
}); */

scadaManager.init({
  mongoConf: mongoConf,
  mqttConf: mqttConf
});

deviceManager.init({
  mongoConf: mongoConf,
  mqttConf: mqttConf
});

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
    deviceId: 'P01_Device',
    tagName: 'TestAO1'
  }],
  startTs: new Date('2018-01-02 07:00:00Z'),
  endTs: new Date(),
  limit: 10000
};

let histQueryParam1 = {
  tags: [{
    scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
    deviceId: 'P01_Modsim',
    tagName: 'TestAO2863'
  }],
  startTs: new Date('2017-10-31'),
  interval: 600,
  intervalType: wisePaasScada.const.intervalType.second,  // second, minute, hour, day
  dataType: wisePaasScada.const.dataType.last,  // last, min, max, avg
  limit: 100
};

let param = {
  '1137e210-4b73-4700-affc-cd1714a90596': {
    description: 'test'
  }
};
scadaManager.getScadaStatus('test').then((result) => {
  console.log(result);
  return scadaManager.upsertScadaStatus({ scadaId: 'test', status: false });
}).then((result) => {
  console.log(result);
  return scadaManager.getScadaStatus('test');
}).then((result) => {
  console.log(result);
  return scadaManager.updateScadaStatus('test', {status: true});
}).then((result) => {
  console.log(result);
  return scadaManager.getScadaStatus('test');
}).then((result) => {
  console.log(result);
  return scadaManager.addModifiedConfigRecord('test', { test: { description: 'test' } });
}).then((result) => {
  console.log(result);
  return scadaManager.getScadaStatus('test');
}).then((result) => {
  console.log(result);
  return scadaManager.syncScadaConfig('test');
}).then((result) => {
  console.log(result);
  return scadaManager.getScadaStatus('test');
}).then((result) => {
  console.log(result);
  return deviceManager.getDeviceStatus({scadaId: 'test', deviceId: 'test'});
}).then((result) => {
  console.log(result);
  return deviceManager.upsertDeviceStatus('test', 'test', {status: true});
}).then((result) => {
  console.log(result);
  return deviceManager.getDeviceStatus({scadaId: 'test', deviceId: 'test'});
}).then((result) => {
  console.log(result);
  return deviceManager.deleteDeviceStatus('test', 'test');
}).then((result) => {
  console.log(result);
  return deviceManager.getDeviceStatus({scadaId: 'test', deviceId: 'test'});
}).then((result) => {
  console.log(result);
  return scadaManager.deleteScadaStatus('test');
}).then((result) => {
  console.log(result);
  return scadaManager.getScadaStatus('test');
}).then((result) => {
  console.log(result);
}).catch((err) => {
  console.log(err);
});

/* datastore.getRealData(dsParams1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('getRealData: ' + result[0].value);
  }
}); */

/* console.time('getHistRawData');
datastore.getHistDataLog(histQueryParam, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.timeEnd('getHistRawData');
    console.log('getHistRawData: ');
    console.log(JSON.stringify(result));
  }
}); */

/* console.time('getHistDataLog');
datastore.getHistDataLog(histQueryParam1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.timeEnd('getHistDataLog');
    console.log('getHistDataLog: ');
    console.log(JSON.stringify(result));
  }
}); */

function padLeft (str, lenght) {
  if (str.length >= lenght) { return str; } else { return padLeft('0' + str, lenght); }
}
/* var record = {};
record['3b0c87a4-ed0a-4734-9c1e-be95513f71fe'] = null;
scadaManager.addModifiedConfigRecord('3b0c87a4-ed0a-4734-9c1e-be95513f71fe', record)
  .then((result) => {
    console.log(result);
    scadaManager.syncScadaConfig(['3b0c87a4-ed0a-4734-9c1e-be95513f71fe'])
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.error(err);
    });
  })
  .catch((err) => {
    console.error(err);
  }); */

/* scadaManager.syncScadaConfig(['cca312df-4d73-4672-b1ad-ddeae0801ccb'])
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.error(err);
  }); */
/* let i = 1;
function _queryHist () {
  let p = {
    tags: [{
      scadaId: '9e92ba16-62b0-4a31-8804-7dbd770d648a',
      deviceId: 'P01_Modsim',
      tagName: 'Tag295'
    }],
    startTs: new Date('2017-10-01T07:00:00.000Z'),
    interval: 100,
    intervalType: wisePaasScada.const.intervalType.second,  // second, minute, hour, day
    dataType: wisePaasScada.const.dataType.last,  // last, min, max, avg
    limit: 1
  };
  console.time('Hist');
  datastore.getHistDataLog(p, function (err, result) {
    console.timeEnd('Hist');
    if (err) {
      console.error(err);
    } else {
      console.log(p.tags[0].tagName + '  ' + result.dataLog[0].values.length);
      // console.log(JSON.stringify(result));
      i++;
      _queryHist();
    }
  });
}
setTimeout(_queryHist, 1000); */

/* function _insertHist () {
  let tags = [];
  for (let i = 0; i < 5000; i++) {
    tags.push({
      scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
      deviceId: 'P01_Device',
      tagName: 'TestAO' + i,
      value: Math.floor(Math.random() * 100),
      ts: new Date()
    });
  }
  console.time('insertHistRawData');
  datastore.insertHistRawData(tags, function (err, result) {
    if (err) {
      console.error(err);
    } else {
      console.timeEnd('insertHistRawData');
      console.log('insertHistData: ');
      setTimeout(_insertHist, 1000);
    }
  });
}
_insertHist(); */
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

let p1 = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce',
  deviceId: 'P01_Device',
  tagName: 'TestDO01',
  ts: new Date()
};
let p2 = {
  scadaId: 'ef314a5a-ae3e-4edb-bc31-bf8dacec8742',
  deviceId: 'P01_Device',
  tagName: 'BBB',
  ts: new Date()
};

/* datastore.upsertRealData(dsParams1.scadaId, dsParams1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('upsertRealData: ');
    console.log(result);

    datastore.getRealData([p1, p2], function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getRealData: ');
        console.log(result);
      }
    });
  }
}); */

/* scadaManager.updateScadaStatus(dsParams1.scadaId, { modified: true }, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('updateRealData: ');
    console.log(result);
    scadaManager.getScadaStatus(dsParams1.scadaId, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getScadaStatus: ');
        console.log(result);
      }
    });
  }
}); */

/* deviceManager.upsertDeviceStatus(dsParams1.scadaId, dsParams1.deviceId, { status: true }, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    deviceManager.getDeviceStatus([{ scadaId: dsParams1.scadaId, deviceId: dsParams1.deviceId }, { scadaId: dsParams1.scadaId, deviceId: 'P02_Device' }], (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log('getDeviceStatus: ');
        console.log(result);
      }
    });
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
}); */

/* let id = 'cda43195-7a0a-4903-a533-d333d8c5f9d9';
let dmParams = {
  status: true
};

scadaManager.getScadaStatus(id, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('getScadaStatus: ');
    console.log(result);
  }
});
*/
// datastore.quit();
