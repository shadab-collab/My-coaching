const Student = require("../models/student");

/**
 * Create Student
 */
async function createStudent(data) {
  return await Student.create(data);
}

/**
 * Get All Active Students
 */
async function getActiveStudents() {
  return await Student.find({
    active: true
  }).sort({
    name: 1
  });
}

/**
 * Get All Students
 */
async function getAllStudents() {
  return await Student.find().sort({
    name: 1
  });
}

/**
 * Get Student By Id
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
      new: true,
      runValidators: true
    }
  );
}

/**
 * Soft Delete
 */
async function deactivateStudent(id) {
  return await Student.findByIdAndUpdate(
    id,
    {
      active: false
    },
    {
      new: true
    }
  );
}

/**
 * Restore Student
 */
async function activateStudent(id) {
  return await Student.findByIdAndUpdate(
    id,
    {
      active: true
    },
    {
      new: true
    }
  );
}

/**
 * Family Members
 */
async function getFamilyMembers(code) {
  return await Student.find({
    familyCode: code,
    active: true
  }).sort({
    name: 1
  });
}

module.exports = {
  
  createStudent,
  
  getActiveStudents,
  
  getAllStudents,
  
  getStudentById,
  
  updateStudent,
  
  deactivateStudent,
  
  activateStudent,
  
  getFamilyMembers
  
};