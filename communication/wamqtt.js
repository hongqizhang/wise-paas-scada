'use strict';

const mqtt = require('mqtt');
const EventEmitter = require('events');
const watopic = require('../common/watopics.js');

let connStatus = {
  None: 0,
  Connected: 1,
  Closed: 2,
  Offline: 3
};

const publishOptions = {
  qos: 1,
  retain: false
};

const subscribeOptions = {
  qos: 1
};

/*
conf = {
	host: "172.18.3.157/WaMQTT/",
	port:80,
	clientId:"",
	username:"xxx",
	password:"xxx",
	reconnectPeriod: 1000,
	protocol: 1, 2 or 3 // tcp, ws, wss
};
*/

let client = null;
let events = new EventEmitter();
let connectStatus = connStatus.None;

function _connect (conf) {
  let clientId = 'app_' + Math.random().toString(16).substr(2, 8);
  var tcpOptions = {
    port: conf.port || 1883,
    clean: true,
    keepalive: 60,
    clientId: conf.clientId || clientId,
    username: conf.username,
    password: conf.password,
    reconnectPeriod: 1000
  };

  var wsOptions = {
    port: conf.port || 80,
    clean: true,
    keepalive: 60,
    clientId: conf.clientId || clientId,
    username: conf.username,
    password: conf.password,
    reconnectPeriod: 1000
  };

  var wssOptions = {
    port: conf.port || 443,
    clean: true,
    keepalive: 60,
    clientId: conf.clientId || clientId,
    username: conf.username,
    password: conf.password,
    reconnectPeriod: 1000,
    rejectUnauthorized: false
  };

  if (!conf.tls || conf.tls === 1) {
    client = mqtt.connect('tcp://' + conf.host, tcpOptions);
  } else if (conf.tls === 2) {
    client = mqtt.connect('ws://' + conf.host, wsOptions);
  } else {
    client = mqtt.connect('wss://' + conf.host, wssOptions);
  }

  client.on('connect', function () {
    connectStatus = connStatus.Connected;
    events.emit('connect');
  });

  client.on('close', function () {
    connectStatus = connStatus.Closed;
    events.emit('close');
  });

  client.on('offline', function () {
    connectStatus = connStatus.Offline;
    events.emit('offline');
  });

  client.on('error', function (error) {
    events.emit('error', error);
  });

  client.on('message', function (topic, message) {
    let buff = topic.split('/');
    if (buff.length !== 6) {
      return;
    }
    let msg = {
      tenantId: buff[2],
      scadaId: buff[4],
      content: message
    };
    switch (buff[5]) {
      case 'conn':
        events.emit('conn', msg);
        break;
      default:
        break;
    }
    events.emit('message', topic, msg);
  });
}

function _close () {
  if (client) {
    client.end(true);
    client = null;
  }
}

function _publish (topic, message, callback) {
  if (client) {
    if (message.hasOwnProperty('ts') === false) {
      message.ts = new Date();
    }
    if (message.hasOwnProperty('t') === false) {
      message.t = Math.random().toString(16).substr(2, 8);
    }
    client.publish(topic, JSON.stringify(message), publishOptions, callback);
  }
}

function _subscribe (topic, callback) {
  if (client) {
    client.subscribe(topic, subscribeOptions, callback);
  }
}

module.exports = {
  events: events,
  connect: _connect,
  close: _close,
  publish: _publish,
  subscribe: _subscribe
};
