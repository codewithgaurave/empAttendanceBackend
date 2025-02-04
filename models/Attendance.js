const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null }
  }, { timestamps: true });
  
  module.exports = mongoose.model('Attendance', AttendanceSchema);