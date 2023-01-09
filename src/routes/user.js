var express = require("express");
var router = express.Router();
let UserController = require("../controllers/user");
let multer = require("multer");
const auth = require("../middleware/auth");
let multerS3 = require("multer-s3");
let aws = require("aws-sdk");
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
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/user", auth, UserController.getUserById);
router.get("/get-user-info", auth, UserController.getUserSocialLogin);
router.post(
  "/guest-sign-up",
  auth,
  upload.single("image"),
  UserController.GuestRegister
);

router.post("/all-hosts", auth, UserController.getUserByRole);
router.post("/confirm-email", UserController.confirmEmail);

router.post("/update-host-status", auth, UserController.updateHostStatus);
router.post("/profile-update", auth, UserController.updateProfile);
router.post("/password-update", auth, UserController.updatePassword);
router.post("/update-social-profile", auth, UserController.updateSocialProfile);
router.post(
  "/profile-update-image",
  auth,
  upload.single("image"),
  UserController.updateProfileImage
);
module.exports = router;
