const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Family = require('../models/family');

// आज की तारीख का "DD MMM YYYY" फ़ॉर्मेट
function getFormattedTodayDate() {
  const d = new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// सभी सक्रिय छात्र प्राप्त करें
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ active: true }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// नया छात्र जोड़ें
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    if (req.body.familyCode && req.body.isFamilyFee) {
      await Family.findOneAndUpdate(
        { code: req.body.familyCode },
        { monthlyFee: req.body.monthlyFee, dueDate: req.body.dueDate },
        { upsert: true }
      );
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// इंडिविजुअल छात्र की फीस अपडेट (Non-Family Students)
router.put('/:id/fees', async (req, res) => {
  try {
    const { month, year, status, paidAmount, note, paidOn } = req.body;
    const student = await Student.findById(req.params.id);
    
    if (!student) return res.status(404).json({ error: "छात्र नहीं मिला" });

    const paidOnDate = paidOn || (status !== 'unpaid' ? getFormattedTodayDate() : 'बाकी');
    const idx = student.fees.findIndex(f => f.month === month && f.year === year);
    
    if (idx > -1) {
      student.fees[idx] = { month, year, status, paidAmount, note, paidOn: paidOnDate };
    } else {
      student.fees.push({ month, year, status, paidAmount, note, paidOn: paidOnDate });
    }
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// फैमिली फीस अपडेट (प्रोफेशनल तरीका: अब Family मॉडल में पेमेंट हिस्ट्री सेव होगी)
router.put('/family/:code/fees', async (req, res) => {
  try {
    const { month, year, status, paidAmount, note } = req.body;
    const paidOnDate = (status !== 'unpaid') ? getFormattedTodayDate() : 'बाकी';

    // 1. फैमिली के पेमेंट हिस्ट्री में रिकॉर्ड जोड़ें
    await Family.findOneAndUpdate(
      { code: req.params.code },
      { 
        $push: { 
          paymentHistory: { month, year, paidAmount, paidOn: paidOnDate, note } 
        } 
      }
    );

    // 2. छात्रों के फीस एरे को अपडेट करें
    const students = await Student.find({ familyCode: req.params.code, active: true });
    const totalMembers = students.length;
    const share = totalMembers > 0 ? Math.round(paidAmount / totalMembers) : 0;

    for (let s of students) {
      const idx = s.fees.findIndex(f => f.month === month && f.year === year);
      const feeData = { month, year, status, paidAmount: share, note: note || "Family Payment", paidOn: paidOnDate };

      if (idx > -1) s.fees[idx] = feeData;
      else s.fees.push(feeData);
      await s.save();
    }
    res.json({ message: 'Family payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// छात्र को हटाना (सक्रिय स्टेटस बंद करना)
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'छात्र को निष्क्रिय किया गया' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;