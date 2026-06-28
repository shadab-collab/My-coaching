const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  familyCode: { type: String },
  fatherName: { type: String },
  class: { type: String },
  board: { type: String, default: 'Bihar' },
  dueDate: { type: Number, enum: [1, 15] },
  monthlyFee: { type: Number },
  fees: [{
    month: { type: String },
    year: { type: Number },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial', 'advance'],
      default: 'unpaid'
    },
    paidAmount: { type: Number, default: 0 },
    paidOn: { type: Date },
    note: { type: String }
  }],
  joinDate: { type: Date },
  verify: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
