const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
  
  // Family Code (AA, AR, BABLOO...)
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Family Name (Optional)
  name: {
    type: String,
    default: ""
  },
  
  // Total Monthly Family Fee
  monthlyFee: {
    type: Number,
    default: 0
  },
  
  // Due Date (1 or 15)
  dueDate: {
    type: Number,
    enum: [1, 15],
    default: 1
  },
  
  // AUTO / MANUAL Split
  splitType: {
    type: String,
    enum: ["Auto", "Manual"],
    default: "Auto"
  },
  
  // Active Family
  active: {
    type: Boolean,
    default: true
  },
  
  // General Note
  note: {
    type: String,
    default: ""
  },
  
  // Family Members
  members: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },
    
    customFee: {
      type: Number,
      default: 0
    },
    
    active: {
      type: Boolean,
      default: true
    },
    
    joinedAt: {
      type: Date,
      default: Date.now
    },
    
    leftAt: Date
  }],
  
  // Payment History
  paymentHistory: [{
    month: String,
    year: Number,
    paidAmount: Number,
    paidOn: String,
    note: String
  }],
  
  // Family History
  history: [{
    action: String,
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
  
}, {
  timestamps: true
});

module.exports = mongoose.model("Family", familySchema);