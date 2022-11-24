const express = require('express');
const router = express.Router();
const UserController = require('../src/v1/api/controllers/UserController');
const path = require('path');
const {dirname} = require('path');

global.base_path = dirname(require.main.filename)


/* GET users listing. */
router.get('/', (req, res) => {
    res.json({message:{message:'respond with a resource'},status:200,error:false});
});

const v1 = require('../src/v1/api/routes/index');
router.use('/api/v1',v1);
router.get('/verify-email/:id', UserController.verifyMail);

module.exports = router;
