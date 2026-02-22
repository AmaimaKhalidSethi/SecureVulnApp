const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type:      String,
    required:  [true, 'Username is required'],
    unique:    true,
    trim:      true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    index:     true,
  },
  password: {
    type:     String,
    required: [true, 'Password is required'],
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user',
  },
  createdInMode:       { type: String, default: 'unknown' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil:         { type: Date,   default: null },
}, {
  timestamps: true,
  toJSON:     { versionKey: false },
  toObject:   { versionKey: false },
});

UserSchema.methods.toSafeObject = function () {
  return {
    _id:           this._id,
    username:      this.username,
    email:         this.email,
    role:          this.role,
    createdInMode: this.createdInMode,
    createdAt:     this.createdAt,
    updatedAt:     this.updatedAt,
  };
};

module.exports = mongoose.model('User', UserSchema);