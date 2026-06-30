const express = require("express");
const router = express.Router();

const studentController = require("../controllers/studentController");
const familyController = require("../controllers/familyController");
const feeController = require("../controllers/feeController");

router.get("/", studentController.getStudents);

router.post("/", studentController.addStudent);

router.put("/:id", studentController.updateStudent);

router.put("/:id/status", studentController.changeStatus);

router.post("/bulk", familyController.createFamily);

router.get("/family/:code", familyController.familyStatus);

router.put("/family/:code/fees", feeController.markFamilyFee);

router.put("/:id/fees", feeController.markStudentFee);

module.exports = router;