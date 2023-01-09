const Event = require("../models/Event");
const License = require("../models/License");
var AWS = require("aws-sdk");
const JointEvent = require("../models/JointEvents");
const User = require("../models/User");
const { generateToken } = require("../utils/token");
const gallery = require("../models/Gallery");
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

exports.createEvent = async (req, res) => {
  try {
    let { EventId } = req.body;
    console.log(req.body);
    console.log('joint_event', EventId);
    let result = await Event.findOne({
      _id: EventId,
      is_deleted: false,


    });

    if (result) {
      console.log('result', result);
      let current_date = new Date()
      if (result.general_info.date_to >= current_date) {
        let { EventId, deviceId, tasksId } = req.body;
        let userfind = await User.findOne({
          deviceId,
        });

        if (!userfind) {
          let user = await User.create({
            deviceId,
          });
          await user.save();
          // let jointEvent = new JointEvent({ EventId, uid: user._id, tasksId });

          let jointEvent = await JointEvent.countDocuments({ EventId });
          const checks = await Event.findById(EventId);

          if (jointEvent < checks.maxGuest) {
            let jointEvent = new JointEvent({ EventId, uid: user._id, tasksId });
            await jointEvent.save();

            let token = await generateToken(user._id);
            let eventdetail = await Event.findById(EventId);
            let profile_image = s3.getSignedUrl("getObject", {
              Bucket: process.env.bucket,
              Key: `${eventdetail.profile_image}`,
              Expires: 604800,
            });
            let cover_image = s3.getSignedUrl("getObject", {
              Bucket: process.env.bucket,
              Key: `${eventdetail.cover_image}`,
              Expires: 604800,
            });
            let welcome_image = s3.getSignedUrl("getObject", {
              Bucket: process.env.bucket,
              Key: `${eventdetail.welcome_image}`,
              Expires: 604800,
            });
            eventdetail.profile_image = profile_image;
            eventdetail.cover_image = cover_image;
            eventdetail.welcome_image = welcome_image;

            if (jointEvent) {
              res.status(200).json({
                jointEvent,
                token,
                status: true,
                message: "Join Event successfully",
              });
            } else {
              res.status(200).json({
                status: false,
                message: "Error while joinng event",
              });
            }
          } else {
            res.status(200).json({
              status: false,
              message: "Guest limit is exceed",
            });
          }
        } else {
          if (true) {
            let jointEvent = await JointEvent.findOne({
              EventId,
              uid: userfind._id,
            });

            if (jointEvent) {
              let token = await generateToken(userfind._id);

              let eventdetail = await Event.findById(EventId);

              let profile_image = s3.getSignedUrl("getObject", {
                Bucket: process.env.bucket,
                Key: `${eventdetail.profile_image}`,
                Expires: 604800,
              });
              let cover_image = s3.getSignedUrl("getObject", {
                Bucket: process.env.bucket,
                Key: `${eventdetail.cover_image}`,
                Expires: 604800,
              });
              let welcome_image = s3.getSignedUrl("getObject", {
                Bucket: process.env.bucket,
                Key: `${eventdetail.welcome_image}`,
                Expires: 604800,
              });
              eventdetail.profile_image = profile_image;
              eventdetail.cover_image = cover_image;
              eventdetail.welcome_image = welcome_image;

              if (jointEvent) {
                res.status(200).json({
                  jointEvent,
                  token,
                  status: true,
                  message: "Join Event successfully",
                });
              } else {
                res.status(200).json({
                  status: false,
                  message: "Error while joinng event",
                });
              }
            } else {

              // let jointEvent = new JointEvent({ EventId, uid: user._id, tasksId });

              let jointEvent = await JointEvent.countDocuments({ EventId });
              const checks = await Event.findById(EventId);

              if (jointEvent < checks.maxGuest) {
                let jointEvent = new JointEvent({
                  EventId,
                  uid: userfind._id,
                  tasksId,
                });
                await jointEvent.save();

                let token = await generateToken(userfind._id);
                let eventdetail = await Event.findById(EventId);
                let profile_image = s3.getSignedUrl("getObject", {
                  Bucket: process.env.bucket,
                  Key: `${eventdetail.profile_image}`,
                  Expires: 604800,
                });
                let cover_image = s3.getSignedUrl("getObject", {
                  Bucket: process.env.bucket,
                  Key: `${eventdetail.cover_image}`,
                  Expires: 604800,
                });
                let welcome_image = s3.getSignedUrl("getObject", {
                  Bucket: process.env.bucket,
                  Key: `${eventdetail.welcome_image}`,
                  Expires: 604800,
                });
                eventdetail.profile_image = profile_image;
                eventdetail.cover_image = cover_image;
                eventdetail.welcome_image = welcome_image;

                if (jointEvent) {
                  res.status(200).json({
                    jointEvent,
                    token,
                    status: true,
                    message: "Join Event successfully",
                  });
                } else {
                  res.status(200).json({
                    status: false,
                    message: "Error while joinng event",
                  });
                }
              } else {
                res.status(200).json({
                  status: false,
                  message: "Guest limit is exceed",
                });
              }
            }
          }
        }
      } else {
        res.status(200).json({

          status: false,
          message: "Event is no longer available",
        });
      }

    } else {
      res.status(200).json({

        status: false,
        message: "Event is deleted ",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while joinng task",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const totalguest = await JointEvent.count({ EventId: req.params.id });
    console.log(totalguest);
    res.status(200).json({
      totalguest,
      status: true,
      message: "total guest",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while joinng task",
    });
  }
};

exports.getGuest = async (req, res) => {
  try {
    let { limit, offset, search, type, sort } = req.body;

    let total_guest = await JointEvent.count({
      name: { $regex: search, $options: "i" },
    }).populate("uid");
    let guest;
    if (search && search.length > 0) {
      guest = await JointEvent.find({
        name: { $regex: search, $options: "i" },
      })
        .populate("uid").sort({ createdAt: -1 })
      // .skip(offset * limit)
      // .limit(limit);
    } else {
      guest = await JointEvent.find()
        .populate("uid").sort({ createdAt: -1 })
      // .skip(offset * limit)
      // .limit(limit);
    }
    // .sort(sort)
    let approvedhost = await JointEvent.find().populate("uid").sort({createdAt: -1});
    let blockhost = await JointEvent.find().populate("uid").sort({createdAt: -1});
    let pendinghost = await JointEvent.find().populate("uid").sort({createdAt: -1});

    // let guest = await Task.find()
    //     .select({
    //         name: 1
    //     });
    res.status(200).json({
      guest,
      total_guest,
      pending: pendinghost,
      approved: approvedhost,
      rejected: blockhost,
      status: true,
      message: "guest fetched successfully",
    });
  } catch (err) {
    console.log(err.message);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching Host",
    });
  }
};
