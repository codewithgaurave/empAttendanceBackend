const Attendance = require('../models/Attendance');
const moment = require('moment');

exports.checkIn = async (req, res) => {
    try {
      const { employeeId } = req.body;
      const date = moment().format('YYYY-MM-DD');
      const time = moment().format('HH:mm:ss');
  
      let attendance = await Attendance.findOne({ employee: employeeId, date });
      if (attendance) return res.status(400).json({ message: 'Already checked in today' });
  
      const newAttendance = new Attendance({ employee: employeeId, date, checkIn: time });
      await newAttendance.save();
  
      res.status(200).json({ message: 'Check-in successful', attendance: newAttendance });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  

  exports.checkOut = async (req, res) => {
    try {
      const { employeeId } = req.body;
      const date = moment().format('YYYY-MM-DD');
      const time = moment().format('HH:mm:ss');
  
      let attendance = await Attendance.findOne({ employee: employeeId, date });
      if (!attendance) return res.status(400).json({ message: 'Check-in record not found' });
      if (attendance.checkOut) return res.status(400).json({ message: 'Already checked out today' });
  
      attendance.checkOut = time;
      await attendance.save();
  
      res.status(200).json({ message: 'Check-out successful', attendance });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

  exports.getAttendanceByDate = async (req, res) => {
    try {
      const { date } = req.query;
      const attendanceRecords = await Attendance.find({ date }).populate('employee', 'name');
      res.status(200).json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
