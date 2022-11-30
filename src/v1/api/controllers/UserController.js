const validator = require('../../../modules/validators/api/index')
const CommonController = require('./CommonController')
const UserService = require('../services/UserService')
const responseHelper = require('../../api/resources/response')
const { UserDeviceToken, conn, User } = require('../../../data/models/index')
const jwt = require('jsonwebtoken')
const passport = require('passport');
require('../../../modules/middleware/passport')(passport);


class UserController {
    /* mother || user signup */
    async signup(req, res) {
        const body = await CommonController.removeEmptyParams(req.body)
        req.body = body
        try {
            const body = req.body
            await validator.validateMotherSignUpForm(body)
            if (req.body.register_type == 1) {
                delete req.body.google_id
                delete req.body.facebook_id
                delete req.body.apple_id
                await UserService.signupWithEmail(req)
                return responseHelper.success(res, 'EMAIL_VERIFICATION', {})
            } else {
                const user = await UserService.otherSigninMethod(req);
                return responseHelper.success(res, 'LOGIN_SUCCESS', user)
            }
        } catch (error) {
            console.log('error=======>', error)
            return responseHelper.error(res, error.message || '', error.code || 500)
        }
    }
    /* verify email address api */
    async verifyMail(req, res) {
        try {
            await UserService.verifyMail(req)
            res.render(base_path+'/src/views/html/backend/verify-status', {
                status: true
            })
        } catch (error) {
            console.log('error =======>',error)
            var message = error;
            res.render(base_path+'/src/views/html/backend/verify-status', {
                message: message,
                status: false
            })
        }
    }
    /* user login api */
    async signin(req, res) {
        const body = await CommonController.removeEmptyParams(req.body);
        req.body = body;
        try {
            await validator.validateSignIn(req.body);
            // email
            if (req.body.register_type == 1) {
                const user = await UserService.validateEmailLogin(req);
                // return;
                delete req.body.google_id
                delete req.body.facebook_id
                delete req.body.apple_id
                user.comparePassword(req.body.password, async (err, isMatch) => {
                    if (isMatch != undefined && !err) {
                        var token = jwt.sign(JSON.parse(JSON.stringify(user)), process.env.APP_KEY, {
                            expiresIn: process.env.EXPIRE_TIME
                        });
                        var tokenData = new UserDeviceToken({
                            fk_user_id:user._id,
                            device_id:req.headers.device_id||'',
                            device_token:token,
                            device_type:req.headers.device_type||'',
                        })
                        tokenData.save()
                        await user.updateOne({$push:{DeviceTokens:tokenData._id}})
                        var userData = user.toObject();
                        userData.token = token;
                        return responseHelper.success(res, 'LOGIN_SUCCESS', userData)
                    } else {
                        return responseHelper.error(res, 'INVALID_PASSWORD', 400)
                    }
                })
            }
            if (req.body.register_type != 1) {
                const user = await UserService.otherSigninMethod(req)
                return responseHelper.success(res, 'LOGIN_SUCCESS', user)
            }
        } catch (error) {
            console.log('error ===========>',error);
            return responseHelper.error(res, error.message || '', error.code || 500)
        }
    }
    /* user detail api */
    async detail(req, res) {
        try {
            const user = await req.authUser;
            return responseHelper.success(res, 'USER_DETAIL', user);
        } catch (error) {
            console.log('error ===========>',error);
            return responseHelper.error(res, error.message || '', error.code || 500);
        }
    }
    /* user logout api */
    async logout(req, res) {
        const t = await conn.startSession();
        t.startTransaction();
        try {
            await UserDeviceToken.deleteOne({
                    device_token: req.userToken
            },{t})
            await User.updateOne({_id:req.authId},{$pull:{ DeviceTokens : { $in: req.tokenId } } },{t})
            await t.commitTransaction()
            return responseHelper.success(res, 'LOGOUT_SUCCESS', {});
        } catch (error) {
            console.log('error ===========>',error);
            await t.abortTransaction()
            return responseHelper.error(res, error.message || '', error.code || 500);
        }finally{
            t.endSession();
        }
    }

    /* user refresh token api */
    async refreshToken(req, res) {
        try {
            if (!req.headers.authorization) throw 'TOKEN_REQUIRED';
            const parted = req.headers.authorization.split(' ');
            var token;
            if (parted[0] === 'Bearer')
                token = parted[1];
            else{
                const error = new Error('INVALID_TOKEN');
                error.code = 403;
                throw error;
            }
            var attributes = 'name email google_id password register_type email_verified_at facebook_id status createdAt updatedAt';
            const userDeviceToken = await UserDeviceToken.findOne({device_token: token}).populate('fk_user_id',attributes)
            console.log('userDeviceToken ========>',userDeviceToken)
            return;
            if (!userDeviceToken) {
                const error = new Error('TOKEN_NOT_PRESENT');
                error.code = 403;
                throw error;
            }
            if (!userDeviceToken.le_users){
                const error = new Error('USER_DELETED');
                error.code = 405;
                throw error;
            };
            const user = userDeviceToken.le_users;
            const userData = await userResponse.userResponse(user);
            if (!userDeviceToken){
                const error = new Error('INVALID_TOKEN');
                error.code = 403;
                throw error;
            }
            const newToken = jwt.sign(JSON.parse(JSON.stringify(userData)), process.env.AUTHORIZATION_SECRET_KEY, {
                expiresIn: expiresIn
            });
            await UserDeviceToken.create({
                fk_user_id: user.user_id,
                device_id: req.headers.device_id || '',
                device_token: newToken,
                device_type: req.headers.device_type || '',
            }, {
                transaction
            })
            await UserDeviceToken.destroy({
                where: {
                    device_token: token
                }
            }, {
                transaction
            });
            await transaction.commit();
            userData.token = newToken;
            return responseHelper.success(res, 'TOKEN_REFRESHED', userData);
        } catch (error) {
            console.log(error);
            return responseHelper.error(res, error.message || '', error.code || 500);
        }
    }
}
module.exports = new UserController();