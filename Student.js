const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true
    },
    course: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);


studentSchema.index({ course: 1, createdAt: -1 });


studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', studentSchema);
