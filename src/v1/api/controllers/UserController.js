const validator = require('../../../modules/validators/api/index')
const CommonController = require('./CommonController')
const UserService = require('../services/UserService')
const responseHelper = require('../../api/resources/response');

class UserController {
    /* mother || user signup */
    async signup(req, res) {
        const body = await CommonController.removeEmptyParams(req.body);
        req.body = body;
        try {
            const body = req.body;
            await validator.validateMotherSignUpForm(body);
            if (req.body.register_type == 1) {
                delete req.body.google_id
                delete req.body.facebook_id
                delete req.body.apple_id
                await UserService.signupWithEmail(req);
                return responseHelper.success(res, 'EMAIL_VERIFICATION', {});
            } else {
                const user = await UserService.otherSigninMethod(req);
                return responseHelper.success(res, 'LOGIN_SUCCESS', user);
            }
        } catch (error) {
            console.log('error=======>', error)
            return responseHelper.error(res, error.message || '', error.code || 500);
        }
    }
    /* verify email address api */
    async verifyMail(req, res) {
        try {
            console.log('id ------------>',req.params.uuid)
            await UserService.verifyMail(req)
            res.render(base_path+'backend/verify-status', {
                status: true
            });
        } catch (error) {
            var message = error;
            res.render(base_path+'backend/verify-status', {
                message: message,
                status: false
            });
        }
    }
}
module.exports = new UserController();