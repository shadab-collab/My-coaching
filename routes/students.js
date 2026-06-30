const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Family = require('../models/family');

// आज की तारीख को "DD MMM YYYY" फ़ॉर्मेट में बदलने का फंक्शन (e.g. 30 Jun 2026)
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

// फ़ैमिली को एक साथ जोड़ने का नया बल्क रूट
router.post('/bulk', async (req, res) => {
  try {
    const { familyCode, isFamilyFee, totalFamilyFee, dueDate, joinDate, batch, identity, members } = req.body;
    
    // फ़ैमिली कॉन्फ़िगरेशन सहेजें
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
        monthlyFee: isFamilyFee ? 0 : (m.individualFee || 0) // अगर फिक्स डील है तो यहाँ 0 रहेगा, बाद में स्प्लिट होगा
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

// फ़ैमिली फीस जमा करने का कंबाइंड प्रोपोरशनल स्प्लिट महा-लॉजिक
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
            // अगर फिक्स फ़ैमिली फीस डील है, तो कुल जमा राशि को सभी बच्चों में बराबर बाँटें
            memberShare = Math.round(totalToDistribute / totalMembers);
            distributedSum += memberShare;
          } else if (totalExpectedFee > 0) {
            // अगर व्यक्तिगत अलग-अलग फीस तय है, तो रेशियो (अनुपात) के हिसाब से बाँटें (e.g. 300:500)
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