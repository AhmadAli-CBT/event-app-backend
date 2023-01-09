var express = require("express");
var router = express.Router();
let multer = require('multer')
let multerS3 = require('multer-s3')
let aws = require('aws-sdk');
const auth = require("../middleware/auth");
let EventController = require('../controllers/event');
const  JointEvent  = require("../controllers/jointEvents");
const s3 = new aws.S3({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region,
});
const storage = multerS3({
    s3: s3,
    bucket: process.env.bucket,
    key: function (req, file, cb) {
        console.log(file);
        cb(null, `profiles/${Date.now()}-${file.originalname}`);
    }
})
const upload = multer({
    storage: storage
})

router.post("/", JointEvent.createEvent);
router.get("/:id", JointEvent.get);
router.get("/guest/list-of-guest", JointEvent.getGuest);



module.exports = router;