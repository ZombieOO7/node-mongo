const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
// load up the user model
const {User} = require('../../data/models');

module.exports = function (passport) {
    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.APP_KEY,
    };
    passport.use('Bearer', new JwtStrategy(opts, async (payload, done) => {
        var attributes = 'name email google_id password register_type email_verified_at facebook_id status createdAt updatedAt';
        const user = await User.findById(payload._id).select(attributes);
        if(!user){
            return done({status:false,error:'USER_DELETED'});
        }
        return done({status:true,user:user});
    }));
};