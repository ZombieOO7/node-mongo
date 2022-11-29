const mongoose = require('mongoose');
const { Schema } = mongoose;
const { UserDeviceToken } = require('../models/index')
const bcrypt = require('bcrypt');

module.exports = (mongoose) => {
    const UserSchema = new Schema({
        // user_id: {
        //     type:Schema.Types.ObjectId,
        //     required:true,
        // },
        name:{
            type: String,
            required: false,
        },
        register_type:{
            type: Number, //1=email,2=google,3=facebook,4=apple_id
            required: false,
        },
        email:{
            type: String,
            required: false,
            // unique: true
        },
        apple_id:{
            type: String,
            required: false,
        },
        facebook_id:{
            type: String,
            required: false,
        },
        google_id:{
            type: String,
            required: false,
        },
        email_verified_at:{
            type: Date,
            required: false,
        },
        password: {
            type: String,
            required: false,
            set : value =>{
                if(value){
                    return bcrypt.hashSync(value, 10);
                }
            }
        },
        status:{
            type: Number, // 0=inactive,1=active
            required: false,
            default:0,
        },
        deletedAt:{
            type: Date,
            required: false,
        },
        last_active_at:{
            type: Date,
            required: false,
        },
        DeviceTokens: [{
            type:Schema.Types.ObjectId,
            ref: "UserDeviceToken"
        }],
    },{
        timestamps: true
    });
    UserSchema.methods.comparePassword = function (password,cb) {
        if(bcrypt.compareSync(password, this.password||'') == true){
            cb(null, true);
        }else{
            return cb('invalid password.');
        }
    }
    return mongoose.model('User',UserSchema,'le_users')
};
