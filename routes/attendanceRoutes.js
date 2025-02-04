const express = require('express');
const { checkIn, checkOut, getAttendanceByDate ,getAllEmployeesMonthlyReport, getMonthlyReport} = require('../controllers/attendanceController');
const attendanceRouter = express.Router();

attendanceRouter.post('/checkin', checkIn);
attendanceRouter.post('/checkout', checkOut);
attendanceRouter.get('/by-date', getAttendanceByDate);
// Get monthly report for a specific employee
attendanceRouter.get('/report/monthly', getMonthlyReport);

// Get monthly report for all employees
attendanceRouter.get('/report/monthly/all', getAllEmployeesMonthlyReport);


module.exports = attendanceRouter;