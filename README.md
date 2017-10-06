# wise-paas-scada

wise-paas-scada is a utility node-module for WISE-PaaS SCADA.

## Installation

`npm install wise-paas-scada`

## Example

```js
const wisePaasScada = require('wise-paas-scada');

const datastore = wisePaasScada.datastore;
const deviceManager = wisePaasScada.deviceManager;
const waamqp = wisePaasScada.waamqp;

```

## API

<a name="datastore"></a>
## datastore

* <a href="#init"><code>datastore.<b>init(mongodbOptions, mqttOptions)</b></code></a>
* <a href="#quit"><code>datastore.<b>quit()</b></code></a>
* <a href="#getRealData"><code>datastore.<b>getRealData(tag array, [callback])</b></code></a>
* <a href="#upsertRealData"><code>datastore.<b>upsertRealData(scadaId, parameters, [callback])</b></code></a>
* <a href="#updateRealData"><code>datastore.<b>updateRealData(scadaId, parameters, [callback])</b></code></a>
* <a href="#deleteRealDataByScadaId"><code>datastore.<b>deleteRealDataByScadaId(scadaId, [callback])</b></code></a>
* <a href="#getHistData"><code>datastore.<b>getHistData()</b></code></a>
* <a href="#insertHistData"><code>datastore.<b>insertHistData()</b></code></a>
-------------------------------------------------------

<a name="init"></a>
### datastore.init(mongodbOptions, mqttOptions)

Connects to MongoDB and MQTT broker specified by the given options.
You have to specify the following options, for example:

```js
let mongodbConf = {
  hostname: '127.0.0.1',
  port: 27017,
  username: 'admin',
  password: '1234',
  database: 'mongodb'
};
let mqttConf = {
  host: '127.0.0.1',
  port: 1883,
  username: '',
  password: ''
};

datastore.init(mongodbConf, mqttConf);
```

-------------------------------------------------------

<a name="quit"></a>
### datastore#quit()

When no need to use datacore, close the connection.

-------------------------------------------------------

<a name="getRealData"></a>
### datastore#getRealData(tag array, [callback])

Get real-time tag data by the given tags list, a tag has `scadaId` and `tagName` properties.
The callback is called when all tag data has been gotten.

For example:

```js

let t1 = {
  scadaId: 'scada1',
  tagName: 'Foo1'
};

let t2 = {
  scadaId: 'scada2',
  tagName: 'Foo2'
};

datastore.getRealData([t1, t2],  (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log(response);
  }
});

```

-------------------------------------------------------

<a name="upsertRealData"></a>
### datastore#upsertRealData(scadaId, parameters, [callback])

Update real-time tag value. If tag is not found, tag will be inserted.
The callback is called when tag value has been updated.

For example:

```js

let scadaId = 'scada1';
let t1 = {
  tagName: 'Foo1',
  value: 100,
  ts: new Date()
};

datastore.upsertRealData(scadaId, t1,  (err, response)=>  {
  if (err) {
    console.error(err);
  } else {
    console.log('success: ' + response.ok);
  }
});

```

-------------------------------------------------------

<a name="updateRealData"></a>
### datastore#updateRealData(scadaId, parameters, [callback])

Update real-time tag value.
The callback is called when tag value has been updated.

For example:

```js

let scadaId = 'scada1';
let t1 = {
  tagName: 'Foo1',
  value: 100,
  ts: new Date()
};

datastore.updateRealData(scadaId, t1,  (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log('success: ' + response.ok);
  }
});

```

-------------------------------------------------------

<a name="deleteRealDataByScadaId"></a>
### datastore#deleteRealDataByScadaId(scadaId, [callback])

Delete real-time tag data record by the given scadaId.
The callback is called when tag value has been deleted.

For example:

```js

datastore.deleteRealDataByScadaId('scada1', (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log('success: ' + response.ok);
  }
});

```

-------------------------------------------------------

<a name="getHistData"></a>
### datastore#getHistData(parameters, [callback])

Get history tag data according to the input parameters.
The callback is called when data has been gotten.

For example:

```js

let t1 = {
  scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  startTs: new Date('2015-01-01'),
  endTs: new Date(),
  orderby: -1,
  limit: 10
};

datastore.getHistData(t1, function (err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log(response);
  }
});

```

-------------------------------------------------------

<a name="insertHistData"></a>
### datastore#insertHistData(parameters, [callback])

Insert history tag data.
The callback is called when data has been inserted.

For example:

```js

let t1 = {
  scadaId: 'cda43195-7a0a-4903-a533-d333d8c5f9d9',
  deviceId: 'P02_SCADA',
  tagName: 'ATML_PACPRF:CTR',
  value: 100,
  ts: new Date()
};

datastore.insertHistData(t1, function (err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log('success: ' + response.ok);
  }
});

```

-------------------------------------------------------