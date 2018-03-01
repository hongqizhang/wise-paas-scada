'use strict';

module.exports.amqpTopics = {
  baseTopic: '.wisepaas.scada.%s.*',
  configTopic: '.wisepaas.scada.*.cfg',   // /wisepaas/scada/<scadaId>/cfg
  dataTopic: '.wisepaas.scada.*.data',
  connTopic: '.wisepaas.scada.*.conn',
  cmdTopic: '.wisepaas.scada.*.cmd'
};

module.exports.amqpQueue = {
  cfgQ: 'scada-ConfigQueue',
  dataQ: 'scada-DataQueue'
};

module.exports.mqttTopics = {
  configTopic: '/wisepaas/scada/%s/cfg',   // /wisepaas/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/scada/%s/data',
  scadaConnTopic: '/wisepaas/scada/%s/conn',
  deviceConnTopic: '/wisepaas/scada/%s/%s/conn',   // wisepaas/scada/<scadaId>/<deviceId>/conn
  scadaCmdTopic: '/wisepaas/scada/%s/cmd',
  deviceCmdTopic: '/wisepaas/scada/%s/%s/cmd',
  ackTopic: '/wisepaas/scada/%s/ack',
  cfgackTopic: '/wisepaas/scada/%s/cfgack',
  notifyTopic: '/wisepaas/scada/%s/notify'         // for cloud app to notify worker

};
