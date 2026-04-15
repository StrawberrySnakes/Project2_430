const mongoose = require('mongoose');
const _ = require('underscore');

const setName = (name) => _.escape(name).trim();

const DomoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },
  age: {
    type: Number,
    min: 0,
    required: true,
  },
  color: {
    type: String,
    required: true,
    enum: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    default: 'blue',
  },
  lastPetted: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

DomoSchema.statics.toAPI = (doc) => ({
  name: doc.name,
  age: doc.age,
  color: doc.color,
  lastPetted: doc.lastPetted,
});

const DomoModel = mongoose.model('Domo', DomoSchema);
module.exports = DomoModel;