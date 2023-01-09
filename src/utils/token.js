let jwt = require('jsonwebtoken');
let moment = require('moment')
exports.generateToken = (userId) => {
    const expires = moment().add(process.env.EXPIRES_IN, 'minutes');
    console.log(expires)
    const payload = {
        user_id: userId,
        iat: moment().unix(),
        exp: new Date().setDate(new Date().getMinutes() + 60),
    };
    return jwt.sign(payload, process.env.TOKEN_KEY);
};