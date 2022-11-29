const { User,conn,UserDeviceToken } = require('../../../data/models/index')
const promise = require('bluebird')
const ejs = require('ejs')
const path = require('path')
const helper = require('../../../utills/helper')
const jwt = require('jsonwebtoken')

class UserService {
    async signupWithEmail (req){
        const t = await conn.startSession();
        t.startTransaction(); 
        try{
            const body = req.body
            var existUser = await this.findUserByEmail(body)
            const subject = 'Email Verification'
            if (existUser) {
                const url = process.env.APP_URL+ `verify-email/` + existUser._id
                const imgUrl = process.env.APP_URL + `images/logo.png`
                const file = path.join(__dirname, '../../../views/html/backend/verification_email.ejs')
                const htmlData = await ejs.renderFile(file, {url:  url, user:existUser, imgUrl:imgUrl})
                if (existUser.status == 0 && existUser.email_verified_at == null) {
                    const sendMail = await helper.sendMail(existUser, subject, htmlData)
                    const error = new Error('EMAIL_NOT_VERIFIED')
                    error.code = 400
                    throw error
                } else if (existUser.status == 0) {
                    const error = new Error('USER_BANNED')
                    error.code = 403
                    throw error
                }
                const error = new Error('EMAIL_EXISTS')
                error.code = 402
                throw error
            }
            body.register_type = 1
            const user = new User(body)
            await user.save({ t });
            const url = process.env.APP_URL+ `verify-email/` + user._id;
            const imgUrl = process.env.APP_URL + `images/logo.png`;
            const file = path.join(__dirname, '../../../views/html/backend/verification_email.ejs')
            const htmlData = await ejs.renderFile(file, {url:  url, user:user, imgUrl:imgUrl});
            await helper.sendMail(user, subject, htmlData);
            await t.commitTransaction();
        }catch(error){
            await t.abortTransaction()
            return promise.reject(error)
        }finally{
            t.endSession()
        }
    }
    /* find user by email id */
    async findUserByEmail(body) {
        try {
            let user = await User.findOne({ email: body.email.trim().toLowerCase(), register_type:1})
            return user
        } catch (error) {
            return promise.reject(error)
        }
    }

    /* verify email address api */
    async verifyMail(req) {
        try {
            const user = await User.findOne({
                    _id: req.params.id
            })
            if (!user) {
                var error = new Error('USER_NOT_FOUND')
                error.code=400
                throw error
            } else if (user.email_verified_at != null || user.status == 1) {
                var error = new Error('VERIFIED')
                error.code=400
                throw error
            } else {
                // update user
                await user.updateOne({
                    email_verified_at: new Date(),
                    status: 1
                })
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    /* social media sing-up or sign-in */
    async otherSigninMethod (req) {
        const t = await conn.startSession();
        t.startTransaction();
        try{
            var attributes = ['user_id','name','email','password','google_id','register_type','facebook_id','email_verified_at','status','createdAt','updatedAt'];
            var find,user,registerType;
            // google
            if(req.body.register_type ==2){
                var google_id = req.body.google_id
                find = {google_id:google_id}
            }
            // facebook
            if(req.body.register_type ==3){
                var facebook_id = req.body.facebook_id
                find = {facebook_id:facebook_id}
            }
            // apple
            if(req.body.register_type ==4){
                var apple_id = req.body.apple_id
                find = {apple_id:apple_id}
            }
            req.body.email_verified_at = new Date();
            req.body.status = 1;
            if(req.body.register_type != 1){
                var attributes = 'name email google_id password register_type email_verified_at facebook_id status createdAt updatedAt';
                var created = false;
                var user = await User.findOne(find).select(attributes);
                if(user == null){
                    user = new User(req.body);
                    await user.save({t});
                    created = true;
                }else{
                    await user.updateOne(req.body,{t});
                }

                if(created == false){
                    if(user.status == 0){
                        const error = new Error('USER_BANNED');
                        error.code = 403;
                        throw error;
                    }
                }
                // if(user.UserNotifications != undefined && user.UserNotifications.length > 0){
                //     await UserNotification.destroy({where:{
                //         type:3,
                //         fk_user_id:user.user_id
                //     }},{transaction: t})
                // }
                await user.updateOne({last_active_at:new Date()},{t})
                var token = jwt.sign(JSON.parse(JSON.stringify(user)), process.env.APP_KEY, {expiresIn: process.env.EXPIRE_TIME})
                var tokenData = new UserDeviceToken({
                    fk_user_id:user._id,
                    device_id:req.headers.device_id||'',
                    device_token:token,
                    device_type:req.headers.device_type||'',
                })
                tokenData.save({t})
                user.DeviceTokens.push(tokenData._id)
                await user.save(t)
                const userData = user.toObject();
                userData.token = token;
                await t.commitTransaction()
                return userData
            }
        }catch(error){
            console.log('error =========>',error);
            await t.abortTransaction()
            return promise.reject(error);
        } finally {
            t.endSession();
        }
    }

    async validateEmailLogin(req){
        try {
            var email = req.body.email.trim().toLowerCase();
            var attributes = 'name email google_id password register_type email_verified_at facebook_id status createdAt updatedAt';
            var user = await User.findOne({
                                            email:email,
                                            register_type:1
                                        })
                                        // .populate('DeviceTokens')
                                        .select(attributes)
            // console.log('user =======>',user);
            // return;
            if (!user) {
                const error = new Error('EMAIL_NOT_EXIST');
                error.code = 400;
                throw error;
            }else if(user.email_verified_at == null){
                const subject = 'Email Verification';
                const url = process.env.APP_URL+ `verify-email/` + user._id;
                const imgUrl = process.env.APP_URL + `images/logo.png`;
                const file = path.join(__dirname, '../../../views/html/backend/verification_email.ejs');
                const htmlData = await ejs.renderFile(file, {url:  url, user:user, imgUrl:imgUrl});
                const sendMail = await helper.sendMail(user.toObject(), subject, htmlData);
                const error = new Error('EMAIL_NOT_VERIFIED');
                error.code = 400;
                throw error;
            }else if(user.status == 0){
                const error = new Error('USER_BANNED');
                error.code = 403;
                throw error;
            }
            // if(user.UserNotifications.length > 0){
            //     await UserNotification.destroy({where:{
            //         type:3,
            //         fk_user_id:user.user_id
            //     }})
            // }
            await user.updateOne({last_active_at:new Date()});
            return user;
        } catch (error) {
            console.log(error);
            return promise.reject(error);
        }
    }
}
module.exports = new UserService()