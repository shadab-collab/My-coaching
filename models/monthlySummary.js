const mongoose = require("mongoose");

const MonthlySummarySchema = new mongoose.Schema({
  
  month: Number,
  
  year: Number,
  
  totalCollection: {
    type: Number,
    default: 0
  },
  
  totalStudents: {
    type: Number,
    default: 0
  },
  
  newAdmissions: {
    type: Number,
    default: 0
  },
  
  inactiveStudents: {
    type: Number,
    default: 0
  },
  
  leftStudents: {
    type: Number,
    default: 0
  },
  
  remarks: {
    type: String,
    default: ""
  }
  
}, {
  timestamps: true
});

module.exports = mongoose.model("MonthlySummary", MonthlySummarySchema);