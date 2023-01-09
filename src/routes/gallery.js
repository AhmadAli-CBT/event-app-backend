var express = require("express");
var router = express.Router();
let multer = require("multer");
let multerS3 = require("multer-s3");
let aws = require("aws-sdk");
const auth = require("../middleware/auth");
let Gallery = require("../controllers/gallery");
const s3 = new aws.S3({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region,
});
var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `profiles/${Date.now()}`);
    },
  })
})

router.post("/", auth, upload.array("galleryImage"), Gallery.create);
router.get("/:id", auth, Gallery.get);
router.get("/my-uploads/:id", auth, Gallery.viewMyUploadsInMobile);
router.post("/delete-images", auth, Gallery.deleteSelectedImages);
router.post("/public", auth, Gallery.getprivate);
router.post("/mobile-gallery", auth, Gallery.viewGalleryInMobile);
router.post("/public-gallery", Gallery.getprivateNew);
router.post("/update-status", Gallery.updateImagesStatus);
router.get("/allDetails/:id", auth, Gallery.getDetails);
router.post("/get-all-images", auth, Gallery.getAllImages);
router.post("/comments", auth, Gallery.createComment);
router.post("/makePublic", auth, Gallery.public);
router.post("/like", auth, Gallery.likeImage);
router.post("/view-likes", auth, Gallery.viewSingleImage);
router.post("/delete-image", auth, Gallery.deleteSingleImage);
router.post("/view-comments", auth, Gallery.viewCommentsOfAnImage);
router.post("/all-checks", Gallery.allchecks);
router.post('/event-media', Gallery.viewAllMediaOfEvent)
router.post("/gallery-delete", auth, Gallery.delete);
router.post('/test', Gallery.testingApi)
router.get("/total-images/:id", auth, Gallery.totalImages);
router.post("/buffer-download", auth, Gallery.downloadBuffer);
router.post(
  "/event-images",
  upload.single("galleryImage"),
  Gallery.createEventImage
);
router.post(
  "/upload-event-images",
  auth,
  upload.array("galleryImage"),
  Gallery.uploadImagesInEvents
);

module.exports = router;
