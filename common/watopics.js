'use strict';

module.exports.amqpTopics = {
  configTopic: '/wisepaas/*/scada/*/cfg',   // /wisepaas/<tenantId>/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/*/scada/*/data',
  connTopic: '/wisepaas/*/scada/*/conn',
  cmdTopic: '/wisepaas/*/scada/*/cmd',
  notifyTopic: '/wisepaas/*/scada/*/notify'         // for cloud app to notify worker
};

module.exports.amqpQueue = {
  cfgQ: 'waCfgQ',
  dataQ: 'waDataQ',
  connQ: 'waConnQ',
  cmdQ: 'waCmdQ',
  notifyQ: 'waNotifyQ'
};

module.exports.mqttTopics = {
  configTopic: '/wisepaas/%s/scada/%s/cfg',   // /wisepaas/<tenantId>/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/%s/scada/%s/data',
  connTopic: '/wisepaas/%s/scada/%s/conn',
  cmdTopic: '/wisepaas/%s/scada/%s/cmd',
  ackTopic: '/wisepaas/%s/scada/%s/ack',
  notifyTopic: '/wisepaas/%s/scada/%s/notify'         // for cloud app to notify worker

};
