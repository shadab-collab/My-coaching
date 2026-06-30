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

router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ active: true }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// फ़ैमिली को एक साथ जोड़ने का बल्क रूट
router.post('/bulk', async (req, res) => {
  try {
    const { familyCode, isFamilyFee, totalFamilyFee, dueDate, joinDate, batch, identity, members } = req.body;
    
    // फ़ैमिली कॉन्फ़िगरेशन को सहेजें
    if (familyCode && isFamilyFee) {
      await Family.findOneAndUpdate(
        { code: familyCode },
        { code: familyCode, monthlyFee: totalFamilyFee, dueDate: dueDate },
        { upsert: true, new: true }
      );
    }

    const savedStudents = [];
    for (let m of members) {
      const studentData = {
        name: m.name,
        identity: identity,
        familyCode: familyCode,
        dueDate: dueDate,
        batch: batch,
        joinDate: joinDate,
        isFamilyFee: isFamilyFee,
        monthlyFee: isFamilyFee ? 0 : (m.monthlyFee || 0)
      };
      const student = new Student(studentData);
      await student.save();
      savedStudents.push(student);
    }
    res.json({ success: true, students: savedStudents });
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
    if (req.body.familyCode && req.body.isFamilyFee) {
      await Family.findOneAndUpdate(
        { code: req.body.familyCode },
        { monthlyFee: req.body.monthlyFee },
        { upsert: true }
      );
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/fees', async (req, res) => {
  try {
    const { month, year, status, paidAmount, note, paidOn } = req.body;
    const student = await Student.findById(req.params.id);
    const idx = student.fees.findIndex(f => f.month === month && f.year === year);
    
    // अगर अन-डू हो रहा है तो जो पुरानी डेट पास की है वही रखेंगे, वरना आज की डेट
    const paidOnDate = paidOn ? paidOn : (status === 'paid' || status === 'advance' || status === 'partial') ? getFormattedTodayDate() : 'बाकी';

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

// फ़ैमिली फीस अपडेट करने का कंबाइंड स्प्लिट लॉजिक
router.put('/family/:code/fees', async (req, res) => {
  try {
    const { month, year, status, paidAmount, note } = req.body;
    const students = await Student.find({ familyCode: req.params.code, active: true });
    const paidOnDate = (status === 'paid' || status === 'advance' || status === 'partial') ? getFormattedTodayDate() : 'बाकी';

    const totalMembers = students.length;
    if (totalMembers > 0) {
      const isPaying = (status === 'paid' || status === 'advance' || status === 'partial');
      const totalToDistribute = isPaying ? paidAmount : 0;

      const familyConfig = await Family.findOne({ code: req.params.code });
      const isFixedFamilyFee = students.some(s => s.isFamilyFee) || (familyConfig ? true : false);

      let totalExpectedFee = 0;
      if (isFixedFamilyFee && familyConfig) {
        totalExpectedFee = familyConfig.monthlyFee || 800;
      } else {
        totalExpectedFee = students.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
      }

      let distributedSum = 0;
      for (let i = 0; i < totalMembers; i++) {
        const s = students[i];
        let memberShare = 0;

        if (isPaying) {
          if (i === totalMembers - 1) {
            memberShare = totalToDistribute - distributedSum;
          } else if (isFixedFamilyFee) {
            memberShare = Math.round(totalToDistribute / totalMembers);
            distributedSum += memberShare;
          } else if (totalExpectedFee > 0) {
            memberShare = Math.round(totalToDistribute * ((s.monthlyFee || 0) / totalExpectedFee));
            distributedSum += memberShare;
          } else {
            memberShare = Math.round(totalToDistribute / totalMembers);
            distributedSum += memberShare;
          }
        }

        const idx = s.fees.findIndex(f => f.month === month && f.year === year);
        if (idx > -1) {
          s.fees[idx] = { month, year, status, paidAmount: memberShare, note, paidOn: paidOnDate };
        } else {
          s.fees.push({ month, year, status, paidAmount: memberShare, note, paidOn: paidOnDate });
        }
        await s.save();
      }
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