
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./Student');

const sampleStudents = [
  { name: 'Aman Gupta', age: 20, course: 'CSE' },
  { name: 'Riya Sharma', age: 21, course: 'CSE' },
  { name: 'Kunal Verma', age: 19, course: 'CSE' },
  { name: 'Priya Singh', age: 22, course: 'CSE' },
  { name: 'Rohan Mehta', age: 20, course: 'CSE' },
  { name: 'Ananya Rao', age: 21, course: 'IT' },
  { name: 'Vikram Joshi', age: 19, course: 'IT' },
  { name: 'Sneha Patel', age: 20, course: 'IT' },
  { name: 'Arjun Nair', age: 23, course: 'IT' },
  { name: 'Divya Reddy', age: 20, course: 'IT' },
  { name: 'Karan Malhotra', age: 22, course: 'ECE' },
  { name: 'Neha Kapoor', age: 21, course: 'ECE' },
  { name: 'Siddharth Rao', age: 19, course: 'ECE' },
  { name: 'Pooja Iyer', age: 20, course: 'ECE' },
  { name: 'Aditya Kumar', age: 21, course: 'MECH' },
  { name: 'Ishita Bose', age: 20, course: 'MECH' },
  { name: 'Rahul Chatterjee', age: 22, course: 'MECH' },
  { name: 'Meera Pillai', age: 19, course: 'CIVIL' },
  { name: 'Yash Agarwal', age: 20, course: 'CIVIL' },
  { name: 'Tanvi Desai', age: 21, course: 'CIVIL' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const inserted = await Student.insertMany(sampleStudents);
    console.log(`Inserted ${inserted.length} students.`);

    await mongoose.disconnect();
    console.log('Done. Connection closed.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();