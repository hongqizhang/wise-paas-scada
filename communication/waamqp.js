'use strict';

const amqp = require('amqplib/callback_api');
const EventEmitter = require('events');
const watopics = require('../common/watopics.js');

const waCfgQ = 'waCfgQ';
const waDataQ = 'waDataQ';
const waConnQ = 'waConnQ';
const exchangeName = 'amq.topic';

let events = new EventEmitter();
let connection = null;
let channel = null;

function _connect (conf, callback) {
  let url = {
    protocol: 'amqp',
    hostname: conf.hostname || '127.0.0.1',
    port: conf.port || 5672,
    username: conf.username,
    password: conf.username
  };

  amqp.connect(url, function (err, conn) {
    if (err) {
      console.error('[AMQPConnectError] ' + err);
      callback(err);
      return;
    }

    connection = conn;
    connection.createChannel(function (err, ch) {
      if (err) {
        callback(err);
        return;
      }

      ch.assertQueue(waCfgQ, { durable: true });
      ch.assertQueue(waDataQ, { durable: true });
      ch.assertQueue(waConnQ, { durable: true });

      // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
      ch.bindQueue(waCfgQ, exchangeName, watopics.configTopic.replace(/\//g, '.'));
      ch.bindQueue(waDataQ, exchangeName, watopics.dataTopic.replace(/\//g, '.'));
      ch.bindQueue(waConnQ, exchangeName, watopics.connTopic.replace(/\//g, '.'));
      ch.prefetch(1);
      // /wisepaas/general/scada/<scadaId>/cfg
      ch.consume(waCfgQ, function (msg) {
        let buff = msg.fields.routingKey.split('.');
        if (buff.length !== 6) {
          return;
        }
        let tenantID = buff[2];
        let scadaId = buff[4];
        // console.log(' [cfg] Received %s', msg.content.toString());
        events.emit('config', tenantID, scadaId, msg.content.toString());
      }, { noAck: true });

      ch.consume(waDataQ, function (msg) {
        let buff = msg.fields.routingKey.split('.');
        if (buff.length !== 6) {
          return;
        }
        let tenantID = buff[2];
        let scadaId = buff[4];
        // console.log(' [data] Received %s', msg.content.toString());
        events.emit('data', tenantID, scadaId, msg.content.toString());
      }, { noAck: true });

      ch.consume(waConnQ, function (msg) {
        let buff = msg.fields.routingKey.split('.');
        if (buff.length !== 6) {
          return;
        }
        let tenantID = buff[2];
        let scadaId = buff[4];
        // console.log(' [connection] Received %s', msg.content.toString());
        events.emit('conn', tenantID, scadaId, msg.content.toString());
      }, { noAck: true });

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

/* class WaAMQP {
  constructor () {
    this.events = new EventEmitter();
    this.conn = null;
    this.channel = null;
  }

  connect (conf) {
    let deferred = Q.defer();
    let url = {
      protocol: 'amqp',
      hostname: conf.hostname || '127.0.0.1',
      port: conf.port || 5672,
      username: conf.username,
      password: conf.username
    };

    let self = this;
    amqp.connect(url, function (err, conn) {
      if (err) {
        deferred.reject(err);
        return deferred.promise;
      }

      self.conn = conn;
      conn.createChannel(function (err, ch) {
        if (err) {
          deferred.reject(err);
          return deferred.promise;
        }

        ch.assertQueue(waQ, { durable: true });

        // binding mqtt topic to queue, and '/' must be replaced to '.' in topic
        ch.bindQueue(waQ, exchangeName, watopics.scada_topic.replace(/\//g, '.'));
        ch.prefetch(1);
        // /wisepaas/general/scada/<scadaId>/cfg
        ch.consume(waQ, function (msg) {
          let buff = msg.fields.routingKey.split('.');
          if (buff.length !== 6) {
            return;
          }
          let tenantID = buff[2];
          let scadaId = buff[4];

          switch (buff[buff.length - 1]) {
            case 'cfg':
              console.log(' [cfg] Received %s', msg.content.toString());
              this.events.emit('config', tenantID, scadaId, msg.content.toString());
              break;
            case 'data':
              console.log(' [data] Received %s', msg.content.toString());
              self.events.emit('data', tenantID, scadaId, msg.content.toString());
              break;
            case 'conn':
              console.log(' [connection] Received %s', msg.content.toString());
              self.events.emit('conn', tenantID, scadaId, msg.content.toString());
              break;
          }
        }, { noAck: true });

        self.channel = ch;

        deferred.resolve();
      });
    });

    return deferred.promise;
  }

  close () {
    if (this.channel) {
      this.channel.close();
    }
    if (this.conn) {
      this.conn.close();
    }
  }
}

module.exports = WaAMQP; */
