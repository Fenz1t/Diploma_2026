const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { handleUpload } = require('../middlewares/uploadMiddleware');
const { validate, common, employee } = require('../middlewares/validators');

// GET /api/employees - все сотрудники
router.get('/', employeeController.getAll);

router.get('/:id', 
  validate(common.idValidator), 
  employeeController.getById
);

router.post('/', 
  handleUpload,
  validate(employee.createEmployeeValidator),
  employeeController.create
);

router.put('/:id', 
  validate(common.idValidator),
  handleUpload,
  validate(employee.updateEmployeeValidator),
  employeeController.update
);

router.delete('/:id', 
  validate(common.idValidator),
  employeeController.delete
);

router.patch('/:id/activate',
  validate(common.idValidator),
  employeeController.activate
);

router.delete('/:id/photo',
  validate(common.idValidator),
  employeeController.deletePhoto
);

router.get('/department/:id',
  validate(common.idValidator),
  employeeController.getByDepartment
);

module.exports = router;