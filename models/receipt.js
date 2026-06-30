// models/receipt.js

const mongoose = require("mongoose");

const ReceiptSchema = new mongoose.Schema({
  
  receiptNo: {
    type: Number,
    required: true,
    unique: true
  },
  
  receiptDate: {
    type: Date,
    default: Date.now
  },
  
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
    default: null
  },
  
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  
  months: [{
    month: Number,
    year: Number
  }],
  
  totalAmount: {
    type: Number,
    required: true
  },
  
  paymentMode: {
    type: String,
    enum: [
      "Cash",
      "Online",
      "UPI",
      "Bank"
    ],
    default: "Cash"
  },
  
  remarks: {
    type: String,
    default: ""
  },
  
  receivedBy: {
    type: String,
    default: "Admin"
  }
  
}, {
  timestamps: true
});

module.exports = mongoose.model("Receipt", ReceiptSchema);