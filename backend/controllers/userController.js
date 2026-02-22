const { logGeneric } = require('../utils/logStore');

exports.changePassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ success: false, error: 'New password required' });
  logGeneric('PASSWORD_CHANGED', 'INFO', req, { outcome: 'ALLOWED', userId: req.user.id });
  res.json({ success: true, message: `Password changed for user ${req.user.id}` });
};

exports.changeEmail = async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ success: false, error: 'New email required' });
  logGeneric('EMAIL_CHANGED', 'INFO', req, { outcome: 'ALLOWED', userId: req.user.id });
  res.json({ success: true, message: `Email changed to ${newEmail}` });
};

exports.deleteAccount = async (req, res) => {
  logGeneric('ACCOUNT_DELETED', 'HIGH', req, { outcome: 'ALLOWED', userId: req.user.id });
  res.json({ success: true, message: `Account ${req.user.id} deleted` });
};

exports.transfer = async (req, res) => {
  const { amount, toAccount } = req.body;
  logGeneric('TRANSFER_EXECUTED', 'HIGH', req, { outcome: 'ALLOWED', userId: req.user.id, amount, toAccount });
  res.json({ success: true, message: `Transferred $${amount} to ${toAccount}` });
};