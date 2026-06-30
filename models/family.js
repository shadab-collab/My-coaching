const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  monthlyFee: { type: Number, default: 0 }, // पूरी फैमिली की कुल फीस
  dueDate: { type: Number, enum: [1, 15], default: 1 },
  splitType: { type: String, enum: ['Auto', 'Manual'], default: 'Auto' },
  note: { type: String },
  // नया प्रोफेशनल पेमेंट हिस्ट्री रिकॉर्ड
  paymentHistory: [{
    month: String,
    year: Number,
    paidAmount: Number,
    paidOn: String, // तारीख
    note: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Family', familySchema);