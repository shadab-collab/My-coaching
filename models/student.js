const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  
  // Basic Details
  name: { type: String, required: true },
  identity: { type: String },
  familyCode: { type: String },
  
  dueDate: {
    type: Number,
    enum: [1, 15],
    default: 1
  },
  
  batch: {
    type: String,
    enum: ['1-5', '6-8', '9', '10', 'CBSE', ''],
    default: ''
  },
  
  monthlyFee: {
    type: Number,
    default: 0
  },
  
  isFamilyFee: {
    type: Boolean,
    default: false
  },
  
  // ===== NEW V3 FIELDS =====
  
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'LEFT'],
    default: 'ACTIVE'
  },
  
  clearTillMonth: {
    type: Number,
    default: 6
  },
  
  clearTillYear: {
    type: Number,
    default: 2026
  },
  
  openingDue: {
    type: Number,
    default: 0
  },
  
  remarks: {
    type: String,
    default: ''
  },
  
  inactiveDate: Date,
  
  leftDate: Date,
  
  rejoinDate: Date,
  
  // ==========================
  
  fees: [{
    month: String,
    
    year: Number,
    
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial', 'advance'],
      default: 'unpaid'
    },
    
    paidAmount: {
      type: Number,
      default: 0
    },
    
    paidOn: {
      type: String,
      default: 'बाकी'
    },
    
    note: String
  }],
  
  joinDate: Date,
  
  verify: {
    type: Boolean,
    default: false
  },
  
  active: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);