const express = require('express');
const { checkIn, checkOut, getAttendanceByDate } = require('../controllers/attendanceController');
const attendanceRouter = express.Router();

attendanceRouter.post('/checkin', checkIn);
attendanceRouter.post('/checkout', checkOut);
attendanceRouter.get('/by-date', getAttendanceByDate);

module.exports = attendanceRouter;