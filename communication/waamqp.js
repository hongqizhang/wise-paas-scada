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
    channel.publish(exchangeName, routingKey, buffer, { persistent: false }, (err, result) => {
      if (err) {
        console.error('[AMQP] publish', err);
      }
    });
  }
}

function _ack (msg, all) {
  if (channel) {
    let allUpTo = all || false;
    channel.ack(msg, allUpTo);
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
    connection.createChannel((err, ch) => {
      if (err) {
        callback(err);
        return;
      }
      // options.type
      switch (type) {
        case 'config':
          ch.assertQueue(amqpQueue.cfgQ, { durable: true });
          // ch.assertQueue(amqpQueue.notifyQ, { durable: true });
          ch.unbindQueue('waCfgQ', exchangeName, '.wisepaas.*.scada.*.cfg');
          ch.deleteQueue('waCfgQ');
          // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
          ch.bindQueue(amqpQueue.cfgQ, exchangeName, amqpTopics.configTopic.replace(/\//g, '.'));
          // ch.bindQueue(amqpQueue.notifyQ, exchangeName, amqpTopics.notifyTopic.replace(/\//g, '.'));
          ch.prefetch(1);
          ch.consume(amqpQueue.cfgQ, (msg) => {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 5) {
              return;
            }
            // msg.tenantId = buff[2];
            msg.scadaId = buff[3];
            events.emit('config', msg);
          }, { noAck: false });
          break;
        case 'data':
          ch.assertQueue(amqpQueue.dataQ, { durable: true });

          ch.unbindQueue('waDataQ', exchangeName, '.wisepaas.*.scada.*.data');
          ch.deleteQueue('waDataQ');
          // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
          ch.bindQueue(amqpQueue.dataQ, exchangeName, amqpTopics.dataTopic.replace(/\//g, '.'));

          ch.prefetch(1);
          ch.consume(amqpQueue.dataQ, (msg) => {
            let buff = msg.fields.routingKey.split('.');
            if (buff.length !== 5) {
              return;
            }
            // msg.tenantId = buff[2];
            msg.scadaId = buff[3];
            events.emit('data', msg);
          }, { noAck: false });
          break;
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

module.exports = {
  events: events,
  connect: _connect,
  close: _close,
  publish: _publish,
  ack: _ack
};
