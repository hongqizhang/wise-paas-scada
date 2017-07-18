'use strict';

module.exports.amqpTopics = {
  configTopic: '/wisepaas/*/scada/*/cfg',   // /wisepaas/<tenantId>/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/*/scada/*/data',
  connTopic: '/wisepaas/*/scada/*/conn',
  cmdTopic: '/wisepaas/*/scada/*/cmd',
  notifyTopic: '/wisepaas/*/notify'         // for cloud app ipc

  /* cfg_topic: 'iot-2/evt/wacfg/fmt/',
  cmd_topic: 'iot-2/evt/wacmd/fmt/',
  conn_topic: 'iot-2/evt/waconn/fmt/',
  actd_topic: 'iot-2/evt/waactd/fmt/',
  actc_topic: 'iot-2/evt/waactc/fmt/',
  file_topic: 'iot-2/evt/wafile/fmt/',
  data_topic: 'iot-2/evt/wadata/fmt/',
  drc_topic: 'iot-2/evt/wadrc/fmt/',
  drd_topic: 'iot-2/evt/wadrd/fmt/',
  drn_topic: 'iot-2/evt/wadrn/fmt/' */
};

module.exports.mqttTopics = {
  configTopic: '/wisepaas/%s/scada/%s/cfg',   // /wisepaas/<tenantId>/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/%s/scada/%s/data',
  connTopic: '/wisepaas/%s/scada/%s/conn',
  cmdTopic: '/wisepaas/%s/scada/%s/cmd'
};

module.exports.amqpQueue = {
  cfgQ: 'waCfgQ',
  dataQ: 'waDataQ',
  connQ: 'waConnQ',
  cmdQ: 'waCmdQ',
  notifyQ: 'waNotifyQ'
};
