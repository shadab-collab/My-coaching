const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  monthlyFee: { type: Number, default: 0 }, // कुल फिक्स डील (जैसे 800)
  dueDate: { type: Number, enum: [1, 15], default: 1 },
  splitType: { type: String, enum: ['Auto', 'Manual'], default: 'Auto' }, // फीस बाँटने का प्रकार
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);