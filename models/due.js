const mongoose = require("mongoose");

const DueSchema = new mongoose.Schema({
  
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
  
  totalDue: {
    type: Number,
    default: 0
  },
  
  pendingMonths: [{
    month: Number,
    year: Number,
    amount: Number
  }],
  
  reason: {
    type: String,
    default: ""
  },
  
  recoverable: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

module.exports = mongoose.model("Due", DueSchema);