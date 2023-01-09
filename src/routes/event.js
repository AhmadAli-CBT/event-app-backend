var express = require("express");
var router = express.Router();
let multer = require("multer");
let multerS3 = require("multer-s3");
let aws = require("aws-sdk");
const auth = require("../middleware/auth");
let EventController = require("../controllers/event");
const s3 = new aws.S3({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,

  region: process.env.region,
});
// const storage = multerS3({
//   s3: s3,
//   bucket: process.env.bucket,
//   key: function (req, file, cb) {
//     console.log(file);
//     cb(null, `profiles/${Date.now()}-${file.originalname}`);
//   },
// });
var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      console.log(file);
      cb(null, `profiles/${Date.now()}-${file.originalname}`);
    },
  })
})
// const upload = multer({
//   storage: storage,
// });
router.post("/event-guests", auth, EventController.viewGuestsOfAnEvent);
router.post("/event-details", auth, EventController.viewGuestsOfAnEvent);
router.get("/host-events-list", auth, EventController.viewAllEventOfHost);
router.post("/get-all", auth, EventController.get);
router.post("/dashboard", auth, EventController.viewEventsDashboard);
router.post("/get-images-count", EventController.getTotalNumber);
router.post("/by-id", EventController.getByID);
router.post("/qrCodeGenerate", auth, EventController.qrCodeGenerate);
router.post("/qrScan", EventController.qrScan);
router.post("/join-by-code", EventController.joinByCode);
router.post("/deleteEvent", auth, EventController.deleted);
router.get("/strapiFetch/:lan", EventController.strapiResult);
router.post("/edit", EventController.editEvent);
router.post("/editPackageEvent", EventController.editPackageEvent);
router.post("/eventsHandler", auth, EventController.eventsHandler);
router.post('/save-user-name', auth, EventController.saveUserName)
router.post('/event-by-id', auth, EventController.eventByID)
router.post('/edit-event', auth, EventController.editEventByID)
router.post('/edit-cover', auth, upload.single("image"), EventController.updateCoverImageOfEvent)
router.post('/edit-profile', auth, upload.single("image"), EventController.updateProfileImageOfEvent)

router.post(
  "/",
  auth,
  upload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
    {
      name: "cover_image",
      maxCount: 1,
    },
    {
      name: "welcome_image",
      maxCount: 1,
    },
  ]),
  EventController.create
);
module.exports = router;
