const Attendance = require('../models/Attendance');
const moment = require('moment');

exports.checkIn = async (req, res) => {
    try {
        const { employeeId, localTime, localDate } = req.body;
        
        // Use the date and time provided by the client
        const date = localDate || moment().format('YYYY-MM-DD');
        const time = localTime || moment().format('HH:mm:ss');

        let attendance = await Attendance.findOne({ employee: employeeId, date });
        if (attendance) return res.status(400).json({ message: 'Already checked in today' });

        const newAttendance = new Attendance({
            employee: employeeId,
            date,
            checkIn: time
        });
        await newAttendance.save();

        res.status(200).json({ message: 'Check-in successful', attendance: newAttendance });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const { employeeId, localTime, localDate } = req.body;
        
        // Use the date and time provided by the client
        const date = localDate || moment().format('YYYY-MM-DD');
        const time = localTime || moment().format('HH:mm:ss');

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


exports.getMonthlyReport = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        
        // Validate month and year
        const startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD');
        const endDate = moment(startDate).endOf('month');
        
        // Get all attendance records for the employee in the specified month
        const attendanceRecords = await Attendance.find({
            employee: employeeId,
            date: {
                $gte: startDate.format('YYYY-MM-DD'),
                $lte: endDate.format('YYYY-MM-DD')
            }
        }).populate('employee', 'name');

        // Get total working days (excluding weekends)
        const totalDays = endDate.date();
        const workingDays = countWorkingDays(startDate, endDate);

        // Calculate present days
        const presentDays = attendanceRecords.length;

        // Calculate absent days (working days - present days)
        const absentDays = workingDays - presentDays;

        // Calculate late arrivals (check-in after 9:00 AM)
        const lateArrivals = attendanceRecords.filter(record => {
            const checkInTime = moment(record.checkIn, 'HH:mm:ss');
            return checkInTime.isAfter(moment('09:00:00', 'HH:mm:ss'));
        }).length;

        // Calculate early departures (check-out before 5:00 PM)
        const earlyDepartures = attendanceRecords.filter(record => {
            if (!record.checkOut) return false;
            const checkOutTime = moment(record.checkOut, 'HH:mm:ss');
            return checkOutTime.isBefore(moment('17:00:00', 'HH:mm:ss'));
        }).length;

        // Calculate attendance percentage
        const attendancePercentage = (presentDays / workingDays) * 100;

        // Generate daily attendance status
        const dailyStatus = generateDailyStatus(startDate, endDate, attendanceRecords);

        const report = {
            employeeName: attendanceRecords[0]?.employee.name || 'Unknown',
            employeeId,
            month: startDate.format('MMMM'),
            year,
            summary: {
                totalDays,
                workingDays,
                presentDays,
                absentDays,
                lateArrivals,
                earlyDepartures,
                attendancePercentage: attendancePercentage.toFixed(2) + '%'
            },
            dailyStatus
        };

        res.status(200).json(report);
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to count working days (excluding weekends)
function countWorkingDays(startDate, endDate) {
    let workingDays = 0;
    let currentDate = moment(startDate);

    while (currentDate <= endDate) {
        // 0 = Sunday, 6 = Saturday
        if (currentDate.day() !== 0 && currentDate.day() !== 6) {
            workingDays++;
        }
        currentDate.add(1, 'days');
    }

    return workingDays;
}

// Helper function to generate daily attendance status
function generateDailyStatus(startDate, endDate, attendanceRecords) {
    const dailyStatus = [];
    let currentDate = moment(startDate);

    while (currentDate <= endDate) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const record = attendanceRecords.find(r => r.date === dateStr);
        
        const status = {
            date: dateStr,
            dayOfWeek: currentDate.format('dddd'),
            status: getAttendanceStatus(currentDate, record),
            checkIn: record?.checkIn || null,
            checkOut: record?.checkOut || null
        };

        dailyStatus.push(status);
        currentDate.add(1, 'days');
    }

    return dailyStatus;
}

// Helper function to determine attendance status
function getAttendanceStatus(date, record) {
    // Weekend check
    if (date.day() === 0 || date.day() === 6) {
        return 'WEEKEND';
    }
    
    if (!record) {
        return 'ABSENT';
    }

    const checkInTime = moment(record.checkIn, 'HH:mm:ss');
    const isLate = checkInTime.isAfter(moment('09:00:00', 'HH:mm:ss'));

    if (record.checkOut) {
        const checkOutTime = moment(record.checkOut, 'HH:mm:ss');
        const isEarlyDeparture = checkOutTime.isBefore(moment('17:00:00', 'HH:mm:ss'));
        
        if (isLate && isEarlyDeparture) return 'LATE_AND_EARLY_DEPARTURE';
        if (isLate) return 'LATE';
        if (isEarlyDeparture) return 'EARLY_DEPARTURE';
        return 'PRESENT';
    }

    return isLate ? 'LATE' : 'PRESENT';
}

// Get report for all employees
exports.getAllEmployeesMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        
        // Get all unique employees who have attendance records
        const employees = await Attendance.distinct('employee');
        
        // Generate report for each employee
        const reports = await Promise.all(
            employees.map(async (employeeId) => {
                const report = await generateEmployeeReport(employeeId, month, year);
                return report;
            })
        );

        res.status(200).json(reports);
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to generate individual employee report
async function generateEmployeeReport(employeeId, month, year) {
    const startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD');
    const endDate = moment(startDate).endOf('month');
    
    const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: {
            $gte: startDate.format('YYYY-MM-DD'),
            $lte: endDate.format('YYYY-MM-DD')
        }
    }).populate('employee', 'name');

    const workingDays = countWorkingDays(startDate, endDate);
    const presentDays = attendanceRecords.length;

    return {
        employeeName: attendanceRecords[0]?.employee.name || 'Unknown',
        employeeId,
        month: startDate.format('MMMM'),
        year,
        presentDays,
        absentDays: workingDays - presentDays,
        attendancePercentage: ((presentDays / workingDays) * 100).toFixed(2) + '%'
    };
}