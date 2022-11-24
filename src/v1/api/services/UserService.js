const { User,conn } = require('../../../data/models/index')
const promise = require('bluebird')
const ejs = require('ejs')
const path = require('path')
const helper = require('../../../utills/helper')

class UserService {
    async signupWithEmail (req){
        const t = await conn.startSession();
        try{
            t.startTransaction(); 
            const body = req.body
            var existUser = await this.findUserByEmail(body)
            console.log('existUser ======>',existUser)
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
            const user = await User.create(body, { t })
            await t.commitTransaction();
            t.t()
        }catch(error){
            await t.abortTransaction()
            t.endSession()
            console.log('error=======>',error)
            return promise.reject(error)
        }
    }
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
        const t = await conn.startSession();
        try {
            const user = await User.findOne({
                    _id: req.params.uuid
            }, { t });
            if (!user) {
                var error = new Error('USER_NOT_FOUND');
                error.code=400;
                throw error;
            } else if (user.email_verified_at != null || user.status == 1) {
                var error = new Error('VERIFIED');
                error.code=400;
                throw error;
            } else {
                // update user
                await user.update({
                    email_verified_at: new Date(),
                    status: 1
                }, {t});
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}
module.exports = new UserService()