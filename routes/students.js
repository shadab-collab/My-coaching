const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Family = require('../models/family');

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
    const feeIndex = student.fees.findIndex(f => f.month === month && f.year === year);
    if (feeIndex > -1) {
      student.fees[feeIndex] = { month, year, status, paidAmount, note, paidOn: new Date() };
    } else {
      student.fees.push({ month, year, status, paidAmount, note, paidOn: new Date() });
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
    for (let student of students) {
      const feeIndex = student.fees.findIndex(f => f.month === month && f.year === year);
      if (feeIndex > -1) {
        student.fees[feeIndex] = { month, year, status, paidAmount, note, paidOn: new Date() };
      } else {
        student.fees.push({ month, year, status, paidAmount, note, paidOn: new Date() });
      }
      await student.save();
    }
    res.json({ message: 'Family fees updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
