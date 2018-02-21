const Promise = require('bluebird');

const DeviceStatus = require('../models/device-status.js');

function _getScadaStatus (ids) {
  return new Promise((resolve, reject) => {
    try {
      DeviceStatus.find({ _id: { $in: ids } }, (err, results) => {
        if (err) {
          reject(err);
        }
        let response = [];
        for (let i = 0; i < ids.length; i++) {
          let id = ids[i];
          let result = results.find(d => d._id === id);
          let scada = {
            id: id,
            status: (result && result.status !== undefined) ? result.status : false,
            modified: (result && result.modified !== undefined) ? result.modified : false,
            ts: (result) ? result.ts : new Date()
          };
          response.push(scada);
        }
        resolve(response);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function _getDeviceStatus(params) {
  return new Promise((resolve, reject) => {
    try{
      let condition = { $or: [] };
      for (let i = 0; i < params.length; i++) {
        condition['$or'].push({ _id: params[i].scadaId, 'devices.d': params[i].deviceId });
      }

      DeviceStatus.find(condition, (err, results) => {
        if (err) {
          return reject(err);
        }
        let response = [];
        for (let i = 0; i < params.length; i++) {
          let param = params[i];
          let obj = {
            scadaId: param.scadaId,
            deviceId: param.deviceId,
            status: false,
            ts: new Date()
          };
          let scada = results.find(s => s._id === param.scadaId);
          if (scada) {
            let device = scada.devices.find(d => d.d === param.deviceId);
            if (device) {
              obj.status = (device.status !== undefined) ? device.status : false;
              obj.ts = (device.ts !== undefined) ? device.ts : new Date();
            }
          }
          response.push(obj);
        }
        resolve(response);
      });
    } catch(err) {
      reject(err);
    }
  });
}

function _updateScadaStatus (id, param) {
  return new Promise((resolve, reject) => {
    DeviceStatus.update({ _id: id }, param, (err, result) => {
      if (err) {
        reject(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n > 0);
      }
      resolve(response);
    });
  });
}

function _upsertScadaStatus (params) {
  return new Promise((resolve, reject) => {
    let promises = [];
    for (let i = 0; i < params.length; i++) {
      promises.push(__updateDeviceStatus(params[i]));
    }
    Promise.all(promises)
      .then((results) => {
        resolve(results);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function _deleteScadaStatus (id) {
  return new Promise((resolve, reject) => {
    DeviceStatus.remove({ _id: id }, (err, result) => {
      if (err) {
        reject(err);
      }
      let response = { ok: false };
      if (result && result.result && result.result.n) {
        response.ok = (result.result.n > 0);
      }
      resolve(response);
    });
  });
}

function __updateDeviceStatus (param) {
  return new Promise((resolve, reject) => {
    DeviceStatus.update({ _id: param.scadaId }, {
      _id: param.scadaId,
      status: param.status || false,
      modified: param.modified || false,
      ts: param.ts || new Date(),
      devices: []
    }, { upsert: true }, (err, result) => {
      if (err) {
        reject(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n > 0);
      }
      resolve(response);
    });
  });
}

function _updateModifiedStatus (id, modified) {
  return new Promise((resolve, reject) => {
    DeviceStatus.update({ _id: id }, { modified: modified }, { upsert: false }, (err, result) => {
      if (err) {
        reject(err);
      }
      let response = { ok: false };
      if (result && result.n) {
        response.ok = (result.n === 1);
      }
      resolve(response);
    });
  });
}

module.exports = {
  getScadaStatus: _getScadaStatus,
  getDeviceStatus: _getDeviceStatus,
  updateScadaStatus: _updateScadaStatus,
  updateModifiedStatus: _updateModifiedStatus,
  upsertScadaStatus: _upsertScadaStatus,
  deleteScadaStatus: _deleteScadaStatus
};
