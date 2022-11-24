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

class ApiValidation{
    async validateHeaders (headers){
        try{
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
            return await schema.validateAsync(body,options)
        }catch(error){
            error.code = 400;
            error.message = error.details[0].message;
            return promise.reject(error)
        }
    }
    async validateMotherSignUpForm(body){
        try{
            const schema = joi.object({
                register_type:joi.required().valid('1','2','3','4'),
                email:joi.when('register_type',{
                            is: '1',
                            then:
                            joi.string().max(100).regex(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/).trim(true).required()
                            .messages({ 'string.pattern.base': custMessages[lang]['INVALID_EMAIL'] })
                        }),
                password: joi.when('register_type', {is: '1',then:joi.string().min(6).max(18).required()}),
                google_id: joi.when('register_type', {is: '2',then:joi.string().required()}),
                facebook_id: joi.when('register_type', {is: '3',then:joi.string().required()}),
                apple_id: joi.when('register_type', {is: '4',then:joi.string().required()}),
                name:joi.allow('').optional(),
            });
            return await schema.validateAsync(body,options);
        }catch(error){
            console.log('error ====>',error);
            error.code = 400;
            error.message = error.details[0].message;
            return promise.reject(error)
        }
    }
}

module.exports = new ApiValidation()