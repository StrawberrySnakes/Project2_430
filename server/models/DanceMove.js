// models/DanceMove.js
// Mongoose model for dance move posts. Each move belongs to an owner (Account), has a category, description, optional video URL, and a visibility flag.

const mongoose = require('mongoose');
const _ = require('underscore');

const setTitle = (title) => _.escape(title).trim();

const DanceMoveSchema = new mongoose.Schema({
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
  // Dance style category for filtering/browsing
  category: {
    type: String,
    required: true,
    enum: ['salsa', 'bachata', 'merengue', 'chacha', 'other'],
    default: 'other',
  },
  // URL to an externally hosted video (YouTube, etc.) — direct upload can come later
  videoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  // Path to a directly uploaded file (served at /assets/uploads/<filename>)
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
DanceMoveSchema.statics.toAPI = (doc) => ({
  title: doc.title,
  description: doc.description,
  category: doc.category,
  videoUrl: doc.videoUrl,
  mediaUrl: doc.mediaUrl,
  mediaType: doc.mediaType,
  isPublic: doc.isPublic,
  createdDate: doc.createdDate,
});

const DanceMoveModel = mongoose.model('DanceMove', DanceMoveSchema);
module.exports = DanceMoveModel;