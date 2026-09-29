require('dotenv').config();

const express = require('express');
const connectDB = require('./db');
const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Student Auth API is running');
});

app.use('/auth', authRoutes);
app.use('/students', studentRoutes);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
});

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Server is running on PORT:${port}`));
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
