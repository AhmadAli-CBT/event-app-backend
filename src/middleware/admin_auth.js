const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async(req, res, next) => {
    try {
        // console.log(req.headers)
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            // console.log(token)
            const decode = await jwt.verify(token, process.env.TOKEN_KEY)
            // console.log(decode)
            let user = await User.findById(decode.user_id)
            if(user && user.role == 'admin'){
                req.user = user
                // req.role = decode.role
                next();
            }else{
                res.status(401).json({
                    staus: false,
                    message: 'Not authorized to access this route'
                })
            }
        } else {
            res.status(401).json({
                staus: false,
                message: 'Not authorized to access this route'
            })    
        }
    } catch(err) {
        res.status(401).json({
            staus: false,
            error: err.message,
            message: 'Not authorized to access this route'
        })
    }
}