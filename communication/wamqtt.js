'use strict';

const mqtt = require('mqtt');
const EventEmitter = require('events');
const watopic = require('../common/watopics.js');

let connStatus = {
  None: 0,
  Connected: 1,
  Closed: 2,
  Offline: 3,
  ReConnecting: 4
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
	protocol: 1, 2 or 3 // mqtt, ws, wss
};
*/

let client = null;
let events = new EventEmitter();
let connectStatus = connStatus.None;

function _connected () {
  return (client) ? client.connected : false;
}

function _reconnecting () {
  return (client) ? client.reconnecting : false;
}

function _connect (conf, callback) {
  try {
    let clientId = 'app_' + Math.random().toString(16).substr(2, 8);
    var tcpOptions = {
      port: conf.port || 1883,
      clean: true,
      keepalive: 60,
      clientId: conf.clientId || clientId,
      username: conf.username,
      password: conf.password,
      reconnectPeriod: 1000 * 3
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

    if (!conf.protocol || conf.protocol === 1) {
      client = mqtt.connect('mqtt://' + conf.host, tcpOptions);
    } else if (conf.protocol === 2) {
      client = mqtt.connect('ws://' + conf.host, wsOptions);
    } else {
      client = mqtt.connect('wss://' + conf.host, wssOptions);
    }

    client.on('connect', () => {
      connectStatus = connStatus.Connected;
      events.emit('connect');
    });

    client.on('close', () => {
      connectStatus = connStatus.Closed;
      events.emit('close');
    });

    client.on('offline', () => {
      connectStatus = connStatus.Offline;
      events.emit('offline');
    });

    client.on('error', (error) => {
      events.emit('error', error);
    });

    client.on('reconnect', () => {
      connectStatus = connStatus.ReConnecting;
      events.emit('reconnect');
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
  } catch (ex) {
    console.error('[wamqtt] connect error ! ' + ex);
  }
}

function _close () {
  if (client) {
    client.end(true);
    client = null;
  }
}

function _publish (topic, message, callback) {
  try {
    if (!client) {
      let err = '[MQTT] client is null !';
      return callback(err);
    }
    let msg = null;
    if (typeof message === 'string') {
      msg = message;
    } else {
      if (message.hasOwnProperty('ts') === false) {
        message.ts = new Date();
      }
      /* if (message.hasOwnProperty('t') === false) {
        message.t = Math.random().toString(16).substr(2, 8);
      } */
      msg = JSON.stringify(message);
    }
    client.publish(topic, msg, publishOptions, callback);
  } catch (ex) {
    callback(ex);
  }
}

function _subscribe (topic, callback) {
  if (!client) {
    let err = '[MQTT] client is null !';
    return callback(err);
  }
  client.subscribe(topic, subscribeOptions, callback);
}

function _unsubscribe (topic, callback) {
  if (!client) {
    let err = '[MQTT] client is null !';
    return callback(err);
  }
  client.unsubscribe(topic, callback);
}

module.exports = {
  connected: _connected,
  reconnecting: _reconnecting,
  connectStatus: connectStatus,
  events: events,
  connect: _connect,
  close: _close,
  publish: _publish,
  subscribe: _subscribe,
  unsubscribe: _unsubscribe
};
