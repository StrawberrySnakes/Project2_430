// models/Events.js
// Mongoose model for events. Each event belongs to an owner (Account), has a title, description, date, and a visibility flag.

const mongoose = require('mongoose');
const _ = require('underscore');

const setTitle = (title) => _.escape(title).trim();

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    set: setTitle,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  // Event category for filtering/browsing
  category: {
    type: String,
    required: true,
    enum: ['social','lesson', 'workshop', 'festival', 'other'],
    default: 'other',
  },
  mediaUrl: {
    type: String,
    trim: true,
    default: '',
  },
  mediaType: {
    type: String,
    enum: ['video', 'image', 'link'],
    default: 'link',
  },
  // Controls whether this post appears on the public feed or only to the owner
  isPublic: {
    type: Boolean,
    default: true,
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

// Converts to a safe API-facing object (no internal fields exposed)
EventSchema.statics.toAPI = (doc) => ({
  title: doc.title,
  description: doc.description,
  category: doc.category,
  imageUrl: doc.imageUrl,
  mediaUrl: doc.mediaUrl,
  mediaType: doc.mediaType,
  isPublic: doc.isPublic,
  createdDate: doc.createdDate,
});

const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;