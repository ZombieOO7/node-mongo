const express = require('express');
const router = express.Router()
const Multer = require('multer')
const path = require('path')

const GlobalAuthClass = require('../../../modules/middleware/auth');
const UserController = require('../../api/controllers/UserController');

// register api
router.post('/sign-up', GlobalAuthClass.initialAuthenticate,UserController.signup);

// sign in api
router.post('/sign-in', GlobalAuthClass.initialAuthenticate,UserController.signin);


module.exports = router;
