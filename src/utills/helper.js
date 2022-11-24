const promise = require("bluebird");
const jwt = require("jsonwebtoken");
const cryptoJs = require('crypto-js')
const env = require('dotenv');
const passwordHelper = require('./passwordHelper')
const nodemailer = require('nodemailer')
env.config();
const {
    ValidationError
} = require('sequelize');
const db = require('../data/models/index');
const date = new Date()
var moment = require('moment');

class Helper {
    async getOTP() {
        let num = String(Math.floor(Math.random() * 10000)).padEnd(5, 0);
        return num;
    }

    async getLink(admin_id, user_type) {
        let token = await this.getJwtToken(admin_id, user_type, true);
        return config.forgotPasswordLinkPrefix + token;
    }

    getJwtToken(user_id, user_type, for_admin) {
        try {
            let expirationTime = 300 * 60,
                sign = {
                    user_id: user_id,
                    user_type: user_type,
                };
            if (for_admin) {
                sign.is_admin = true;
                expirationTime = 300 * 60;
            }
            let token = jwt.sign(sign, config.JWTSecretKey, {
                expiresIn: expirationTime,
            });
            return token;
        } catch (error) {
            return promise.reject(error);
        }
    }


    refreshToken(old_token, refresh_token, for_user) {
        try {
            console.log("old_token ::: ", old_token);
            let token,
                decoded = jwt.decode(old_token);
            // console.log("decoded ::: ", decoded);
            if (refresh_token == config.refresh_token && decoded && decoded.user_id) {
                token = this.getJwtToken(decoded.user_id, decoded.user_type, for_user);
            } else {
                throw "TOKEN_MALFORMED";
            }
            return token;
        } catch (error) {
            return promise.reject(error);
        }
    }

    decodeToken(auth_token) {
        try {
            return new promise((resolve, reject) => {
                jwt.verify(auth_token, config.JWTSecretKey, async (error, decoded) => {
                    if (error) {
                        console.log(error);
                        reject("TOKEN_EXPIRED");
                    } else {
                        resolve(decoded);
                    }
                });
            });
        } catch (error) {
            return promise.reject(error);
        }
    }

    decodeTokenWithoutExipredCheck(token) {
        try {
            let tkn,
                decoded = jwt.decode(token);
            return decoded;
        } catch (error) {
            console.log(error);
        }
    }

    getDigitCode() {
        let date = new Date();
        let code = parseInt(date.getTime() / 1000).toString(16);
        return code;
    }

    getQRCode() {
        return randomstring.generate({
            length: 8,
            charset: "alphanumeric",
            capitalization: "uppercase",
        });
    }

    getEmailVerificationCode() {
        return randomstring.generate({
            length: 5,
            charset: "alphanumeric",
            capitalization: "uppercase",
        });
    }



    decodeEmailVelidationToken(body) {
        let token = jwt.decode(body);
        return token;
    }

    async passwordManager(body, db_password, flag) {
        try {
            console.log("flag", flag)
            console.log("body", body.password)
            console.log("db_password", db_password)

            //Decode crypto-JS encypted String
            var bytes = cryptoJs.AES.decrypt(body.password, process.env.SECRET_KEY);
            var originalText = bytes.toString(cryptoJs.enc.Utf8);

            console.log("decoded", originalText)

            // Convert decode string to bcrypt Encrypted String
            let encodePasswordText
            if (flag == 1) {
                // encodePasswordText = await passwordHelper.getPasswordHash(originalText)
                encodePasswordText = originalText
                console.log("flag_1", encodePasswordText)
                // checking incorrect password
                flag = 2
            } else {

                encodePasswordText = originalText
                console.log("flag_3", encodePasswordText)
            }

            // Validate password stored in Database and the encrypted string
            let passwordConfirmation = await passwordHelper.checkPassword(encodePasswordText, db_password, flag)
            return passwordConfirmation
        } catch (error) {
            console.log('error ==========>', error);
            return promise.reject(error);
        }
    }

    async sendMail(user, subject, html) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                auth: {
                    user: process.env.MAIL_USERNAME,
                    pass: process.env.MAIL_PASSWORD
                }
            });
            // send email
            await transporter.sendMail({
                from: process.env.MAIL_FROM_ADDRESS,
                to: user.email,
                subject: subject,
                html: html,
            });
            return ;
        } catch (err) {
            console.log('error ==========>', err);
            const error = new Error('MAIL NOT SEND');
            error.code = 500;
            return promise.reject(error);
        }
    }

    async errorMessage(error) {
        if (error instanceof ValidationError) {
            error = await error.errors[0].message;
            return await error;
        } else {
            // error = 'INTERNAL_SERVER_ERROR'
        }
        return await error;
        // if(error instanceof SequelizeDatabaseError){
        //     error = await error.parameters[0];
        //     return await error;
        // }
        return await error;

    }
    formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        const newdate = [year, month, day].join('-');
        return newdate;
    }



    formatDateAndTime(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        // hours = d.getHours();
        // minutes = d.getMinutes();
        // seconds = d.getSeconds();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        const newdate = [year, month, day].join('-');
        // const time = [hours, minutes, seconds].join(':');
        return newdate; //+' '+time;
    }
    validateRequestImage(req, name, type, min, max, isEssential) {
        return new promise((resolve, reject) => {
            if (Object.keys(req.files).length == 0) {
                resolve({
                    message: "IMAGE_NOT_FOUND"
                });
            }
            console.log("undefined==================", req.files.images);
            //console.log("\n\n\nreq.files.images ::: ", req.files.images.length);
            for (let i = 0; i < req.files.images.length; i++) {
                if (type) {
                    let type = req.files.images[i].name.split(".").pop();
                    let extensionArray = ["png", "jpg", "jpeg"];
                    if (!extensionArray.includes(type.toString().toLowerCase())) {
                        reject({
                            message: "WRONG_FILE_EXTENSION"
                        });
                    }
                }
                if (max) {
                    //console.log(req.files.images[i].size);
                    if (req.files.images[0].size > max) {
                        // For icon only. And icon must be come in first in array at 0 index...
                        reject({
                            message: "ICON_SIZE_LARGE"
                        });
                    }
                }
                if (req.files.images[i].size > 5000000) {
                    // Byte to mb. Max 5 MB file size.
                    reject({
                        message: "FILE_SIZE_LARGE"
                    });
                }
                if (isEssential && Object.keys(req.files).length == 0) {
                    reject({
                        message: "IMAGE_NOT_FOUND"
                    });
                }
            }
            resolve({
                message: "IMAGE_FOUND"
            });
        });
    }

    validateRequestImageFilter(req,name,type,min,max,isEssential,arrayName,demo_type) {
        // console.log("\n\n\n\nvalidateRequestImage :::", req);
        //console.log("\n\n\n\nvalidateRequestImage :::", req.files);
        return new promise((resolve, reject) => {
            if (Object.keys(req.files).length == 0) {
                resolve({
                    message: "IMAGE_NOT_FOUND"
                });
            }
            console.log("req files", req.files);
            for (let i = 0; i < req.files.length; i++) {
                if (type) {
                    let type = req.files[i].originalname.split(".").pop();
                    let extensionArray;
                    if (demo_type == 1) {
                        extensionArray = ["png", "jpg", "jpeg"];
                    } else {
                        extensionArray = ["x-m4v", "mp4"];
                    }
                    if (!extensionArray.includes(type.toString().toLowerCase())) {
                        reject({
                            message: "WRONG_FILE_EXTENSION"
                        });
                    }
                }
                if (max) {
                    //console.log(req.files.images[i].size);
                    if (req.files[0].size > max) {
                        // For icon only. And icon must be come in first in array at 0 index...
                        reject({
                            message: "ICON_SIZE_LARGE"
                        });
                    }
                }
                console.log("size================================", req.files[i].size);
                if (req.files[i].size > 5000000) {
                    // Byte to mb. Max 5 MB file size.
                    reject({
                        message: "FILE_SIZE_LARGE"
                    });
                }
                if (isEssential && Object.keys(req.files).length == 0) {
                    reject({
                        message: "IMAGE_NOT_FOUND"
                    });
                }
            }
            resolve({
                message: "IMAGE_FOUND"
            });
        });
    }
    async getAwsAccessAndSecretKey(req, res) {
        try {
            let data = await axios.get('http://169.254.169.254/latest/meta-data/iam/security-credentials/EC2toS3Role')
            return data.data
        } catch (error) {
            return promise.reject(error)
        }
    }
    formatDateWithTime(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear(),
            hours = d.getHours(),
            minutes = d.getMinutes(),
            seconds = d.getSeconds();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        const newdate = [year, month, day].join('-');
        const time = [hours, minutes, seconds].join(':');
        return newdate + ' ' + time;
    }
    minuteConverter(value) {
        const sec = parseInt(value, 10)/1000; // convert value to number if it's string
        let hours = Math.floor(sec / 3600); // get hours
        let minutes = Math.floor((sec - (hours * 3600)) / 60); // get minutes
        let seconds = sec - (hours * 3600) - (minutes * 60); //  get seconds
        // add 0 if value < 10; Example: 2 => 02
        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return hours + ':' + minutes + ':' + parseFloat(seconds).toFixed(0); // Return is HH : MM : SS
    }
    formatTime(date) {
        var d = new Date(date),
            hours = d.getHours(),
            minutes = d.getMinutes(),
            seconds = d.getSeconds();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const time = [hours, minutes].join(':');
        return time + ampm;
    }
    getYaxisRange(lowerBound, upperBound, _maxTicks) {
        console.log(lowerBound, upperBound);
        var maxTicks = _maxTicks || 10;
        var tickSpacing;
        var range;
        var niceLowerBound;
        var niceUpperBound;

        const calculater = calculate();

        this.setMaxTicks = function (_maxTicks) {
            maxTicks = _maxTicks;
            calculate();
        };

        this.getNiceUpperBound = function () {
            return niceUpperBound;
        };

        this.getNiceLowerBound = function () {
            return niceLowerBound;
        };

        this.getTickSpacing = function () {
            return tickSpacing;
        };

        function setMinMaxPoints(min, max) {
            lowerBound = min;
            upperBound = max;
            calculate();
        }

        function calculate() {
            range = niceNum(upperBound - lowerBound, false);
            tickSpacing = niceNum(range / (maxTicks - 1), true);
            niceLowerBound = Math.floor(lowerBound / tickSpacing) * tickSpacing;
            niceUpperBound = Math.ceil(upperBound / tickSpacing) * tickSpacing;
            var result = new Array();
            for (var i = niceLowerBound; i <= niceUpperBound; i = i + tickSpacing) {
                var rounded = Math.round((i + Number.EPSILON) * 100) / 100;
                result.push(rounded);
            }
            return result;
        }

        function niceNum(range, round) {
            var exponent = Math.floor(Math.log10(range));
            var fraction = range / Math.pow(10, exponent);
            var niceFraction;

            if (round) {
                if (fraction < 1.5) niceFraction = 1;
                else if (fraction < 3) niceFraction = 2;
                else if (fraction < 7) niceFraction = 5;
                else niceFraction = 10;
            } else {
                if (fraction <= 1) niceFraction = 1;
                else if (fraction <= 2) niceFraction = 2;
                else if (fraction <= 5) niceFraction = 5;
                else niceFraction = 10;
            }
            return niceFraction * Math.pow(10, exponent);
        }
        return calculater;
    }
    ageCalculate(dt1) {
        dt1 = new Date(dt1);
        var starts = moment(dt1);
        var ends = moment();
        var years = ends.diff(starts, 'year');
        starts.add(years, 'years');

        var months = ends.diff(starts, 'months');
        starts.add(months, 'months');

        var days = ends.diff(starts, 'days');
        if(days < 0 || years < 0 || months < 0){
            return '';
        }
        var string = '';
        if (years > 0) {
            if (years > 1) {
                string += years + ' Years ';
            } else {
                string += years + ' Year ';
            }
        }
        if (months > 0) {
            if (months > 1) {
                string += months + ' months ';
            } else {
                string += months + ' Month ';
            }
        }
        if (years == 0 && months == 0) {
            if (days > 1) {
                string = days + ' days ';
            } else {
                string = days + ' day ';
            }
        }
        return string + 'old';
    }

    addMonths(date, months) {
        var dateForm = date.getMonth() + 1
    }

    addMonths(date, months) {
        date.setMonth(date.getMonth() + months);
        return date
    }


    func() {

        var dateForm = date.getMonth() + 1
        var start_date = this.addMonths(date, -6);
        var monForm = start_date.getMonth() + 1
        let x = {}

        for (var i = monForm + 1; i <= dateForm; i++) {
            x[i] = i
        }
        return x
    }
    // get two date differens in months
    getMonthDifference(startDate, endDate) {
        startDate = new Date(startDate);
        endDate = new Date(endDate);
        var difference = endDate.getMonth() - startDate.getMonth() + 12 * (endDate.getFullYear() - startDate.getFullYear());
        return difference;
    }
    // truncate string with ellipsis
    truncate(str, n){
        return (str.length > n) ? str.slice(0, n-1) + '' : str;
    }
    getMonthDiff(dateString) {
        var dt1 = new Date(dateString);
        var starts = moment(dt1);
        var ends = moment();
        var years = ends.diff(starts, 'year');
        starts.add(years, 'years');
        var months = ends.diff(starts, 'months');
        starts.add(months, 'months');
        var days = ends.diff(starts, 'days');
        if(days < 0 || months < 0 || years < 0){
            return null;
        }
        return months;
    }
    verifyToken(token){
        return jwt.verify(token, process.env.AUTHORIZATION_SECRET_KEY,function(err,decode){
            if(err){
                return false;
            }else{
                return true;
            }
        })
    }
    async sendMail2(subject, html,from=null, to=null) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                auth: {
                    user: process.env.MAIL_USERNAME,
                    pass: process.env.MAIL_PASSWORD
                }
            });
            // send email
            await transporter.sendMail({
                from: from,
                to: to,
                subject: subject,
                html: html,
            });
            return ;
        } catch (err) {
            console.log('error ==========>', err);
            const error = new Error('MAIL NOT SEND');
            error.code = 500;
            return promise.reject(error);
        }
    }
}


module.exports = new Helper();