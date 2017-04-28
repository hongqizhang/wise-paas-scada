'use strict';

module.exports = {
  scadaTopic: '/wisepaas/general/scada/#',
  configTopic: '/wisepaas/*/scada/*/cfg',   // /wisepaas/<tenantId>/scada/<scadaId>/cfg
  dataTopic: '/wisepaas/*/scada/*/data',
  connTopic: '/wisepaas/*/scada/*/conn'

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
