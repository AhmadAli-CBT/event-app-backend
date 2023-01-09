var express = require("express");
var router = express.Router();
let multer = require("multer");
let multerS3 = require("multer-s3");
let aws = require("aws-sdk");
const auth = require("../middleware/auth");
let Greetings = require('../controllers/greetings');
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
    },
});
const upload = multer({
    storage: storage,
});
router.post("/save", auth, upload.array('images'), Greetings.saveGreetings);
router.post("/view", auth, Greetings.viewGreetings);
router.post("/delete", auth, Greetings.deleteGreeting);
router.post("/view-all", Greetings.viewGreetingsAdmin);
router.post("/view-by-id", Greetings.viewGreetingById);
module.exports = router;