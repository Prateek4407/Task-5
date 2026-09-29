const Student = require('./Student');


async function getAllStudents(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.course) {
      filter.course = req.query.course;
    }

  
    const [students, totalItems] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Student.countDocuments(filter)
    ]);

    return res.status(200).json({
      status: 'success',
      data: students,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error while fetching students.' });
  }
}


async function getStudentStats(req, res) {
  try {
    const round2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);

    const [result] = await Student.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                averageAge: { $avg: '$age' },
                youngest: { $min: '$age' },
                oldest: { $max: '$age' }
              }
            }
          ],
          byCourse: [
            {
              $group: {
                _id: '$course',
                count: { $sum: 1 },
                averageAge: { $avg: '$age' }
              }
            },
            { $sort: { count: -1, _id: 1 } }
          ]
        }
      }
    ]);

    const overall = result.overall[0] || { totalStudents: 0, averageAge: null, youngest: null, oldest: null };

    return res.status(200).json({
      status: 'success',
      data: {
        totalStudents: overall.totalStudents,
        averageAge: round2(overall.averageAge),
        youngest: overall.youngest,
        oldest: overall.oldest,
        byCourse: result.byCourse.map((c) => ({
          course: c._id,
          count: c.count,
          averageAge: round2(c.averageAge)
        }))
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error while computing stats.' });
  }
}

async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found.' });
    }
    return res.status(200).json({ status: 'success', data: student });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ status: 'error', message: 'Invalid student ID.' });
    }
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error while fetching the student.' });
  }
}

async function createStudent(req, res) {
  try {
    const { name, age, course } = req.body;
    if (!name || !age || !course) {
      return res.status(400).json({ status: 'error', message: 'name, age, and course are all required.' });
    }
    const newStudent = await Student.create({ name, age, course });
    return res.status(201).json({ status: 'success', message: 'Student added successfully.', data: newStudent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error while creating the student.' });
  }
}

async function updateStudent(req, res) {
  try {
    const { name, age, course } = req.body;
    if (!name || !age || !course) {
      return res.status(400).json({ status: 'error', message: 'name, age, and course are all required.' });
    }
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, age, course },
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found.' });
    }
    return res.status(200).json({ status: 'success', message: 'Student updated successfully.', data: student });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ status: 'error', message: 'Invalid student ID.' });
    }
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error while updating the student.' });
  }
}

async function deleteStudent(req, res) {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found.' });
    }
    return res.status(200).json({ status: 'success', message: 'Student deleted successfully.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ status: 'error', message: 'Invalid student ID.' });
    }
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error while deleting the student.' });
  }
}

module.exports = { getAllStudents, getStudentStats, getStudentById, createStudent, updateStudent, deleteStudent };
