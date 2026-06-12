const Comment  = require('../models/Comment');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { logXssAttempt } = require('../utils/logStore');

const window    = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const XSS_PATTERN = /<script|onerror|onload|javascript:|<img|<svg|alert\(/i;

exports.createComment = async (req, res) => {
  const config  = req.appConfig;
  const { content, author } = req.body;

  if (!content) return res.status(400).json({ success: false, error: 'Content required' });

  try {
    const hasXss = XSS_PATTERN.test(content);

    let storedContent;
    if (config.input.sanitizeInputs) {
      storedContent = DOMPurify.sanitize(content);
    } else {
      storedContent = content;
    }

    if (hasXss) {
      logXssAttempt(req, JSON.stringify({ q: rawQuery }).substring(0, 200), ...);
    }

    const comment = await Comment.create({
      content:          storedContent,
      rawContent:       content,
      sanitizedContent: DOMPurify.sanitize(content),
      author:           author || 'anonymous',
      storedInMode:     config.modeName,
    });

    res.status(201).json({ success: true, mode: config.modeName, comment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
};

exports.search = async (req, res) => {
  const config   = req.appConfig;
  const rawQuery = req.query.q || '';

  let searchedFor;
  if (config.input.sanitizeInputs) {
    searchedFor = rawQuery
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  } else {
    searchedFor = rawQuery;
  }

  try {
    const comments = await Comment.find({
      content: { $regex: rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    }).limit(20);

    res.json({ success: true, mode: config.modeName, searchedFor, count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};