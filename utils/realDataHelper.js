'use strict';

const util = require('util');

const constant = require('../common/const');
const RealData = require('../models/real-data');

function _getRealData (params, callback) {
  try {
    let scadas = (params.map(item => item.scadaId));
    let selection = {};
    params.forEach((param) => {
      selection['tags.' + param.tagName] = 1;
    });
    RealData.find({ _id: { $in: scadas } }, selection, (err, results) => {
      if (err) {
        callback(err);
      } else {
        params.forEach((param) => {
          let tag = {};
          let doc = results.find(o => o._id === param.scadaId);
          if (doc && doc.tags && doc.tags[param.tagName]) {
            tag = doc.tags[param.tagName];
          }
          param.value = (typeof tag.value !== 'undefined') ? tag.value : constant.badTagValue;
          param.ts = tag.ts || '';
        });

        callback(null, params);
      }
    });
  } catch (err) {
    callback(err);
  }
}

function _updateRealData (scadaId, params, options, callback) {
  try {
    if (Array.isArray(params) === false) {
      params = [params];
    }

    if (!scadaId || typeof scadaId !== 'string') {
      return callback(new Error('scadaId can not be null !'));
    }

    let upsert = options.upsert || false;
    RealData.findOneAndUpdate({ _id: scadaId }, { $setOnInsert: { tags: {} } }, { upsert: upsert, new: true }, (err, doc) => {
      if (err) {
        return callback(err);
      }
      if (!doc) {
        return callback(new Error(util.format('SCADA [%s] does not exist', scadaId)));
      }

      for (let i = 0; i < params.length; i++) {
        let param = params[i];
        if (typeof param.ts === 'string') {
          param.ts = new Date(param.ts);
        }
        if (typeof params[i].value === 'object') {   // for array tag
          let newValue = {};
          if (doc.tags[param.tagName] && doc.tags[param.tagName].value && typeof doc.tags[param.tagName].value === 'object') {
            newValue = doc.tags[param.tagName].value;
          }
          for (var key in param.value) {
            newValue[key] = param.value[key];
          }
          param.value = newValue;
        }
        doc.tags[param.tagName] = { value: param.value, ts: param.ts, opTS: new Date() };
      }
      RealData.collection.save(doc);
      callback();
    });

    /* var bulk = RealData.collection.initializeOrderedBulkOp();
    bulk.find({ _id: scadaId }).upsert().updateOne({ $pull: { tags: { name: { $in: tagNamelist } } } });
    bulk.find({ _id: scadaId }).updateOne({ $push: { tags: { $each: params } } });
    bulk.execute();

    callback(); */

    /* RealData.update({ _id: scadaId }, {
      $pull: { tags: { name: { $in: tagNamelist } } }
    }, { upsert: upsert }, (err, result) => {
      if (err) {
        return callback(err);
      }

      RealData.update({ _id: scadaId }, {
        $push: { tags: { $each: params } }
      }, (err, result) => {
        if (err) {
          return callback(err);
        }

        let response = { ok: false };
        if (result && result.n) {
          response.ok = (result.n === 1);
        }
        callback(null, response);
      });
    }); */

    /* if (type === 'object') {  // array tag
      RealData.findOne({ _id: id }, (err, result) => {
        if (err) {
          return callback(err);
        }
        if (upsert === false) {
          if (!result || !result.value) {
            let err = 'tag not found !';
            return callback(err);
          }
        }
        let newValue = (result && result.value && typeof result.value === 'object') ? result.value : {};
        for (var key in param.value) {
          newValue[key] = param.value[key];
        }
        RealData.update({ _id: id }, { value: newValue, ts: ts }, { upsert: upsert }, (err, result) => {
          if (err) {
            callback(err);
          }
          let response = { ok: false };
          if (result && result.n) {
            response.ok = (result.n === 1);
          }
          callback(null, response);
        });
      });
    } else {
      RealData.update({ _id: id }, { value: param.value, ts: ts }, { upsert: upsert }, (err, result) => {
        if (err) {
          return callback(err);
        }
        let response = { ok: false };
        if (result && result.n) {
          response.ok = (result.n === 1);
        }
        callback(null, response);
      });
    } */
  } catch (err) {
    callback(err);
  }
}

function _deleteRealData (scadaId, callback) {
  if (!scadaId) {
    return callback(new Error('scadaId can not be null !'));
  }
  let regex = new RegExp('^' + scadaId, 'i');
  RealData.remove({ _id: { $regex: regex } }, (err, result) => {
    if (err) {
      callback(err);
      return;
    }
    let response = { ok: false };
    if (result && result.result && result.result.n) {
      response.ok = (result.n > 0);
    }
    callback(null, response);
  });
}

module.exports = {
  getRealData: _getRealData,
  updateRealData: _updateRealData,
  deleteRealData: _deleteRealData
};
