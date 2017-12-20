'use strict';

const util = require('util');
var Promise = require('bluebird');
const wisePaasScada = require('./index.js');

const datastore = wisePaasScada.datastore;
const scadaManager = wisePaasScada.scadaManager;
const deviceManager = wisePaasScada.deviceManager;

// MQTT
let mqttConf = {
  host: '127.0.0.1',
  port: 1883,
  username: '',
  password: ''
};

let conf = {
  hostname: '127.0.0.1',
  port: 27017,
  username: 'username',
  password: 'password',
  database: 'database'
};

datastore.init(conf, mqttConf);
scadaManager.init(conf, mqttConf);
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
    scadaId: 'c906ec27-45f4-4c83-abeb-56f28bddca88',
    deviceId: 'P01_Modsim',
    tagName: 'FANUC2:ParTotal'
  }],
  startTs: new Date('2017-10-31'),
  endTs: new Date('2017-11-05'),
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

/* datastore.getRealData(dsParams1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('getRealData: ' + result[0].value);
  }
}); */

/* console.time('getHistRawData');
datastore.getHistRawData(histQueryParam, function (err, result) {
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
/* let params = [];
let param = {};
param['cca312df-4d73-4672-b1ad-ddeae0801ccb'] = { Device: {} };
param['cca312df-4d73-4672-b1ad-ddeae0801ccb'].Device['qq'] = null;
var record = {};
record['cca312df-4d73-4672-b1ad-ddeae0801ccb'] = null;
scadaManager.addModifiedConfigRecord('cca312df-4d73-4672-b1ad-ddeae0801ccb', record)
  .then((result) => {
    console.log(result);
    scadaManager.syncScadaConfig(['cca312df-4d73-4672-b1ad-ddeae0801ccb'])
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
      ts: new Date()
    });
  }
  datastore.insertHistRawData(tags, function (err, result) {
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

deviceManager.upsertDeviceStatus(dsParams1.scadaId, dsParams1.deviceId, { status: true }, (err, result) => {
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

scadaManager.upsertScadaStatus(dsParams1.scadaId, {}, function (err, result) {
  if (err) {
    console.error(err);
  } else {

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
