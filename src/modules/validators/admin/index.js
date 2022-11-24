const joiBase = require('joi');
const joiDate = require("@joi/date");
const joi = joiBase.extend(joiDate);
const custMessages = require('../../../../config/constant.json'); 
const promise = require('bluebird');
const lang = 'en';

const options = {
    errors: {
      wrap: {
        label: ''
      }
    }
};

const validateHeaders = async headers => {
    const schema = joi.object({
        language: joi.string().required(),
        authorization: joi.string().required(),
        device_token: joi.string().optional(),
        device_id: headers.app_version ? joi.string().required() : joi.string().optional(),
        device_type: headers.app_version ? joi.number().required() : joi.string().optional(),
        web_app_version : headers.web_app_version ? joi.any().required() : joi.any().optional(),
        app_version: headers.app_version ? joi.any().required() :  joi.any().optional(),
        os: joi.any().required(),
        timezone:headers.app_version ? joi.any().required() :  joi.any().optional(),
    }).unknown();
    const validated = await schema.validate(headers,options);
    if(validated.error){
        console.log(validated.error.details[0].message);
        return await {status:false,message:validated.error.details[0].message}
    }
    return await {status:true}
    // return promise.reject(error.details[0].message);
};



module.exports = {
    validateHeaders
};