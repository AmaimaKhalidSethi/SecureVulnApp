const User = require('../models/User');
const { logIdorAttempt } = require('../utils/logStore');

const isOwner = (req, targetId) => req.user.id === targetId.toString();

exports.getUserById = async (req, res) => {
  const config   = req.appConfig;
  const targetId = req.params.id;
  try {
    if (!config.data.enforceOwnership) {
      if (req.user.id !== targetId) logIdorAttempt(req, targetId, false);
      const user = await User.findById(targetId).select('-password');
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      return res.json({ success: true, mode: config.modeName, user,
        warning: req.user.id !== targetId ? `⚠️ IDOR: accessed user ${targetId} with different token` : undefined });
    }
    if (!isOwner(req, targetId) && req.user.role !== 'admin') {
      logIdorAttempt(req, targetId, true);
      return res.status(403).json({ success: false, error: 'Access denied — you can only view your own profile' });
    }
    const user = await User.findById(targetId).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, mode: config.modeName, user });
  } catch (err) {
    const isCastError = err.name === 'CastError';
    const msg = (config.errors.verbose && !isCastError) ? err.message : 'Resource not found';
    return res.status(404).json({ success: false, error: msg });
  }
};

exports.updateUser = async (req, res) => {
  const config   = req.appConfig;
  const targetId = req.params.id;
  try {
    if (!config.data.enforceOwnership) {
      const { password: _pw, __v, ...safeBody } = req.body;
      const updated = await User.findByIdAndUpdate(targetId, { $set: safeBody }, { new: true, runValidators: true }).select('-password');
      if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
      return res.json({ success: true, mode: config.modeName, user: updated, warning: '⚠️ VULNERABLE: Updated another user (IDOR)' });
    }
    if (!isOwner(req, targetId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied — you can only edit your own profile' });
    }
    const allowedFields = ['username', 'email'];
    const updateData    = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: `Only these fields can be updated: ${allowedFields.join(', ')}` });
    }
    const updated = await User.findByIdAndUpdate(targetId, { $set: updateData }, { new: true, runValidators: true }).select('-password');
    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, mode: config.modeName, user: updated });
  } catch (err) {
    const isCastError = err.name === 'CastError';
    const msg = (config.errors.verbose && !isCastError) ? err.message : 'Update failed';
    return res.status(500).json({ success: false, error: msg });
  }
};

exports.deleteUser = async (req, res) => {
  const config   = req.appConfig;
  const targetId = req.params.id;
  try {
    if (!config.data.enforceOwnership) {
      const deleted = await User.findByIdAndDelete(targetId);
      if (!deleted) return res.status(404).json({ success: false, error: 'User not found' });
      return res.json({ success: true, mode: config.modeName, message: `⚠️ VULNERABLE: Deleted user ${deleted.username}` });
    }
    if (!isOwner(req, targetId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied — you can only delete your own account' });
    }
    const deleted = await User.findByIdAndDelete(targetId);
    if (!deleted) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, mode: config.modeName, message: `Account ${deleted.username} deleted` });
  } catch (err) {
    const isCastError = err.name === 'CastError';
    const msg = (config.errors.verbose && !isCastError) ? err.message : 'Delete failed';
    return res.status(500).json({ success: false, error: msg });
  }
};

exports.listUsers = async (req, res) => {
  const config = req.appConfig;
  try {
    if (!config.data.enforceOwnership) {
      const users = await User.find().select('-password');
      return res.json({ success: true, mode: config.modeName, count: users.length, users, warning: '⚠️ VULNERABLE: Full user list exposed' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required to list users' });
    }
    const users = await User.find().select('-password');
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};