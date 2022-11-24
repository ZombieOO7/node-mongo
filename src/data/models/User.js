const mongoose = require('mongoose');
const { Schema } = mongoose;

module.exports = (mongoose) => {
    const UserSchema = new Schema({
        user_id: {
            type:Schema.Types.ObjectId,
        },
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
            unique: true
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
        }
    },{
        timestamps: true
    });
    return mongoose.model('User',UserSchema,'le_users')
};
