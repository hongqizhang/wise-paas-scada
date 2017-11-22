'use strict';

module.exports.amqpTopics = {
  configTopic: '/wisepaas/scada/*/cfg',   // /wisepaas/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/scada/*/data',
  connTopic: '/wisepaas/scada/*/conn',
  cmdTopic: '/wisepaas/scada/*/cmd',
  notifyTopic: '/wisepaas/scada/*/notify'         // for cloud app to notify worker
};

module.exports.amqpQueue = {
  cfgQ: 'scada-ConfigQueue',
  dataQ: 'scada-DataQueue',
  connQ: 'scada-ConnQueue',
  cmdQ: 'scada-CmdQueue',
  notifyQ: 'scada-NotifyQueue'
};

module.exports.mqttTopics = {
  configTopic: '/wisepaas/scada/%s/cfg',   // /wisepaas/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/scada/%s/data',
  connTopic: '/wisepaas/scada/%s/conn',
  cmdTopic: '/wisepaas/scada/%s/cmd',
  ackTopic: '/wisepaas/scada/%s/ack',
  cfgackTopic: '/wisepaas/scada/%s/cfgack',
  notifyTopic: '/wisepaas/scada/%s/notify'         // for cloud app to notify worker

};
