// models/ledger.js

const mongoose = require("mongoose");

const LedgerSchema = new mongoose.Schema({
  
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
    default: null
  },
  
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  year: {
    type: Number,
    required: true
  },
  
  feeCharged: {
    type: Number,
    default: 0
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  paidAmount: {
    type: Number,
    default: 0
  },
  
  balance: {
    type: Number,
    default: 0
  },
  
  status: {
    type: String,
    enum: [
      "UNPAID",
      "PARTIAL",
      "PAID",
      "WAIVED"
    ],
    default: "UNPAID"
  },
  
  receipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Receipt",
    default: null
  },
  
  remarks: {
    type: String,
    default: ""
  }
  
}, {
  timestamps: true
});

module.exports = mongoose.model("Ledger", LedgerSchema);