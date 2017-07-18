'use strict';

const amqp = require('amqplib/callback_api');
const EventEmitter = require('events');
const waTopics = require('../common/watopics.js');

const amqpTopics = waTopics.amqpTopics;
const amqpQueue = waTopics.amqpQueue;

const exchangeName = 'amq.topic';

let events = new EventEmitter();
let connection = null;
let channel = null;

function _publish (topic, message) {
  if (channel) {
    let routingKey = topic.replace(/\//g, '.');
    let content = JSON.stringify(message);
    let buffer = Buffer.alloc(content.length, content);
    channel.publish(exchangeName, routingKey, buffer, { persistent: false }, function (err, result) {
      if (err) {
        console.error('[AMQP] publish', err);
      }
    });
  }
}

function _connect (uri, type, callback) {
  /* let url = {
    protocol: 'amqp',
    hostname: conf.hostname || '127.0.0.1',
    port: conf.port || 5672,
    username: conf.username,
    password: conf.username
  }; */

  amqp.connect(uri, (err, conn) => {
    if (err) {
      console.error('[AMQPConnectError] ' + err);
      return callback(err);
    }
    conn.on('error', (error) => {
      console.error('[AMQP] ' + error);
    });
    conn.on('close', () => {
      console.error('[AMQP] Connection close ! Reconnecting....');
      setTimeout(_connect(uri, type, callback), 1000);
    });
    connection = conn;
    connection.createChannel(function (err, ch) {
      if (err) {
        callback(err);
        return;
      }
      // options.type
      switch (type) {
        case 'config':
          ch.assertQueue(amqpQueue.cfgQ, { durable: true });
          ch.assertQueue(amqpQueue.notifyQ, { durable: true });
          // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
          ch.bindQueue(amqpQueue.cfgQ, exchangeName, amqpTopics.configTopic.replace(/\//g, '.'));
          ch.bindQueue(amqpQueue.notifyQ, exchangeName, amqpTopics.configTopic.replace(/\//g, '.'));
          ch.prefetch(1);
          ch.consume(amqpQueue.cfgQ, function (msg) {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 6) {
              return;
            }
            let tenantId = buff[2];
            let scadaId = buff[4];
            events.emit('config', tenantId, scadaId, msg.content.toString());
          }, { noAck: true });
          ch.consume(amqpQueue.notifyQ, function (msg) {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 4) {
              return;
            }
            let tenantId = buff[2];
            events.emit('notify', tenantId, msg.content.toString());
          }, { noAck: true });
          break;
        case 'data':
          ch.assertQueue(amqpQueue.dataQ, { durable: true });
          ch.assertQueue(amqpQueue.connQ, { durable: true });
          ch.assertQueue(amqpQueue.cmdQ, { durable: true });
          // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
          ch.bindQueue(amqpQueue.dataQ, exchangeName, amqpTopics.dataTopic.replace(/\//g, '.'));
          ch.bindQueue(amqpQueue.connQ, exchangeName, amqpTopics.connTopic.replace(/\//g, '.'));
          ch.bindQueue(amqpQueue.cmdQ, exchangeName, amqpTopics.cmdTopic.replace(/\//g, '.'));
          ch.prefetch(1);
          ch.consume(amqpQueue.dataQ, function (msg) {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 6) {
              return;
            }
            let tenantId = buff[2];
            let scadaId = buff[4];
            events.emit('data', tenantId, scadaId, msg.content.toString());
          }, { noAck: true });
          ch.consume(amqpQueue.connQ, function (msg) {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 6) {
              return;
            }
            let tenantId = buff[2];
            let scadaId = buff[4];
            events.emit('conn', tenantId, scadaId, msg.content.toString());
          }, { noAck: true });
          break;
        /* case 'plugin':
          // custom definition queue, for example: '/wisepaas/<tenantId>/scada/<appId>/ack'
          ch.assertQueue(options.queue, { durable: true });
          ch.bindQueue(options.queue, exchangeName, options.queue.replace(/\//g, '.'));
          ch.prefetch(1);
          ch.consume(options.queue, function (msg) {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 6) {
              return;
            }
            let tenantId = buff[2];
            let appId = buff[4];
            events.emit('message', tenantId, appId, msg.content.toString());
          }, { noAck: true });
          break; */
        default:
          break;
      }

      channel = ch;
      callback(null);
    });
  });
}

function _close () {
  if (channel) {
    channel.close();
  }
  if (connection) {
    connection.close();
  }
}

module.exports.events = events;
module.exports.connect = _connect;
module.exports.close = _close;
module.exports.publish = _publish;
