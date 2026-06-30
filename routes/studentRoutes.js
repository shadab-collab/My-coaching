const express = require("express");

const router = express.Router();

const studentController = require("../controllers/studentController");

// Student APIs

router.get("/", studentController.getStudents);

router.get("/:id", studentController.getStudent);

router.post("/", studentController.createStudent);

router.put("/:id", studentController.updateStudent);

router.patch("/:id/status", studentController.changeStatus);

module.exports = router;