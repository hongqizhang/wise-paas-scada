'use strict';

const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let configRecordSchema = new Schema({
  _id: String,   // scadaId
  records: [{
    scada: Object,
    ts: {
      type: Date,
      default: Date.now
    }
  }]
}, { collection: 'scada_CfgModifiedRecord', versionKey: false, strict: false });

mongoose.model('ConfigRecord', configRecordSchema);

module.exports = mongoose.model('ConfigRecord');
