const Student = require("../models/student");

/**
 * Create New Student
 */
async function createStudent(data) {
  
  const student = new Student(data);
  
  await student.save();
  
  return student;
  
}

/**
 * Get Active Students
 */
async function getActiveStudents() {
  
  return await Student.find({
    status: "ACTIVE"
  }).sort({
    name: 1
  });
  
}

/**
 * Get Student By ID
 */
async function getStudentById(id) {
  
  return await Student.findById(id);
  
}

/**
 * Update Student
 */
async function updateStudent(id, data) {
  
  return await Student.findByIdAndUpdate(
    id,
    data,
    {
      new: true
    }
  );
  
}

/**
 * Active / Inactive Student
 */
async function changeStudentStatus(id, status) {
  
  return await Student.findByIdAndUpdate(
    id,
    {
      status
    },
    {
      new: true
    }
  );
  
}

module.exports = {
  
  createStudent,
  
  getActiveStudents,
  
  getStudentById,
  
  updateStudent,
  
  changeStudentStatus
  
};