const Family = require("../models/family");
const Student = require("../models/student");
const familyEngine = require("../services/familyEngine");

/**
 * Add Student to Family
 */
exports.addMember = async (req, res) => {
  
  try {
    
    const { familyCode, studentId } = req.body;
    
    const family = await Family.findOne({ code: familyCode });
    
    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family not found"
      });
    }
    
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    family.members.push({
      student: student._id,
      active: true
    });
    
    family.history.push({
      action: "ADD_MEMBER",
      note: student.name + " added"
    });
    
    await family.save();
    
    res.json({
      success: true,
      message: "Member Added Successfully",
      family
    });
    
  } catch (err) {
    
    res.status(500).json({
      success: false,
      error: err.message
    });
    
  }
  
};