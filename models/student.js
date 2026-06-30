const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identity: { type: String }, // गार्जियन या पहचान का नाम
  familyCode: { type: String }, // जैसे: AA, SZA, AR
  dueDate: { type: Number, enum: [1, 15], default: 1 },
  batch: {
    type: String,
    enum: ['1-5', '6-8', '9', '10', 'CBSE', ''],
    default: ''
  },
  monthlyFee: { type: Number, default: 0 }, // इंडिविजुअल फीस
  isFamilyFee: { type: Boolean, default: false }, // क्या यह फ़िक्स फ़ैमिली डील है
  fees: [{
    month: { type: String },
    year: { type: Number },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial', 'advance'],
      default: 'unpaid'
    },
    paidAmount: { type: Number, default: 0 },
    paidOn: { type: String, default: 'बाकी' }, // कब दिये (जैसे "29 Jun 2026")
    note: { type: String }
  }],
  joinDate: { type: Date },
  verify: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);