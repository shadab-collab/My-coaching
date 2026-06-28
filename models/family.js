const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  monthlyFee: { type: Number, default: 0 },
  dueDate: { type: Number, enum: [1, 15] },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);
