const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  
  action: {
    type: String,
    required: true
  },
  
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    default: null
  },
  
  familyCode: {
    type: String,
    default: ""
  },
  
  details: {
    type: String,
    default: ""
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
  
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);