const studentService = require("../services/studentService");

/**
 * Create Student
 */
exports.createStudent = async (req, res) => {
  try {
    const student = await studentService.createStudent(req.body);
    
    res.status(201).json({
      success: true,
      data: student
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Get Active Students
 */
exports.getStudents = async (req, res) => {
  try {
    
    const students = await studentService.getActiveStudents();
    
    res.json({
      success: true,
      count: students.length,
      data: students
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Get Student By Id
 */
exports.getStudent = async (req, res) => {
  try {
    
    const student = await studentService.getStudentById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    res.json({
      success: true,
      data: student
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Update Student
 */
exports.updateStudent = async (req, res) => {
  try {
    
    const student = await studentService.updateStudent(
      req.params.id,
      req.body
    );
    
    res.json({
      success: true,
      data: student
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Change Student Status
 */
exports.changeStatus = async (req, res) => {
  
  try {
    
    const student = await studentService.changeStudentStatus(
      req.params.id,
      req.body.status
    );
    
    res.json({
      success: true,
      data: student
    });
    
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message
    });
    
  }
  
};