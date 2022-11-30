const jwt = require('jsonwebtoken');
const env = require('dotenv');
env.config();
// const config = require('../config');

const generate = async ({ data, expiresIn }) => jwt.sign(data, process.env.APP_TOKEN, expiresIn ? { expiresIn } : {});

module.exports = {
  generate
};
