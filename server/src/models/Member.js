const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
  {
    memberCode: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide member full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide member email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate memberCode if missing
MemberSchema.pre('save', async function () {
  if (!this.memberCode) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.memberCode = `AF-${Date.now().toString().slice(-4)}${randomDigits.toString().slice(-2)}`;
  }
});

module.exports = mongoose.model('Member', MemberSchema);
