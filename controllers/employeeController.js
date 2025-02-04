const Employee = require('../models/Employee');

exports.addEmployee = async (req, res) => {
  try {
    const { name } = req.body;
    const employee = new Employee({ name });
    await employee.save();
    res.status(201).json({ message: 'Employee added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};