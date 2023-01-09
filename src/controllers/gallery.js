const Event = require("../models/Event");
const License = require("../models/License");
var AWS = require("aws-sdk");
const gallery = require("../models/Gallery");
// const Task = require("../models/Task");
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
let axios = require('axios');
const Task = require("../models/Task");
const User = require("../models/User");

exports.create = async (req, res) => {
  try {
    // let {taskId}

    let gallData = [];

    let galleryLimit = await gallery.countDocuments({
      eventId: req.body.event_id,
    });
    let count = await Event.findById(req.body.event_id);
    console.log(count.is_public, 'public');
    if (galleryLimit < count.maxMedia + 9) {
      let private = true
      if (count.is_public) {
        private = false
      }
      console.log(private)
      for (let i = 0; i < req.files.length; i++) {
        console.log(req.files[i].mimetype, 3333);
        gallData.push({
          image: req.files[i].key,
          taskId: req.body.taskId,
          isPrivate: private,
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
        let private = true
        if (checkEventStatus.is_public) {
          private = false
        }
        for (let i = 0; i < req.files.length; i++) {
          gallData.push({
            image: req.files[i].key,
            taskId: null,
            type: req.files[i].mimetype,
            eventId: req.body.event_id,
            isPrivate: private,
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
        $match: { eventId: mongoose.Types.ObjectId(event_id), isPrivate: true, isDeleted: false }
      }
    ]);
    if (totalImages && totalImages.length > 0) {
      for (let i = 0; i < totalImages.length; i++) {
        let profile_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${totalImages[i].image}`,
          Expires: 604800,
        });
        totalImages[i].image = profile_image;
        if (totalImages[i].taskId) {
          let _task = await Task.findById(totalImages[i].taskId);
          totalImages[i].task = _task
        } else {
          if (totalImages[i].eventId) {
            let _event = await Event.findById(totalImages[i].eventId);
            totalImages[i].event_name = _event.general_info.event_name
          }
        }
      }
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
    console.log('------------------------------------------')
    let id = req.params.id;
    let gal = await gallery.find({ pid: id, isDeleted: false });
    const totalImages = await gallery.count({
      pid: req.params.id, type:
        "application/jpg"
    });
    const totalVideos = await gallery.count({
      pid: req.params.id, type:
        "application/mp4"
    });
    for (let i = 0; i < gal.length; i++) {
      let _image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${gal[i].image}`,
        Expires: 604800,
      });
      gal[i].image = _image;
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
exports.viewMyUploadsInMobile = async (req, res) => {
  try {
    console.log('------------------------------------------')
    let id = req.params.id;
    let skip = 0
    let limit = 10
    let gal = await gallery.find({ pid: id, isDeleted: false }).skip(skip).limit(limit);
    let total_media_count = await gallery.count({ pid: id, isDeleted: false });
    const totalImages = await gallery.count({
      pid: req.params.id, type:
        "application/jpg"
    });
    const totalVideos = await gallery.count({
      pid: req.params.id, type:
        "application/mp4"
    });
    // let gal_ = await gallery.find({
    //   pid: participantsId,
    //   eventId: result.id,
    //   isPrivate: true,
    //   isDeleted: false,
    // }).skip(skip).limit(limit);

    let _images = []

    for (let i = 0; i < gal.length; i++) {
      let image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${gal[i].image}`,
        Expires: 604800,
      });
      _images.push(image);
      let postedBy = await User.findById(gal[i].uid)
      gal[i].user = postedBy
      let liked = await gallery.findOne({ "likes.user_id": req.user.id, _id: gal[i].id });
      console.log(liked)
      if (liked) {
        gal[i].liked = true
      } else {
        gal[i].liked = false
      }
      if (gal[i].taskId) {
        gal[i].task = await Task.findById(gal[i].taskId)
      } else {
        gal[i].task = null
      }
      if (gal[i].uid) {
        let _user = await User.findById(gal[i].uid)
        let user_profile = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${_user.photoURL}`,
          Expires: 604800,
        });
        gal[i].photoURL = user_profile
        gal[i].user = _user
      } else {
        gal[i].user = null
      }
    }
    // for (let i = 0; i < gal.length; i++) {
    //   let _image = s3.getSignedUrl("getObject", {
    //     Bucket: process.env.bucket,
    //     Key: `${gal[i].image}`,
    //     Expires: 604800,
    //   });
    //   gal[i].image = _image;
    // }
    // console.log(gal);
    if (gal) {
      res.status(200).json({
        status: true,
        gal,
        total_media_count,
        images: _images,
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
    let { event_id, status, limit, skip, type, pid } = req.body;
    // limit = 10
    // skip = 0
    if (event_id) {
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
          let current_date = new Date()
          if (result.general_info.date_to > current_date) {
            const Days = result.accesstodownloads;
            const miliseonds = Days * 24 * 60 * 60 * 1000;
            const currentDate = Date.now();
            const overall = currentDate + miliseonds;
            const firstDate = new Date(overall);

            console.log(firstDate);
            (secondDate = new Date(Date.now())), console.log(secondDate);
            let timeDifference = Math.abs(secondDate - firstDate);

            if (timeDifference > 0) {
              let participantsData = await JointEvent.find({
                EventId: req.body.event_id,
              });
              let participantsId = participantsData.map((val) => val._id);
              // console.log('----------------', result.id)
              let total_media_count = await gallery.count({
                pid: participantsId,
                eventId: result.id,
                isPrivate: false,
                isDeleted: false,
              });
              let gal = []
              if (type == 'public') {
                gal = await gallery.find({
                  pid: participantsId,
                  eventId: result.id,
                  isPrivate: false,
                  isDeleted: false,
                }).skip(skip * limit).limit(limit);
              } else {
                gal = await gallery.find({ pid, isDeleted: false }).skip(skip * limit).limit(limit);
              }
              // console.log(gal)
              // let gal = await gallery.aggregate([
              //   {
              //     $match: {
              //       eventId: mongoose.Types.ObjectId(event_id),
              //       // pid: mongoose.Types.ObjectId(participantsId),
              //       isPrivate: status,
              //       isDeleted: false
              //     }
              //   },
              //   { $skip: skip * limit },
              //   { $limit: limit },
              //   {
              //     $lookup: {
              //       from: "users",
              //       localField: "uid",
              //       foreignField: "_id",
              //       as: "users"
              //     }
              //   }
              // ]);
              let _images = []
              console.log(gal)
              if (gal.length > 0) {
                // eventId: req.body.event_id,
                for (let i = 0; i < gal.length; i++) {
                  let profile_image = s3.getSignedUrl("getObject", {
                    Bucket: process.env.bucket,
                    Key: `${gal[i].image}`,
                    Expires: 604800,
                  });
                  _images.push(profile_image);
                  let postedBy = await User.findById(gal[i].uid)
                  gal[i].user = postedBy
                  let liked = await gallery.findOne({ "likes.user_id": req.user.id, _id: gal[i].id });
                  console.log(liked)
                  gal[i].likes_count = gal[i].likes?.length
                  gal[i].commentsCount = gal[i].comments?.length
                  if (liked) {
                    gal[i].liked = true
                  } else {
                    gal[i].liked = false
                  }
                  if (gal[i].taskId) {
                    gal[i].task = await Task.findById(gal[i].taskId)
                  } else {
                    gal[i].task = null
                  }
                  if (gal[i].uid) {
                    let _user = await User.findById(gal[i].uid)
                    let user_profile = s3.getSignedUrl("getObject", {
                      Bucket: process.env.bucket,
                      Key: `${_user.photoURL}`,
                      Expires: 604800,
                    });
                    gal[i].photoURL = user_profile
                    gal[i].user = _user
                  } else {
                    gal[i].user = null
                  }
                }
                res.status(200).json({
                  status: true,
                  gal,
                  total_media_count,
                  images: _images,
                  message: "Data fetched successfully",
                });
              } else {
                res.status(200).json({
                  status: true,
                  total_media_count: 0,
                  gal: [],
                  images: [],
                  message: "Data fetched successfully",
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
              message: "Event is no longer available",
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
    } else {
      res.status(200).json({
        status: false,
        message: "Event not found",
      });
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
exports.viewGalleryInMobile = async (req, res) => {
  try {
    let { event_id, status, limit, skip } = req.body;
    console.log(req.body);
    // limit = 10
    // skip = 0
    if (event_id) {
      let event = await Event.findById(event_id);
      if (event) {
        let event_gallery = await gallery.aggregate([
          { $match: { eventId: mongoose.Types.ObjectId(event_id), isPrivate: status, isDeleted: false } },
          { $skip: skip * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "uid",
              foreignField: "_id",
              as: "users"
            }
          }
        ]);
        if (event_gallery && event_gallery.length > 0) {
          let images = []
          for (let i = 0; i < event_gallery.length; i++) {
            let _imageURL = s3.getSignedUrl("getObject", {
              Bucket: process.env.bucket,
              Key: `${event_gallery[i].image}`,
              Expires: 604800,
            });
            images.push(_imageURL);
            let postedBy = await User.findById(event_gallery[i].uid)
            event_gallery[i].user = postedBy
            let liked = await gallery.findOne({ "likes.user_id": req.user.id, _id: event_gallery[i].id });
            console.log(liked)
            if (liked) {
              event_gallery[i].liked = true
            } else {
              event_gallery[i].liked = false
            }

            if (event_gallery[i].taskId) {
              event_gallery[i].task = await Task.findById(event_gallery[i].taskId)
            }
          }
          res.status(200).json({
            status: true,
            event_gallery,
            images
          })
        } else {
          res.status(200).json({
            status: true,
            event_gallery: [],
            images: []
          })
        }

      } else {
        res.status(200).json({
          status: true,
          event_gallery: [],
          images: []
        })
      }
    } else {
      res.status(200).json({
        status: false,
        message: "Event not found",
      });
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
    let { status, event_id, user_id } = req.body;
    console.log(req.body);
    if (status != undefined) {
      let gal = []
      if (user_id && user_id == 'all') {
        gal = await gallery.aggregate([
          {
            $match: { eventId: mongoose.Types.ObjectId(event_id), isPrivate: status, isDeleted: false }
          }
        ]);
      } else {
        gal = await gallery.aggregate([
          {
            $match: { eventId: mongoose.Types.ObjectId(event_id), uid: mongoose.Types.ObjectId(user_id), isPrivate: status, isDeleted: false }
          }
        ]);
      }
      let event = await Event.findById(event_id)
      const totalImages = await gallery.count({
        type: "application/jpg", eventId: event_id, isPrivate: status, isDeleted: false
      });
      const totalVideos = await gallery.count({
        type: "application/mp4", eventId: event_id, isPrivate: status, isDeleted: false
      });
      if (gal.length > 0) {
        // eventId: req.body.event_id,
        //loop is used to get all the images one by one
        for (let i = 0; i < gal.length; i++) {
          let profile_image;
          if (gal[i].type != 'application/mp4') {

            profile_image = s3.getSignedUrl("getObject", {
              Bucket: process.env.bucket,
              Key: `${gal[i].image}`,
              Expires: 604800,
            });
            gal[i].image = profile_image;
            let imageResponse = await axios({
              url: gal[i].image,
              method: 'GET',
              responseType: 'arraybuffer'
            });
            let returendBuffer = imageResponse.data.toString('base64')
            gal[i].buffer = returendBuffer
          } else {
            // console.log(gal[i].type,'type');
            profile_image = s3.getSignedUrl("getObject", {
              Bucket: process.env.bucket,
              Key: `${gal[i].image}`,
              Expires: 604800,
            });
            // console.log(profile_image);
            gal[i].image = profile_image;
          }
          if (gal[i].taskId) {
            let _task = await Task.findById(gal[i].taskId);
            gal[i].task = _task
          } else {
            if (gal[i].eventId) {
              let _event = await Event.findById(gal[i].eventId);
              gal[i].event_name = _event.general_info.event_name
            }
          }
        }
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
          totalImages,
          totalVideos,
          gal: [],
          message: "Error while fetching data",
        });
      }
    } else {
      res.status(400).json({
        status: false,
        message: "Bad request",
      });
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
    console.log("--------------------- all-image-api calling");
    let { event_id } = req.body;
    console.log(event_id);
    let gal = await gallery.find({ eventId: event_id, isDeleted: false });
    // console.log(gal);
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
    let task_details = null
    let user = null;
    if (gal.uid) {
      user = await User.findById(gal.uid);
      let presignedThumbnailGETURL = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${user.profile.image_key}`,
        Expires: 604800,
      });
      user.profile.image_location = presignedThumbnailGETURL;
    }
    if (gal.taskId) {
      task_details = await Task.findById(gal.taskId)
    }
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
        task_details,
        user,
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
    console.log(id, 'asas');
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
exports.deleteSelectedImages = async (req, res) => {
  try {
    let { images } = req.body;
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        let imaage = await gallery.findById(images[i]);
        if (imaage) {
          imaage.isDeleted = true;
          await imaage.save()
        }
      }
      res.status(200).json({
        message: "Images deleted successfully",
      });
    } else {
      res.status(200).json({
        message: "Images not found",
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
exports.downloadBuffer = async (req, res) => {
  try {
    let { url } = req.body;
    let axios = require('axios')
    let imageResponse = await axios({
      url: 'https://pilot-hunt.s3.amazonaws.com/profiles/983794168.jpg',
      method: 'GET',
      responseType: 'arraybuffer'
    })
    // imageResponse.data.pipe(fs.createWriteStream('new-img.jpg'))
    console.log(imageResponse.data)
    res.status(200).json({
      status: false,
      buffer: imageResponse.data
    })
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating data",
    });
  }
};