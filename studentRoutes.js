const express = require('express');
const router = express.Router();

const authMiddleware = require('./authMiddleware');
const requireRole = require('./roleMiddleware');
const {
  getAllStudents,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('./studentController');


router.get('/', authMiddleware, getAllStudents);

router.get('/stats', authMiddleware, getStudentStats);
router.get('/:id', authMiddleware, getStudentById);


router.post('/', authMiddleware, requireRole('admin'), createStudent);
router.put('/:id', authMiddleware, requireRole('admin'), updateStudent);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteStudent);

module.exports = router;
