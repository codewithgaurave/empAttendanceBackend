const Attendance = require('../models/Attendance');
const moment = require('moment');

// Check-in function
exports.checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const date = moment.utc().format('YYYY-MM-DD');  // Store the date in UTC
    const time = moment.utc().format('HH:mm:ss');   // Store the time in UTC

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

// Check-out function
exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const date = moment.utc().format('YYYY-MM-DD');  // Store the date in UTC
    const time = moment.utc().format('HH:mm:ss');   // Store the time in UTC

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

// Get attendance by date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const attendanceRecords = await Attendance.find({ date }).populate('employee', 'name');
    
    // Convert check-in and check-out times to local time
    const formattedAttendanceRecords = attendanceRecords.map(record => {
      return {
        ...record.toObject(),
        checkIn: moment.utc(record.checkIn).local().format('HH:mm:ss'),  // Convert to local time
        checkOut: record.checkOut ? moment.utc(record.checkOut).local().format('HH:mm:ss') : null // Convert to local time
      };
    });

    res.status(200).json(formattedAttendanceRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};