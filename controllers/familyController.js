const Student = require('../models/student');
const Family = require('../models/family');

// नई Family + सभी Members Add
exports.createFamily = async (req, res) => {
  try {

    const {
      familyCode,
      splitType,
      totalFamilyFee,
      dueDate,
      batch,
      identity,
      joinDate,
      members
    } = req.body;

    // पहले Family Save
    const family = new Family({
      code: familyCode,
      monthlyFee: totalFamilyFee,
      dueDate,
      splitType
    });

    await family.save();

    // Auto Split
    let autoFee = 0;

    if (splitType === "auto") {
      autoFee = Math.round(totalFamilyFee / members.length);
    }

    // सभी Members Save
    for (const member of members) {

      await Student.create({

        name: member.name,

        identity,

        familyCode,

        batch,

        dueDate,

        joinDate,

        isFamilyFee: true,

        monthlyFee:
          splitType === "auto"
            ? autoFee
            : member.monthlyFee,

        active: true

      });

    }

    res.json({
      success: true,
      message: "Family Created Successfully"
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};

// Family Status
exports.familyStatus = async (req, res) => {

  try {

    const members = await Student.find({
      familyCode: req.params.code
    });

    res.json(members);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};