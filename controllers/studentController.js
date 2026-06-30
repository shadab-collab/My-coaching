const Student = require("../models/student");

// सभी Active Students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({ active: true }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// नया Student
exports.addStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student Edit
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(student);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// Active / Inactive
exports.changeStatus = async (req, res) => {

  try {

    const student = await Student.findById(req.params.id);

    if (!student)
      return res.status(404).json({
        error: "Student not found"
      });

    student.active = !student.active;

    await student.save();

    res.json(student);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};