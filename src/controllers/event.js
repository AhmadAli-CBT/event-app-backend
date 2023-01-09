const Event = require("../models/Event");
const Gallery = require("../models/Gallery");
const License = require("../models/License");
var AWS = require("aws-sdk");
const Task = require("../models/Task");
const { default: axios } = require("axios");
const User = require("../models/User");
const Package = require("../models/packages");
const gallery = require("../models/Gallery");
const JointEvent = require("../models/JointEvents");
AWS.config.update({ signatureVersion: "v4" });
const s3 = new AWS.S3({
  endpoint: "s3-eu-central-1.amazonaws.com",
  signatureVersion: "v4",
  region: "eu-central-1",
});

exports.create = async (req, res) => {
  try {
    let {
      license_number,
      general_info,
      tasks,
      public,
      customTask
    } = req.body;
    let randomNumber = Math.floor(100000 + Math.random() * 900000)

    console.log(general_info)

    console.log(req.body)

    customTask = customTask == undefined ? [] : customTask;
    public = public == "undefined" ? false : public;
    let customTasks = customTask.map((val) => ({
      name: val,
      unCategorized: true,
      status: 1,
      createdBy: req.user.id,
    }));
    let customTaskData = await Task.insertMany(customTasks);
    // console.log(customTaskData)
    let customId = customTaskData.map((val) => val._id);
    let combinedTasks = [...customId];
    if (tasks && tasks.length > 0) {
      combinedTasks = [...customId, ...tasks];
    }
    // console.log(combinedTasks);
    let profileImage = null
    let coverImage = null
    let welcomeImage = null
    if (req.files.profile_image) {
      profileImage = req.files.profile_image[0].key
    }
    if (req.files.cover_image) {
      coverImage = req.files.cover_image[0].key
    }
    // if (req.files.welcome_image) {
    //   welcomeImage = req.files.welcome_image[0].key
    // }
    let license = await License.findOne({ license_number });
    if (license && license.is_used == false) {

      let package = await Package.findById(license.packageId)
      console.log(package.duration);
      let start_date = new Date(general_info.date_from);
      general_info.date_from = start_date;
      // general_info.duration = package.duration
      let end_date = new Date(start_date)
      let days = parseInt(package.duration)
      end_date.setDate(end_date.getDate() + days)
      // start_date.setUTCHours(0, 0, 0, 0);
      console.log(end_date)
      general_info.date_to = end_date;
      let event = await Event.create({
        license_id: license.id,
        duration: package.duration,
        license_number,
        is_public: public,
        profile_image: profileImage,
        cover_image: coverImage,
        welcome_image: welcomeImage,
        general_info,
        tasks: combinedTasks,
        mediaTypeallowed: package.mediaTypeallowed,
        maxMedia: package.maxMedia,
        maxGuest: package.maxGuest,
        accesstodownloads: package.accesstodownloads,
        downloadAllowed: package.downloadAllowed,
        unregisteredGuest: package.unregisteredGuest,
        user_id: req.user.id,
        event_code: randomNumber
      });

      license.is_used = true;
      await license.save();
      if (event) {
        res.status(200).json({
          status: true,
          message: "Event created successfully",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Error while creating event",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "Invalid license or it is already used",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating event",
    });
  }
};
exports.get = async (req, res) => {
  try {
    if (req.role == "user") {
      let { skip, limit } = req.body
      let events = await Event.find({
        is_deleted: false,
        user_id: req.user.id,
      }).sort({ createdAt: -1 }).skip(skip * limit).limit(limit).populate("tasks", "name").exec();
      let total_events_count = await Event.count({
        is_deleted: false,
        user_id: req.user.id,
      })
      for (let i = 0; i < events.length; i++) {
        let profile_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${events[i].profile_image}`,
          Expires: 604800,
        });
        let cover_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${events[i].cover_image}`,
          Expires: 604800,
        });
        let welcome_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${events[i].welcome_image}`,
          Expires: 604800,
        });

        events[i].profile_image = profile_image;
        events[i].cover_image = cover_image;
        events[i].welcome_image = welcome_image;
      }
      if (events && events.length > 0) {
        res.status(200).json({
          status: true,
          events,
          count: total_events_count,
          message: "Data fetched successfully",
        });
      } else {
        res.status(200).json({
          status: false,
          message: "Error while fetching data",
        });
      }
    } else {
      if (req.user.role == 'admin') {
        let { skip, limit } = req.body
        let events = await Event.find({
          is_deleted: false,
        }).sort({ createdAt: -1 }).populate("tasks", "name").exec();
        let total_events_count = await Event.count({
          is_deleted: false,
          user_id: req.user.id,
        })
        for (let i = 0; i < events.length; i++) {
          let profile_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${events[i].profile_image}`,
            Expires: 604800,
          });
          let cover_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${events[i].cover_image}`,
            Expires: 604800,
          });
          let welcome_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${events[i].welcome_image}`,
            Expires: 604800,
          });

          events[i].profile_image = profile_image;
          events[i].cover_image = cover_image;
          events[i].welcome_image = welcome_image;
        }
        if (events && events.length > 0) {
          res.status(200).json({
            status: true,
            events,
            count: total_events_count,
            message: "Data fetched successfully",
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Error while fetching data",
          });
        }
      } else {
        let { skip, limit } = req.body
        let events = await Event.find({
          is_deleted: false,
          user_id: req.user.id
        }).sort({ createdAt: -1 }).populate("tasks", "name").exec();
        let total_events_count = await Event.count({
          is_deleted: false,
          user_id: req.user.id,
        })
        for (let i = 0; i < events.length; i++) {
          let profile_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${events[i].profile_image}`,
            Expires: 604800,
          });
          let cover_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${events[i].cover_image}`,
            Expires: 604800,
          });
          let welcome_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${events[i].welcome_image}`,
            Expires: 604800,
          });

          events[i].profile_image = profile_image;
          events[i].cover_image = cover_image;
          events[i].welcome_image = welcome_image;
        }
        if (events && events.length > 0) {
          res.status(200).json({
            status: true,
            events,
            count: total_events_count,
            message: "Data fetched successfully",
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Error while fetching data",
          });
        }
      }
    }

  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.viewGuestsOfAnEvent = async (req, res) => {
  try {
    let { event_id } = req.body;
    console.log(event_id, '---------------------')
    let event = await Event.findById(event_id);
    if (event) {
      let guests = await JointEvent.find({ EventId: event_id }).sort({ createdAt: -1 }).populate("uid").sort({createdAt: -1});
      console.log(guests)
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        guests
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Event not found with given ID"
      })
    }

  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching data",
    });
  }
};
exports.viewEventByID = async (req, res) => {
  try {
    let { event_id } = req.body;
    let event = await Event.findById(event_id);
    if (event) {
      console.log(guests)
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        event
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Event not found with given ID"
      })
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching data",
    });
  }
};
exports.viewAllEventOfHost = async (req, res) => {
  try {
    let user = await User.findById(req.user.id)
    let events = []
    if (user && user.role == 'admin') {
      events = await Event.find({ is_deleted: false }).select('general_info').sort({createdAt: -1});
    } else {
      events = await Event.find({ user_id: req.user.id, is_deleted: false }).select('general_info').sort({createdAt: -1});
    }
    if (events && events.length) {
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        events
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Events not found"
      })
    }

  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.viewEventsDashboard = async (req, res) => {
  try {
    let events = await Event.find({
      is_deleted: false,
    }).sort({ createdAt: -1 }).limit(4).populate("tasks", "name").exec();
    for (let i = 0; i < events.length; i++) {
      let profile_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${events[i].profile_image}`,
        Expires: 604800,
      });
      let cover_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${events[i].cover_image}`,
        Expires: 604800,
      });
      let welcome_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${events[i].welcome_image}`,
        Expires: 604800,
      });

      events[i].profile_image = profile_image;
      events[i].cover_image = cover_image;
      events[i].welcome_image = welcome_image;
    }
    if (events && events.length > 0) {
      res.status(200).json({
        status: true,
        events,
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
exports.editEvent = async (req, res) => {
  try {
    let { event_id, general_info, status } = req.body;
    let event = await Event.findById(event_id);

    event.general_info = general_info;
    // event.tasks = tasks;
    // if (status) {
    //   event.profile_image = req.files.profile_image[0].key;
    //   event.cover_image = req.files.cover_image[0].key;
    //   event.welcome_image = req.files.welcome_image[0].key;
    // }
    await event.save();
    if (event) {
      res.status(200).json({
        status: true,
        event,
        message: "Data updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while updating data",
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
exports.editPackageEvent = async (req, res) => {
  try {
    console.log('--------------------')
    let event = await Event.findByIdAndUpdate(
      { _id: req.body.eventData._id },
      req.body.eventData
    );
    let _event = await Event.findById(req.body.eventData._id);
    console.log(_event.general_info.date_from)
    let start_date = new Date(_event.general_info.date_from);
    console.log(start_date)
    let days = parseInt(req.body.eventData.duration)
    console.log(days)
    start_date.setDate(start_date.getDate() + days)
    // start_date.setUTCHours(0, 0, 0, 0);
    console.log(start_date)
    _event.general_info.date_to = start_date;
    console.log(_event)
    await _event.save()
    // console.log(event, "debug");

    // event.tasks = tasks;
    // if (status) {
    //   event.profile_image = req.files.profile_image[0].key;
    //   event.cover_image = req.files.cover_image[0].key;
    //   event.welcome_image = req.files.welcome_image[0].key;
    // }

    if (event) {
      res.status(200).json({
        status: true,
        event,
        message: "Data updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while updating data",
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
exports.deleted = async (req, res) => {
  try {
    console.log(req.body);
    let events = await Event.findOne({
      _id: req.body.event_id,
      is_deleted: false,
    });
    console.log(events);
    if (events) {
      events.is_cancelled = true;
      // events.is_deleted = true;
      await events.save();
      res.status(200).json({
        status: true,
        events,
        message: "Data deleted successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Data deleted failed",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Data deleted failed",
    });
  }
};
exports.getByID = async (req, res) => {
  try {

    let { event_id } = req.body;
    let event = await Event.findOne({
      _id: event_id,
      is_deleted: false,
    }).populate("tasks", "name");
    //find will look for the conditon in all the document

    const totalImages = await gallery.count({
      eventId: event_id, type:
        "application/jpg",
      isDeleted: false
    });
    const totalVideos = await gallery.count({
      eventId: event_id, type:
        "application/mp4",
      isDeleted: false
    });
    const totalguest = await JointEvent.count({ EventId: event_id });
    let profile_image = null;
    if (event.profile_image) {
      profile_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.profile_image}`,
        Expires: 604800,
      });
    }
    let cover_image = null;
    if (event.cover_image) {
      cover_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.cover_image}`,
        Expires: 604800,
      });
    }
    let welcome_image = null;
    if (event.welcome_image) {
      welcome_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.welcome_image}`,
        Expires: 604800,
      });
    }
    event.profile_image = profile_image;
    event.cover_image = cover_image;
    event.welcome_image = welcome_image;
    if (event) {
      res.status(200).json({
        status: true,
        event,
        totalImages,
        totalguest,
        totalVideos,
        // imagesCount,
        // videoCount,
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
exports.qrScan = async (req, res) => {
  try {
    let { event_id } = req.body;
    console.log(event_id);
    let event = await Event.findOne({
      _id: event_id,
      // qrCode: true,
      is_deleted: false,
    });
    if (event) {
      let current_date = new Date()
      if (event.general_info.date_to > current_date) {
        // let participant = await JointEvent.find({ EventId: event_id })

        let profile_image = await s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${event.profile_image}`,
          Expires: 604800,
        });
        let cover_image = await s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${event.cover_image}`,
          Expires: 604800,
        });
        let welcome_image = await s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${event.welcome_image}`,
          Expires: 604800,
        });
        event.profile_image = profile_image;
        event.cover_image = cover_image;
        event.welcome_image = welcome_image;
        res.status(200).json({
          status: true,
          event,
          message: "Data fetched successfully",
        });
      } else {
        res.status(200).json({
          status: false,
          event,
          message: "Event is no longer available",
        });
      }

    } else {
      res.status(200).json({
        status: false,
        event,
        message: "Event is deleted",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while qrScan",
    });
  }
};
exports.joinByCode = async (req, res) => {
  try {
    let { event_code } = req.body;
    console.log(event_code);
    let event = await Event.findOne({
      event_code,
      // qrCode: true,
      is_deleted: false,
    });
    console.log(event)
    if (event) {
      let current_date = new Date()
      console.log(current_date)
      console.log(event.general_info.date_to)
      if (event.general_info.date_to > current_date) {
        // let participant = await JointEvent.find({ EventId: event_id })

        let profile_image = await s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${event.profile_image}`,
          Expires: 604800,
        });
        let cover_image = await s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${event.cover_image}`,
          Expires: 604800,
        });
        let welcome_image = await s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${event.welcome_image}`,
          Expires: 604800,
        });
        event.profile_image = profile_image;
        event.cover_image = cover_image;
        event.welcome_image = welcome_image;
        res.status(200).json({
          status: true,
          event,
          message: "Data fetched successfully",
        });
      } else {
        res.status(200).json({
          status: false,
          event,
          message: "Event is no longer available",
        });
      }

    } else {
      res.status(200).json({
        status: false,
        event,
        message: "Event is deleted",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while qrScan",
    });
  }
};
exports.qrCodeGenerate = async (req, res) => {
  try {
    let { event_id } = req.body;
    let event = await Event.findOne({ _id: event_id, is_deleted: false });
    event.qrCode = true;
    await event.save();

    if (event) {
      res.status(200).json({
        status: true,
        event,
        message: "QR CODE GENERATED",
      });
    }
    // } else {
    //     res.status(200).json({
    //         status: false,
    //         message: "Error while fetching data"
    //     })
    // }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.strapiResult = async (req, res) => {
  try {
    axios
      .get("https://eventstrapi.thecbt.cyou/api/all-alerts-apps")
      .then((a) => {
        axios
          .get("https://eventstrapi.thecbt.cyou/api/event-profie-screens")
          .then((b) => {
            axios
              .get("https://eventstrapi.thecbt.cyou/api/first-info-screens")
              .then((n) => {
                axios
                  .get("https://eventstrapi.thecbt.cyou/api/galleries")
                  .then((d) => {
                    axios
                      .get(
                        "https://eventstrapi.thecbt.cyou/api/greeting-screens"
                      )
                      .then((e) => {
                        axios
                          .get(
                            "https://eventstrapi.thecbt.cyou/api/image-views"
                          )
                          .then((f) => {
                            axios
                              .get(
                                "https://eventstrapi.thecbt.cyou/api/profile-screens"
                              )
                              .then((g) => {
                                axios
                                  .get(
                                    "https://eventstrapi.thecbt.cyou/api/qr-screens"
                                  )
                                  .then((h) => {
                                    axios
                                      .get(
                                        "https://eventstrapi.thecbt.cyou/api/sidebars"
                                      )
                                      .then((i) => {
                                        axios
                                          .get(
                                            "https://eventstrapi.thecbt.cyou/api/tasks"
                                          )
                                          .then((j) => {
                                            axios
                                              .get(
                                                "https://eventstrapi.thecbt.cyou/api/gernel-datas"
                                              )
                                              .then((k) => {
                                                let newObj = {};
                                                if (req.params.lan === "ger") {
                                                  const obj = {
                                                    ...a.data.data[0]
                                                      .attributes,
                                                    ...k.data.data[0]
                                                      .attributes,
                                                    ...b.data.data[0]
                                                      .attributes,
                                                    ...n.data.data[0]
                                                      .attributes,
                                                    ...d.data.data[0]
                                                      .attributes,
                                                    ...e.data.data[0]
                                                      .attributes,
                                                    ...f.data.data[0]
                                                      .attributes,
                                                    ...g.data.data[0]
                                                      .attributes,
                                                    ...h.data.data[0]
                                                      .attributes,
                                                    ...i.data.data[0]
                                                      .attributes,
                                                    ...j.data.data[0]
                                                      .attributes,
                                                  };

                                                  const c = Object.entries(
                                                    obj
                                                  ).map(([key, value]) => {
                                                    let isGer = key.slice(-3);
                                                    // console.log(isGer, "slice");
                                                    if (isGer === "Ger") {
                                                      let newLang = key.slice(
                                                        0,
                                                        -3
                                                      );
                                                      newLang
                                                        ? (newObj[newLang] =
                                                          value)
                                                        : true;
                                                      // return {newLang, value}
                                                    }
                                                  });
                                                } else if (
                                                  req.params.lan === "eng"
                                                ) {
                                                  const obj = {
                                                    ...a.data.data[0]
                                                      .attributes,
                                                    ...b.data.data[0]
                                                      .attributes,
                                                    ...n.data.data[0]
                                                      .attributes,
                                                    ...d.data.data[0]
                                                      .attributes,
                                                    ...e.data.data[0]
                                                      .attributes,
                                                    ...f.data.data[0]
                                                      .attributes,
                                                    ...g.data.data[0]
                                                      .attributes,
                                                    ...h.data.data[0]
                                                      .attributes,
                                                    ...k.data.data[0]
                                                      .attributes,
                                                    ...i.data.data[0]
                                                      .attributes,
                                                    ...j.data.data[0]
                                                      .attributes,
                                                  };

                                                  const c = Object.entries(
                                                    obj
                                                  ).map(([key, value]) => {
                                                    let isGer = key.slice(-3);
                                                    // console.log(isGer, "slice");
                                                    if (isGer === "Eng") {
                                                      let newLang = key.slice(
                                                        0,
                                                        -3
                                                      );
                                                      newLang
                                                        ? (newObj[newLang] =
                                                          value)
                                                        : true;
                                                      // return {newLang, value}
                                                    }
                                                  });
                                                }
                                                return res.json({
                                                  AppLanguage: newObj,
                                                  message: "hello",
                                                  status: 200,
                                                });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (e) { }
};
exports.eventsHandler = async (req, res) => {
  const { id, type } = req.body;
  let event = []
  let user = await User.findById(req.user.id);
  console.log('------------------------------')
  console.log('--------', user)
  let cancelledEvents = []
  if (user && user.role == 'admin') {
    event = await Event.find({ is_deleted: false }).sort({ createdAt: -1 });
    cancelledEvents = await Event.count({ is_cancelled: true });
  } else {
    event = await Event.find({ is_deleted: false, user_id: req.user.id }).sort({ createdAt: -1 });
    cancelledEvents = await Event.count({ is_cancelled: true, user_id: req.user.id });
  }
  console.log(cancelledEvents)
  // console.log(event)

  const currentDate = new Date();
  if (type == 0) {
    return res.status(200).json({
      events: event,
      message: "Upcomming events",
    });
  }
  if (type == 1) {
    const upcomingEvents = event.filter(
      (val) => currentDate < new Date(val.general_info.date_from)
    );
    return res.status(200).json({
      events: upcomingEvents,
      message: "Upcomming events",
    });
  }
  if (type == 5) {
    const upcomingEvents = event.filter(
      (val) => currentDate < new Date(val.general_info.date_from) && val.is_cancelled == false
    );
    const happening = event.filter(
      (val) =>
        currentDate > new Date(val.general_info.date_from) &&
        currentDate < new Date(val.general_info.date_to) &&
        val.is_cancelled == false
    );
    // const canceled = cancelledEvents.length ? cancelledEvents : 0;
    // console.log(canceled)
    return res.status(200).json({
      firstHappening: happening[0],
      upcomingEvent: upcomingEvents[0],
      upcomingEvents: upcomingEvents.length,
      happening: happening.length,
      event,
      canceled: cancelledEvents,
      message: "events detail",
      status: true,
    });
  }
  if (type == 2) {
    const upcomingEvents = event.filter(
      (val) =>
        currentDate > new Date(val.general_info.date_from) &&
        currentDate < new Date(val.general_info.date_to)
    );
    return res.status(200).json({
      events: upcomingEvents,
      message: "Upcomming events",
    });
  }
  if (type == 3) {
    const cancelledEvents = event.filter(
      (val) => val.is_cancelled == true
    );
    return res.status(200).json({
      events: cancelledEvents,
      message: "Upcomming events",
    });
  } else {
    res.status(200).json({
      message: "No Event Occured",
    });
  }
};
exports.getTotalNumberOld = async (req, res) => {
  try {
    let { _id } = req.body
    console.log(req.body);
    let imagesCount = 0;
    let videoCount = 0;
    let event_image = await Gallery.find({ isDeleted: false, _id });
    let event = await Event.findById({ _id });
    let totalGuests = await JointEvent.find({ EventId: _id });
    console.log(event);
    let guests = event.maxGuest;
    let maxGuests = guests;
    let data = event_image.map((item) => {
      if (item.type == "application/jpg") {
        imagesCount++;
      } else {
        if (item.type == "video/mp4") {
          videoCount++;
        }
      }
    });
    let profile_image = null
    if (event && event.profile_image) {
      profile_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.profile_image}`,
        Expires: 604800,
      });
    }
    let cover_image = null
    if (event && event.cover_image) {
      cover_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.cover_image}`,
        Expires: 604800,
      });
    }
    console.log(data);
    res.status(200).json({
      status: true,
      event_profile: profile_image,
      event_cover: cover_image,
      imagesCount,
      videoCount,
      maxGuests,
      totalGuests,
      message: "Data fetched successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.getTotalNumber = async (req, res) => {
  try {
    let { _id } = req.body
    console.log(req.body);
    let imagesCount = await Gallery.count({ isDeleted: false, eventId: _id, type: "application/jpg" });
    let videoCount = await Gallery.count({ isDeleted: false, eventId: _id, type: {$in: ["video/mp4", "application/mp4"]} });
    // let event_image = await Gallery.find({ isDeleted: false, _id });
    let event = await Event.findById({ _id });
    let totalGuests = await JointEvent.count({ EventId: _id });
    // console.log(event);
    // let guests = event.maxGuest;
    let maxGuests = event.maxGuest;
    // let data = event_image.map((item) => {
    //   if (item.type == "application/jpg") {
    //     imagesCount++;
    //   } else {
    //     if (item.type == "video/mp4") {
    //       videoCount++;
    //     }
    //   }
    // });
    let profile_image = null
    if (event && event.profile_image) {
      profile_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.profile_image}`,
        Expires: 604800,
      });
    }
    let cover_image = null
    if (event && event.cover_image) {
      cover_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${event.cover_image}`,
        Expires: 604800,
      });
    }
    res.status(200).json({
      status: true,
      event_profile: profile_image,
      event_cover: cover_image,
      imagesCount,
      videoCount,
      maxGuests: totalGuests,
      totalGuests,
      message: "Data fetched successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.saveUserName = async (req, res) => {
  try {
    let { device_id, user_name } = req.body
    if (device_id == undefined || device_id == "" || user_name == undefined || user_name == "") {
      res.status(200).json({
        status: false,
        message: "All parameters are required "
      })
    } else {
      let findUser = await User.findOne({ deviceId: device_id })
      if (findUser) {
        findUser.username = user_name
        await findUser.save()
        res.status(200).json({
          status: true,
          message: "user name saved successfully..!"
        })
      } else {
        res.status(200).json({
          staus: false,
          message: "user does not exist..!"
        })
      }
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      status: false,
      message: "something went wrong please try again later"
    })
  }
}

// Version 2
exports.eventByID = async (req, res) => {
  try {
    let { event_id } = req.body;
    let event = await Event.findById(event_id).populate("tasks", "name").exec();
    if (event) {
      res.status(200).json({
        status: true,
        event,
        message: "Data fetched successfully"
      })
    } else {
      res.status(200).json({
        status: false,
        message: "Event not found with given ID"
      })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      status: false,
      message: "something went wrong please try again later"
    })
  }
}
exports.editEventByID = async (req, res) => {
  try {
    let {
      event_id,
      general_info,
      tasks,
      public,
      customTask,
      duration
    } = req.body;
    console.log(req.body, "body");
    let event = await Event.findById(event_id);
    if (event) {
      customTask = customTask == undefined ? [] : customTask;
      public = public == "undefined" ? false : public;
      let saveCustomTask = await saveCustomTaskFunction(customTask, event.user_id);
      let combinedTasks = [...saveCustomTask, ...tasks];
      event.tasks = combinedTasks
      event.general_info = general_info
      let license = await License.findOne({ license_number: event.license_number });
      console.log(license, "licens");
      let package = await Package.findById(license.packageId)
      console.log(package);
      let start_date = new Date(general_info.date_from);
      general_info.date_from = start_date;
      let end_date = new Date(start_date)
      let days = parseInt(package.duration)
      end_date.setDate(end_date.getDate() + days)
      // start_date.setUTCHours(0, 0, 0, 0);
      console.log(end_date)
      let newDate = end_date
      event.general_info.date_to = newDate;
      // general_info.date_to = end_date;
      event.is_public = public
      console.log(event)
      await event.save();
      res.status(200).json({
        status: true,
        message: "Event details updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while creating event",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating event",
    });
  }
};
exports.updateProfileImageOfEvent = async (req, res) => {
  try {
    let { event_id } = req.body;
    console.log(req.body)
    let event = await Event.findById(event_id);
    if (event) {
      event.profile_image = req.file.key
      await event.save();
      res.status(200).json({
        status: true,
        message: "Image updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while updating event",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while updating event",
    });
  }
};
exports.updateCoverImageOfEvent = async (req, res) => {
  try {
    let { event_id } = req.body;
    let event = await Event.findById(event_id);
    if (event) {
      event.cover_image = req.file.key
      await event.save();
      res.status(200).json({
        status: true,
        message: "Image updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while creating event",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating event",
    });
  }
};

let saveCustomTaskFunction = async (tasks, user_id) => {
  let customsTasksArr = []
  if (tasks && tasks.length > 0) {
    for (let i = 0; i < tasks.length; i++) {
      let taskCheck = await Task.findOne({ name: tasks[i] });
      if (taskCheck) {
        customsTasksArr.push(taskCheck.id)
      } else {
        let newTask = await Task.create({
          name: tasks[i],
          unCategorized: true,
          status: 1,
          createdBy: user_id,
        })
        customsTasksArr.push(newTask.id)
      }
    }
  }
  return customsTasksArr
}