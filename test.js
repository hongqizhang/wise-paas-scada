'use strict';

const util = require('util');
const wisePaasScada = require('./index.js');

const datastore = wisePaasScada.datastore;
const deviceManager = wisePaasScada.deviceManager;
const waamqp = wisePaasScada.waamqp;

// AMQP
/* let amqpConf = {
  protocol: 'amqp',
  hostname: '172.16.12.211',
  port: 5672,
  username: 'admin',
  password: 'admin'
};

let amqpUri = util.format('%s://%s:%s@%s:%d', amqpConf.protocol, amqpConf.username, amqpConf.password, amqpConf.hostname, amqpConf.port);
waamqp.connect(amqpUri, 'data', (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('AMQP connect success !');
    waamqp.events.on('conn', (tenantID, scadaId, payload) => {
      console.log(payload);
    });
    waamqp.events.on('data', (tenantID, scadaId, payload) => {
      console.log(payload);
    });
  }
}); */

let conf = {
  hostname: '172.16.12.211',
  port: 27017,
  username: 'wisepaas',
  password: 'wisepaas',
  database: 'WISE-PaaS'
};

datastore.init(conf);
deviceManager.init(conf);

let arr = [];
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
}
let dsParams1 = {
  scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  value: 100,
  ts: new Date('2015-01-01')
};
let dsParams2 = {
  scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  value: 100
};

function _get () {
  datastore.init(conf);
  datastore.getRealData(arr, function (err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log('getRealData: ');
      // console.log(result);
    }
  });

  setTimeout(_get, 1000);
}

_get();

/* let histParam1 = {
  scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  value: 100,
  ts: new Date()
};
let histQueryParam = {
  scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  startTs: new Date('2015-01-01'),
  endTs: new Date(),
  orderby: -1,
  limit: 10
};

datastore.insertHistData(histParam1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('insertHistData: ');
    console.log(result);
    datastore.getHistData(histQueryParam, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getHistData: ');
        console.log(result);
      }
    });
  }
});

datastore.deleteRealDataByScadaId(dsParams1.scadaId, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('deleteRealData: ');
    console.log(result);
  }
});

datastore.upsertRealData(dsParams1, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('upsertRealData: ');
    console.log(result);
    datastore.getRealData([dsParams1], function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getRealData: ');
        console.log(result);
      }
    });
  }
});

let id = 'ef314a5a-ae3e-4edb-bc31-bf8dacec93ce';
let dmParams = {
  status: true,
  freq: 5   // 5 seconds
};

deviceManager.upsertDeviceInfo(id, dmParams, function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log('upsertDeviceInfo: ');
    console.log(result);
    deviceManager.getDeviceStatus(id, function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('getDeviceStatus: ');
        console.log(result);
      }
    });
  }
}); */

// datastore.quit();
