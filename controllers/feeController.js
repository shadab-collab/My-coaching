const Student = require("../models/student");
const Family = require("../models/family");

function today() {
  const d = new Date();
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Single Student Fee
exports.markStudentFee = async (req, res) => {

  try {

    const student = await Student.findById(req.params.id);

    if (!student)
      return res.status(404).json({
        error: "Student not found"
      });

    const {
      month,
      year,
      status,
      paidAmount,
      note
    } = req.body;

    const idx = student.fees.findIndex(
      x => x.month === month && x.year === year
    );

    const feeObj = {
      month,
      year,
      status,
      paidAmount,
      note,
      paidOn:
        status === "unpaid"
          ? "बाकी"
          : today()
    };

    if (idx >= 0)
      student.fees[idx] = feeObj;
    else
      student.fees.push(feeObj);

    await student.save();

    res.json(student);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

// Family Fee
exports.markFamilyFee = async (req, res) => {

  try {

    const family = await Family.findOne({
      code: req.params.code
    });

    if (!family)
      return res.status(404).json({
        error: "Family not found"
      });

    const members = await Student.find({
      familyCode: req.params.code,
      active: true
    });

    const {
      month,
      year,
      status,
      paidAmount,
      note
    } = req.body;

    const split = Math.round(
      paidAmount / members.length
    );

    for (const student of members) {

      const idx = student.fees.findIndex(
        x => x.month === month &&
             x.year === year
      );

      const feeObj = {
        month,
        year,
        status,
        paidAmount: split,
        note,
        paidOn:
          status === "unpaid"
            ? "बाकी"
            : today()
      };

      if (idx >= 0)
        student.fees[idx] = feeObj;
      else
        student.fees.push(feeObj);

      await student.save();

    }

    family.paymentHistory.push({

      month,
      year,
      paidAmount,
      paidOn: today(),
      note

    });

    await family.save();

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};