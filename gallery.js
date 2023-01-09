const Event = require("../models/Event");
const License = require("../models/License");
var AWS = require("aws-sdk");
const gallery = require("../models/Gallery");
const JointEvent = require("../models/JointEvents");
var Jimp = require("jimp");
const { default: mongoose } = require("mongoose");
const credentials = {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region,
};
AWS.config.update({ credentials });
const s3 = new AWS.S3({
  endpoint: "s3-eu-central-1.amazonaws.com",
  signatureVersion: "v4",
  region: "eu-central-1",
});

exports.create = async (req, res) => {
  try {
    // let {taskId}

    let gallData = [];

    let galleryLimit = await gallery.countDocuments({
      eventId: req.body.event_id,
    });
    let count = await Event.findById(req.body.event_id);
    console.log(count, req.body.event_id);
    if (galleryLimit < count.maxMedia + 9) {
      for (let i = 0; i < req.files.length; i++) {
        console.log(req.files[i].mimetype, 3333);
        gallData.push({
          image: req.files[i].key,
          taskId: req.body.taskId,
          isPrivate: count.is_public,
          // type:req.files[i],
          type: req.files[i].mimetype,
          eventId: req.body.event_id,
          pid: req.body.pid,
          uid: req.user.id,
        });
      }
      const gal = await gallery.insertMany(gallData);
      console.log(gal);
      res.status(200).json({
        status: true,
        gal,
        message: "Error while creating task",
      });
    } else {
      res.status(200).json({
        status: false,

        message: "Upload media image in event is exceed",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.uploadImagesInEvents = async (req, res) => {
  try {
    // let {taskId}

    let gallData = [];
    let galleryLimit = await gallery.countDocuments({
      eventId: req.body.event_id,
    });
    let checkEventStatus = await Event.findById({ _id: req.body.event_id })
    console.log(checkEventStatus.is_public, 'evet status');
    if (checkEventStatus) {
      console.log(galleryLimit);
      if (galleryLimit < 20) {
        for (let i = 0; i < req.files.length; i++) {
          gallData.push({
            image: req.files[i].key,
            taskId: null,
            type: req.files[i].mimetype,
            eventId: req.body.event_id,
            isPrivate: checkEventStatus.is_public,
            pid: req.body.pid,
            uid: req.user.id,
          });
        }
        const gal = await gallery.insertMany(gallData);
        console.log(gal);
        res.status(200).json({
          status: true,
          gal,
          message: "Error while creating task",
        });
      } else {
        res.status(200).json({
          status: false,

          message: "Upload media image in event is exceed",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "Event is not found",
      });

    }

  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.updateImagesStatus = async (req, res) => {
  try {
    let { image_ids, status } = req.body;
    console.log(image_ids);
    let updateImagesStatus = await gallery.updateMany(
      { _id: { $in: image_ids } },
      { isPrivate: status }
    );
    console.log(updateImagesStatus);
    if (updateImagesStatus) {
      res.status(200).json({
        status: true,
        message: "Status updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while updating status",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.createEventImage = async (req, res) => {
  try {
    console.log(req.file.mimetype);
    const gal = await gallery.create({
      image: req.file.key,
      eventId: req.body.event_id,
      pid: req.body.pid,
      type: req.file.mimetype,
      uid: req.user.id,
    });

    res.status(200).json({
      status: true,
      gal,
      message: "Error while creating images",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating images",
    });
  }
};
exports.likeImage = async (req, res, next) => {
  try {
    let user_id = req.user.id;
    let { gallery_id } = req.body;
    // console.log(req.body)
    let image = await gallery.findOne({ _id: gallery_id });
    if (image) {
      let imageLikeCheck = await gallery.findOne({
        "likes.user_id": user_id,
        _id: gallery_id,
      });
      if (imageLikeCheck) {
        let index = imageLikeCheck.likes.findIndex(
          (likes) => likes.user_id == user_id
        );
        imageLikeCheck.likes.splice(index, 1);
        imageLikeCheck.likes_count =
          imageLikeCheck.likes_count > 0 ? imageLikeCheck.likes_count - 1 : 0;
        await imageLikeCheck.save();
        res.status(200).json({
          status: true,
          liked: false,
          image: imageLikeCheck,
          message: "Video unliked",
        });
      } else {
        console.log("---------------");
        image.likes.push({ user_id: user_id });
        image.likes_count = image.likes_count + 1;
        await image.save();
        res.status(200).json({
          status: true,
          image,
          liked: true,
          message: "Video unliked",
        });
      }
    } else {
      res.status(400).json({
        status: false,
        message: "Video not found",
      });
    }
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "SomeThing Went Wrong Please Try Again Later",
    });
  }
};
exports.createComment = async (req, res) => {
  try {
    const { comments, id } = req.body;
    const galLikes = await gallery.findById(id);
    galLikes.comments.push({
      uid: req.user.id,
      comments,
      createdAt: Date.now(),
    });
    await galLikes.save();

    res.status(200).json({
      status: true,
      galLikes,
      message: "Error while creating task",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.viewSingleImage = async (req, res) => {
  try {
    const { gallery_id } = req.body;
    let image = await gallery.findById({ _id: gallery_id }).select({
      comments: 1,
      likes: 1,
      likes_count: 1,
    });
    if (image) {
      image.commentscount = 1;
      console.log(image);
      res.status(200).json({
        status: true,
        likes_count: image.likes.length,
        comments_count: image.comments.length,
        message: "Data fetched successfully",
        image: image,
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Image not found",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating likes",
    });
  }
};
exports.viewCommentsOfAnImage = async (req, res) => {
  try {
    const { gallery_id } = req.body;
    let image = await gallery.findById({ _id: gallery_id }).select({
      comments: 1,
    });
    if (image) {
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        image: image,
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Image not found",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating likes",
    });
  }
};
exports.totalImages = async (req, res) => {
  try {
    const totalImages = await gallery.count({ eventId: req.params.id });
    res.status(200).json({
      totalImages,
      status: true,
      message: "total images",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while getting images",
    });
  }
};
exports.viewAllMediaOfEvent = async (req, res) => {
  try {
    let { event_id } = req.body;
    let totalImages = await gallery.aggregate([
      {
        $match: { eventId: mongoose.Types.ObjectId(event_id) }
      },
      {
        $lookup:{
          from: "tasks",
          localField: "taskId",
          foreignField: "_id",
          as: "task"
        }
      },
      {
        $unwind: "$task"
      }
    ]);
    // let totalImages = await gallery.find({eventId: event_id}).populate("tasks", "name").exec();
    if (totalImages && totalImages.length > 0) {
      let event = await Event.findById(event_id);
      for (let i = 0; i < totalImages.length; i++) {
        let event_iamge = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${totalImages[i].image}`,
          Expires: 604800,
        });
        totalImages[i].url = event_iamge
      }

      res.status(200).json({
        data: totalImages,
        status: true,
        event,
        message: "total media",
      })
    } else {
      res.status(200).json({
        data: [],
        status: false,
        message: "no data found",
      })
    }
  } catch (err) {
    console.log(err.message),
      res.status(500).json({
        status: false,

        error: err.message,
        message: "Error while getting images",
      });
  }
};
exports.get = async (req, res) => {
  try {
    let { id } = req.params;
    let gal = await gallery.find({ pid: req.params.id });
    const totalImages = await gallery.count({
      pid: req.params.id, type:
        "application/jpg"
    });
    const totalVideos = await gallery.count({
      pid: req.params.id, type:
        "application/mp4"
    });
    for (let i = 0; i < gal.length; i++) {
      let profile_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${gal[i].image}`,
        Expires: 604800,
      });
      gal[i].image = profile_image;
    }
    console.log(gal);
    if (gal) {
      res.status(200).json({
        status: true,
        gal,
        totalImages,
        totalVideos,
        message: "Data fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while fetching data",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.getprivate = async (req, res) => {
  try {
    let { status } = req.body;
    console.log(status)
    console.log(req.body);
    if (status != undefined) {
      let participantsData = await JointEvent.find({
        EventId: req.body.event_id,
      });
      let participantsId = participantsData.map((val) => val._id);
      let gal = await gallery.find({ pid: participantsId, isPrivate: status, isDeleted: false, });
      if (gal.length > 0) {
        // eventId: req.body.event_id,
        //loop is used to get all the images one by one
        for (let i = 0; i < gal.length; i++) {
          let profile_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${gal[i].image}`,
            Expires: 604800,
          });
          gal[i].image = profile_image;
        }
        res.status(200).json({
          status: true,
          gal,
          message: "Data fetched successfully",
        });
      } else {
        res.status(200).json({
          status: true,
          gal: [],
          message: "Error while fetching data",
        });
      }
    } else {
      let result = await Event.findOne({
        _id: req.body.event_id,
        is_deleted: false,
      });

      if (result) {
        const Days = result.accesstodownloads;
        const miliseonds = Days * 24 * 60 * 60 * 1000;
        const currentDate = Date.now();
        const overall = currentDate + miliseonds;
        const firstDate = new Date(overall);

        console.log(firstDate);
        (secondDate = new Date(Date.now())), console.log(secondDate);
        timeDifference = Math.abs(secondDate - firstDate);

        if (timeDifference > 0) {
          let participantsData = await JointEvent.find({
            EventId: req.body.event_id,
          });
          let participantsId = participantsData.map((val) => val._id);
          let gal = await gallery.find({
            pid: participantsId,
            isPrivate: false,
            isDeleted: false,
          });
          if (gal.length > 0) {
            // eventId: req.body.event_id,
            for (let i = 0; i < gal.length; i++) {
              let profile_image = s3.getSignedUrl("getObject", {
                Bucket: process.env.bucket,
                Key: `${gal[i].image}`,
                Expires: 604800,
              });
              gal[i].image = profile_image;
            }
            res.status(200).json({
              status: true,
              gal,
              message: "Data fetched successfully",
            });
          } else {
            res.status(200).json({
              status: true,
              gal: [],
              message: "Error while fetching data",
            });
          }
        } else {
          res.status(200).json({
            status: true,
            gal: [],
            message: "Gallery Duration Time Expired",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          gal: [],
          message: "Event is deleted",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.getprivateNew = async (req, res) => {
  try {
    let { status, event_id } = req.body;
    console.log(req.body);
    if (status != undefined) {
      let event = await Event.findById(event_id)
      // let gal = await gallery.find({ eventId: event_id, isPrivate: status });
      let gal = await gallery.aggregate([
        {
          $match: { eventId: mongoose.Types.ObjectId(event_id), isPrivate: status }
        },
        {
          $lookup:{
            from: "tasks",
            localField: "taskId",
            foreignField: "_id",
            as: "task"
          }
        },
        {
          $unwind: "$task"
        }
      ]);
      if (gal.length > 0) {
        // eventId: req.body.event_id,
        //loop is used to get all the images one by one
        for (let i = 0; i < gal.length; i++) {
          let profile_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${gal[i].image}`,
            Expires: 604800,
          });
          gal[i].image = profile_image;
        }
        const totalImages = await gallery.count({
          type: "application/jpg", eventId: event_id, isPrivate: status
        });
        const totalVideos = await gallery.count({
          type: "application/mp4", eventId: event_id, isPrivate: status
        });
        res.status(200).json({
          status: true,
          gal,
          event,
          totalImages,
          totalVideos,
          message: "Data fetched successfully",
        });
      } else {
        res.status(200).json({
          status: true,
          gal: [],
          message: "Error while fetching data",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.getAllImages = async (req, res) => {
  try {
    console.log("all-image-api calling");
    let { event_id } = req.body;
    console.log(event_id);
    let gal = await gallery.find({ eventId: event_id }).limit(20);
    console.log(gal);
    if (gal.length > 0) {
      for (let i = 0; i < gal.length; i++) {
        let profile_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${gal[i].image}`,
          Expires: 604800,
        });
        gal[i].image = profile_image;
      }
      res.status(200).json({
        status: true,
        gal,
        message: "Data fetched successfully",
      });
    } else {
      res.status(200).json({
        status: true,
        gal: [],
        message: "Data fetched successfully",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.getDetails = async (req, res) => {
  try {
    let { id } = req.params;
    let gal = await gallery.findById(id);
    let gal_image = s3.getSignedUrl("getObject", {
      Bucket: process.env.bucket,
      Key: `${gal.image}`,
      Expires: 604800,
    });
    gal.image = gal_image;
    let commentscount = gal.comments.length;
    let checkIfCurrentUserLikedThisImage = await gallery.findOne({
      "likes.user_id": req.user.id,
      _id: id,
    });
    let liked = false;
    if (checkIfCurrentUserLikedThisImage) {
      liked = true;
    }
    console.log(gal);
    if (gal) {
      gal.commentsCount = gal.comments.length;
      res.status(200).json({
        status: true,
        gal,
        liked,
        image: [{ imageUrl: gal.image }],
        message: "Data fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while fetching data",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetch comment",
    });
  }
};
exports.public = async (req, res) => {
  try {
    let { id, status } = req.body;
    let gal = await gallery.findById(id);

    gal.isPrivate = status;

    await gal.save();

    if (gal) {
      res.status(200).json({
        message: "Data fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while fetching data",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.delete = async (req, res) => {
  try {
    let { id } = req.body;
    let gallerydelete = await gallery.findByIdAndDelete(id);
    if (gallerydelete) {
      res.status(200).json({
        message: "Data fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while fetching data",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating data",
    });
  }
};
exports.deleteSingleImage = async (req, res) => {
  try {
    const { gallery_id } = req.body;
    let image = await gallery.findByIdAndDelete({ _id: gallery_id });
    if (image) {
      image.commentscount = 1;
      console.log(image);
      res.status(200).json({
        status: true,
        message: "image deleted successfully",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Image not found",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while deleting image",
    });
  }
};
exports.allchecks = async (req, res) => {
  try {
    let { id } = req.body;
    console.log(id);
    const checks = await Event.findById(id);
    console.log(checks);
    if (true) {
      res.status(200).json({
        message: "Data fetched successfully",
        status: true,
        mediaType: checks.mediaTypeallowed,
        downloadAllowed: checks.downloadAllowed,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while fetching data",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating data",
    });
  }
};
exports.testingApi = async (req, res) => {
  try {
    let gal = await gallery.findById({ _id: "633ffa0435afeecf7a31087e" });
    console.log(gal);
    let profile_image = s3.getSignedUrl("putObject", {
      Bucket: process.env.bucket,
      Key: `${gal.image}`,
      Expires: 604800,
    });
    gal.image = profile_image;
    let abc = profile_image
    console.log(abc);
    var fileName = gal.image;
    var imageCaption = 'Image caption 1';
    var loadedImage;
    // Jimp.read(abc)
    //   .then(function (image) {
    //     loadedImage = image;
    //     return Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    //   })
    //   .then(function (font) {
    //     loadedImage.print(font, 10, 10, imageCaption)
    //       .write(abc);
    //   })
    //   .catch(function (err) {
    //     console.error(err);
    //   });
    async function textOverlay() {
      // Reading image
      const image = await Jimp.read(abc)
        .then(image => image.getBuffer(Jimp.AUTO, (err, res) => console.log(res)));
      // Defining the text font
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      image.print(font, 10, 350, 'All copyrights @https://www.tutorialspoint.com');
      // Writing image after processing
      await image.writeAsync(abc);
    }
    textOverlay();
    console.log(`${abc}`);
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "somthing went wrong please try again later",
    });
  }
}
