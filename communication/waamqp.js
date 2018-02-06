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
  return new Promise((resolve, reject) => {
    if (channel) {
      let routingKey = topic.replace(/\//g, '.');
      let content = JSON.stringify(message);
      let buffer = Buffer.alloc(content.length, content);
      channel.publish(exchangeName, routingKey, buffer, { persistent: false });
      resolve();
    } else {
      reject(new Error('[AMQP] No channel !'));
    }
  });
}

function _ack (msg, all) {
  if (channel) {
    let allUpTo = all || false;
    channel.ack(msg, allUpTo);
  }
}

function _connect (options, callback) {
  if (!options) {
    return callback(new Error('[AMQP] Error ! Connection with no options !'));
  }
  let uri = options.uri;
  let prefetch = options.prefetch || 1;
  amqp.connect(uri, (err, conn) => {
    if (err) {
      console.error('[AMQPConnectError] ' + err);
      setTimeout(() => { _connect(options, callback); }, 1000);
      return callback(err);
    }
    conn.on('error', (error) => {
      console.error('[AMQP] ' + error);
    });
    conn.on('close', () => {
      console.error('[AMQP] Connection close ! Reconnecting....');
      setTimeout(() => { _connect(options, callback); }, 1000);
    });
    connection = conn;
    connection.createChannel((err, ch) => {
      if (err) {
        return callback(err);
      }

      ch.assertQueue(amqpQueue.cfgQ, { durable: true });
      ch.assertQueue(amqpQueue.dataQ, { durable: true });
      // ch.assertQueue(amqpQueue.notifyQ, { durable: true });

      // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
      ch.bindQueue(amqpQueue.cfgQ, exchangeName, amqpTopics.configTopic);
      ch.bindQueue(amqpQueue.dataQ, exchangeName, amqpTopics.dataTopic);
      // ch.bindQueue(amqpQueue.notifyQ, exchangeName, amqpTopics.notifyTopic.replace(/\//g, '.'));

      ch.prefetch(prefetch);

      ch.consume(amqpQueue.cfgQ, (msg) => {
        let buff = msg.fields.routingKey.split('.');
        if (buff.length !== 5) {
          return;
        }
        // msg.tenantId = buff[2];
        msg.scadaId = buff[3];
        events.emit('config', msg);
      }, { noAck: false });

      ch.consume(amqpQueue.dataQ, (msg) => {
        let buff = msg.fields.routingKey.split('.');
        if (buff.length !== 5) {
          return;
        }
        // msg.tenantId = buff[2];
        msg.scadaId = buff[3];
        events.emit('data', msg);
      }, { noAck: false });

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
