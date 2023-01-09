const Greeting = require("../models/Greeting");
var AWS = require("aws-sdk");
const Event = require("../models/Event");
let mongoose = require("mongoose")

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
exports.saveGreetings = async (req, res) => {
  try {
    let { event_id, title, description } = req.body;
    // let galleryLimit = await gallery.countDocuments({
    //   eventId: req.body.event_id,
    // });
    let count = await Event.findById(req.body.event_id);
    // console.log(count);
    if (true) {
      if (req.files.length > 0) {
        let images = [];
        for (let i = 0; i < req.files.length; i++) {
          images.push({ file: req.files[i].key, file_type: req.files[i].mimetype });
        }
        let newGreeting = await Greeting.create({
          event_id,
          title,
          description,
          user_id: req.user.id,
          images,
        });
        console.log(newGreeting);
        if (newGreeting) {
          res.status(200).json({
            status: true,
            message: "Data added successfully",
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Something went wrong",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          message: "No files found",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "Limit Exceed",
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
exports.viewGreetingsAdmin = async (req, res) => {
  try {
    let { event_id } = req.body;
    // let greetings = await Greeting.find({
    //   event_id,
    //   is_deleted: false,
    // });
    let event = await Event.findById(event_id)
    let greetings = await Greeting.aggregate([
      {
        $match: { event_id: mongoose.Types.ObjectId(event_id), is_deleted: false }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
    ]);
    if (greetings) {
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        greetings,
        event
      });
    } else {
      res.status(200).json({
        status: false,
        greetings: null,
        message: "Event is deleted",
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
exports.viewGreetingById = async (req, res) => {
  try {
    let { greeting_id } = req.body;
    console.log(req.body);
    let greeting = await Greeting.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(greeting_id) }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "_id",
          as: "event"
        }
      },
      {
        $unwind: "$event"
      }
    ]);
    console.log(greeting)
    if (greeting && greeting.length > 0) {
      for (let i = 0; i < greeting[0].images.length; i++) {
        let profile_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${greeting[0].images[i].file}`,
          Expires: 604800,
        });
        greeting[0].images[i].file = profile_image;
      }
      let user_image = null
      if (greeting[0].user.profile && greeting[0].user.profile.image_key) {
        user_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${greeting[0].user.profile.image_key}`,
          Expires: 604800,
        });
      }
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        greeting: greeting[0],
        user_image
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        greetings: null,
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching data",
    });
  }
};
exports.viewGreetings = async (req, res) => {
  try {
    let { event_id } = req.body;
    console.log(req.body);
    let result = await Event.findOne({
      _id: event_id,
      is_deleted: false,
    });
    if (result) {
      let greetings = await Greeting.findOne({
        event_id,
        user_id: req.user.id,
        is_deleted: false,
      });
      if (greetings) {
        for (let i = 0; i < greetings.images.length; i++) {
          let profile_image = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${greetings.images[i].file}`,
            Expires: 604800,
          });
          greetings.images[i].file = profile_image;
        }
        res.status(200).json({
          status: true,
          message: "Data fetched successfully",
          greetings,
        });
      } else {
        res.status(200).json({
          status: true,
          message: "Data fetched successfully",
          greetings: null,
        });
      }
    }
    else {
      res.status(200).json({
        status: false,
        greetings: null,
        message: "Event is deleted",
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
exports.deleteGreeting = async (req, res) => {
  try {
    let { greeting_id } = req.body;
    console.log(req.body);
    let greetings = await Greeting.findByIdAndUpdate(
      { _id: greeting_id },
      { is_deleted: true }
    );
    if (greetings) {
      res.status(200).json({
        status: true,
        message: "Greeting deleted successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while deleting greeting",
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