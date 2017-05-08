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

* <a href="#init"><code>datastore.<b>init()</b></code></a>
* <a href="#quit"><code>datastore.<b>quit()</b></code></a>
* <a href="#getRealData"><code>datastore.<b>getRealData()</b></code></a>
* <a href="#upsertRealData"><code>datastore.<b>upsertRealData()</b></code></a>
* <a href="#updateRealData"><code>datastore.<b>updateRealData()</b></code></a>
* <a href="#deleteRealDataByScadaId"><code>datastore.<b>deleteRealDataByScadaId()</b></code></a>
-------------------------------------------------------

<a name="init"></a>
### datastore.init(options)

Connects to MongoDB specified by the given options.
You have to specify the following options, for example:

```js
let conf = {
  hostname: '127.0.0.1',
  port: 27017,
  username: 'admin',
  password: '1234',
  database: 'mongodb'
};
```

-------------------------------------------------------

<a name="quit"></a>
### datastore#quit()

When no need to use datacore, close the connection.

-------------------------------------------------------

<a name="getRealData"></a>
### datastore#getRealData(tag array, [callback])

Get real-time tag data by the given tags list, a tag has `scadaId`, `deviceId`, and `tagName` properties.
The callback is called when all tag data has been gotten.

For example:

```js

let t1 = {
  scadaId: 'scada1',
  deviceId: 'device1',
  tagName: 'Foo1'
};

let t2 = {
  scadaId: 'scada2',
  deviceId: 'device2',
  tagName: 'Foo2'
};

datastore.getRealData([t1, t2], function (err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log(response);
  }
});

```

-------------------------------------------------------

<a name="upsertRealData"></a>
### datastore#upsertRealData(parameters, [callback])

Update real-time tag value. If tag is not found, tag will be inserted.
The callback is called when tag value has been updated.

For example:

```js

let t1 = {
  scadaId: 'scada1',
  deviceId: 'device1',
  tagName: 'Foo1',
  value: 100
};

datastore.upsertRealData(t1, function (err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log('success: ' + response.ok);
  }
});

```

-------------------------------------------------------

<a name="updateRealData"></a>
### datastore#updateRealData(parameters, [callback])

Update real-time tag value.
The callback is called when tag value has been updated.

For example:

```js

let t1 = {
  scadaId: 'scada1',
  deviceId: 'device1',
  tagName: 'Foo1',
  value: 100
};

datastore.upsertRealData(t1, function (err, response) {
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

datastore.deleteRealDataByScadaId('scada1', function (err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log('success: ' + response.ok);
  }
});

```

-------------------------------------------------------