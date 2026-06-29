const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Family = require('../models/family');

// आज की तारीख को "DD MMM YYYY" फ़ॉर्मेट में बदलने का फंक्शन
function getFormattedTodayDate() {
  const d = new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ active: true }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/family/:code', async (req, res) => {
  try {
    const students = await Student.find({ familyCode: req.params.code, active: true });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    if (req.body.familyCode && req.body.isFamilyFee) {
      await Family.findOneAndUpdate(
        { code: req.body.familyCode },
        { code: req.body.familyCode, monthlyFee: req.body.monthlyFee, dueDate: req.body.dueDate },
        { upsert: true, new: true }
      );
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/fees', async (req, res) => {
  try {
    const { month, year, status, paidAmount, note } = req.body;
    const student = await Student.findById(req.params.id);
    const idx = student.fees.findIndex(f => f.month === month && f.year === year);
    
    const paidOnDate = (status === 'paid' || status === 'advance' || status === 'partial') ? getFormattedTodayDate() : 'बाकी';

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

router.put('/family/:code/fees', async (req, res) => {
  try {
    const { month, year, status, paidAmount, note } = req.body;
    const students = await Student.find({ familyCode: req.params.code, active: true });
    const paidOnDate = (status === 'paid' || status === 'advance' || status === 'partial') ? getFormattedTodayDate() : 'बाकी';

    for (let s of students) {
      const idx = s.fees.findIndex(f => f.month === month && f.year === year);
      if (idx > -1) {
        s.fees[idx] = { month, year, status, paidAmount, note, paidOn: paidOnDate };
      } else {
        s.fees.push({ month, year, status, paidAmount, note, paidOn: paidOnDate });
      }
      await s.save();
    }
    res.json({ message: 'done' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/family/:code', async (req, res) => {
  try {
    await Student.deleteMany({ familyCode: req.params.code });
    res.json({ message: 'Family deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'done' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;