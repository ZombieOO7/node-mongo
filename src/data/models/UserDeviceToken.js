const mongoose = require('mongoose');
const { Schema } = mongoose;

module.exports = (mongoose) => {
    const deviceSchema = new Schema({
        device_id:{
            type: String,
            required: false,
        },
        device_type:{
            required: false,
            type: Number,
        },
        device_token:{
            required: false,
            type: String,
        },
        fk_user_id: {
            type:Schema.Types.ObjectId,
            ref: "User"
        },
    },{
        timestamps: true
    })
    return mongoose.model('UserDeviceToken',deviceSchema,'le_user_device_tokens')
}