// models/Comment.js
// ============================================================
// COMMENT SCHEMA
// In vulnerable mode: raw HTML/JS stored directly
// In secure mode: sanitized before storage
// ============================================================

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content:          { type: String, required: true },
  rawContent:       { type: String },
  sanitizedContent: { type: String },
  author:           { type: String, default: 'anonymous' },
  storedInMode:     { type: String, default: 'unknown' },
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);