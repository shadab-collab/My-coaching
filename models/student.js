const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identity: { type: String },
  familyCode: { type: String },
  dueDate: { type: Number, enum: [1, 15] },
  batch: {
    type: String,
    enum: ['1-5', '6-8', '9', '10', 'CBSE', ''],
    default: ''
  },
  monthlyFee: { type: Number, default: 0 },
  isFamilyFee: { type: Boolean, default: false },
  fees: [{
    month: { type: String },
    year: { type: Number },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial', 'advance'],
      default: 'unpaid'
    },
    paidAmount: { type: Number, default: 0 },
    paidOn: { type: String, default: 'बाकी' },
    note: { type: String }
  }],
  joinDate: { type: Date },
  verify: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);