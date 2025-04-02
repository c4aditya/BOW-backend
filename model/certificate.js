const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  fatherName: {
    type: String,
    required: [true, 'Father\'s Name is required'],
    trim: true
  },
  enrollmentNumber: {
    type: String,
    required: [true, 'Enrollment Number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact Number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit contact number']
  }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
