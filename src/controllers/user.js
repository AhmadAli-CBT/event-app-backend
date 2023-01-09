const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/token");
let mongoose = require("mongoose");
var AWS = require("aws-sdk");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
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

exports.register = async (req, res, next) => {
  try {
    let { email, username, password } = req.body;
    if (await User.findOne({ email })) {
      res.status(400).json({
        status: false,
        message: "Email already exists",
      });
    } else {
      crypto.randomBytes(32, async (err, buffer) => {
        let hashedPass = await bcrypt.hash(password, 10);
        password = hashedPass;

        let tokens;

        if (err) {
          console.log(err);
        }
        tokens = buffer.toString("hex");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: "beautypalmist@gmail.com", // generated ethereal user
            pass: "yucshktuqvvvuprd", // generated ethereal password
          },
        });

        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: "beautypalmist@gmail.com",
          to: email, // list of receivers
          subject: `Confirm Your Email`, // Subject line

          html: `
  <p>You requested for Create Account</p>
  <h5>click in this <a href='https://eventapp.thecbt.cyou/verify/${tokens}'>link</a> to active Your Account if you dont sent request to Create account then ignore this message</h5>
  `,
        });
        let user = await User.create({
          username,
          password,
          role: "host",
          email,
          resetToken: tokens,
          active: false,
        });
        if (user) {
          let token = await generateToken(user.id);
          res.status(200).json({
            status: true,
            token,
            role: user.role,
            message: "User registered successfully",
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Error while registering user",
          });
        }
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;
    let user = await User.findOne({ email });
    let userGuest = await User.findOne({ socialEmail: email });
    if (user) {

      if (user.profile?.image_key) {
        let presignedThumbnailGETURL = s3.getSignedUrl("getObject", {
          Bucket: process.env.bucket,
          Key: `${user.profile.image_key}`,
          Expires: 604800,
        });
        user.photoURL = presignedThumbnailGETURL;
      }
      if (await bcrypt.compare(password, user.password)) {
        let token = await generateToken(user.id);
        res.status(200).json({
          status: true,
          token,
          user,
          accountStatus: user.status,
          role: user.role,
          message: "Login successful",
        });
      }

      else {
        res.status(200).json({
          status: false,
          token: null,
          message: "Invalid credentials",
        });
      }
    }
    else if (userGuest) {
      if (userGuest.active) {
        if (userGuest.profile?.image_key) {
          let presignedThumbnailGETURL = s3.getSignedUrl("getObject", {
            Bucket: process.env.bucket,
            Key: `${userGuest.profile.image_key}`,
            Expires: 604800,
          });
          userGuest.photoURL = presignedThumbnailGETURL;
        }
        if (await bcrypt.compare(password, userGuest.password)) {
          return res.status(200).json({
            status: true,

            user: userGuest,

            message: "Login successful",
          });
        } else {
          return res.status(200).json({
            status: false,
            token: null,
            message: "Invalid credentials",
          });
        }
      } else {
        return res.status(200).json({
          status: false,

          message: "Email is not verify",
        });
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Error while registering user",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.getUserById = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).select({
      username: 1,
      email: 1,
      role: 1,
      profile: 1,
    });
    if (user) {
      let presignedThumbnailGETURL = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${user.profile.image_key}`,
        Expires: 604800,
      });
      user.profile.image_location = presignedThumbnailGETURL;
      // console.log(user)
      res.status(200).json({
        status: true,
        user,
        message: "Data fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while fetching",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.getUserByRole = async (req, res) => {
  try {
    let { limit, offset, search, type, sort } = req.body;

    let total_host = await User.count({
      name: { $regex: search, $options: "i" },
      status: type,
      role: "host",
    });
    let host;
    if (search && search.length > 0) {
      host = await User.find({
        name: { $regex: search, $options: "i" },
        status: type,
        role: "host",
      }).sort({createdAt: -1})
        .skip(offset * limit)
        .limit(limit);
    } else {
      host = await User.find({ status: type, role: "host" }).sort({createdAt: -1})
        .skip(offset * limit)
        .limit(limit);
    }
    // .sort(sort)
    let approvedhost = await User.find({ status: 1, role: "host" });
    let blockhost = await User.find({ status: 2, role: "host" });
    let pendinghost = await User.find({ status: 0, role: "host" });

    // let host = await Task.find()
    //     .select({
    //         name: 1
    //     });
    res.status(200).json({
      host,
      total_host,
      pending: pendinghost,
      approved: approvedhost,
      rejected: blockhost,
      status: true,
      message: "host fetched successfully",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching Host",
    });
  }
};

exports.updateHostStatus = async (req, res) => {
  try {
    let { host_id, status } = req.body;
    let host = await User.findById(host_id).update({
      status,
    });
    console.log(host_id, 2);
    if (host) {
      res.status(200).json({
        host,
        status: true,
        message: "Task updated successfully",
      });
    } else {
      res.status(200).json({
        host: null,
        status: false,
        message: "Error while updating host",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating host",
    });
  }
};
exports.updateProfile = async (req, res, next) => {
  try {
    let { name, email } = req.body;
    console.log(req.body);
    let user = await User.findById(req.user.id);
    if (email == user.email) {
      user.username = name;
      await user.save();
      res.status(200).json({
        status: true,
        message: "Profile updated successfully",
      });
    } else {
      if (await User.findOne({ email })) {
        res.status(200).json({
          status: false,
          message: "Email already exists",
        });
      } else {
        let user = await User.findById(req.user.id).update({
          username: name,
          email,
        });
        res.status(200).json({
          status: true,
          message: "Profile updated successfully",
        });
      }
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.updateProfileImage = async (req, res, next) => {
  try {
    let profile = {
      image_key: req.file.key,
    };
    let user = await User.findById(req.user.id).update({ profile });
    if (user) {
      res.status(200).json({
        status: true,
        message: "Profile image updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while updating profile image",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};
exports.updatePassword = async (req, res, next) => {
  try {
    let { old_password, new_password } = req.body;


    let user = await User.findById(req.user.id);

    if (await bcrypt.compare(old_password, user.password)) {
      let hashedPass = await bcrypt.hash(new_password, 10);
      user.password = hashedPass;
      await user.save();
      res.status(200).json({
        status: true,
        message: "User profile updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        token: null,
        message: "Your old Password is incorrect",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};

exports.updateSocialProfile = async (req, res, next) => {
  try {
    let { photoURL, type, name, socialEmail } = req.body;

    let user = await User.findById(req.user.id);
    if (type == "google" || type == "fb") {
      if (
        photoURL != "" ||
        (photoURL != undefined && name != "") ||
        (name != undefined && socialEmail != "") ||
        socialEmail != undefined
      ) {
        user.photoURL = photoURL;
        user.type = type;
        user.socialEmail = socialEmail;
        user.name = name;
        console.log(user);
        await user.save();
        res.status(200).json({
          status: true,
          user,
          message: "User profile updated successfully",
        });
      } else {
        res.status(200).json({
          status: false,

          message: " All fields are manadatory",
        });
      }
    } else {
      res.status(200).json({
        status: false,

        message: "Error while updating profile",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};

exports.getUserSocialLogin = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    let presignedThumbnailGETURL = s3.getSignedUrl("getObject", {
      Bucket: process.env.bucket,
      Key: `${user.profile.image_key}`,
      Expires: 604800,
    });
    user.photoURL = presignedThumbnailGETURL;
    // console.log(user)
    res.status(200).json({
      status: true,
      user,
      message: "Data fetched successfully",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};

exports.GuestRegister = async (req, res, next) => {
  try {
    let { email, username, password } = req.body;

    if (await User.findOne({ socialEmail: email })) {
      res.status(400).json({
        status: false,
        message: "Email already exists",
      });
    } else {
      crypto.randomBytes(32, async (err, buffer) => {
        let profile = {
          image_key: req.file.key,
        };
        const user = await User.findById({ _id: req.user.id });

        let hashedPass = await bcrypt.hash(password, 10);
        // let profile_image = await s3.getSignedUrl("getObject", {
        //   Bucket: process.env.bucket,
        //   Key: `${profile_image.profile_image}`,
        //   Expires: 604800,
        // });

        let tokens;

        if (err) {
          console.log(err);
        }
        tokens = buffer.toString("hex");

        user.password = hashedPass;
        user.name = username;
        user.socialEmail = email;
        user.profile = profile;
        user.resetToken = tokens;
        user.active = false;
        user.save();
        const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: "beautypalmist@gmail.com", // generated ethereal user
            pass: "yucshktuqvvvuprd", // generated ethereal password
          },
        });

        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: "beautypalmist@gmail.com",
          to: email, // list of receivers
          subject: `Confirm Your Email`, // Subject line

          html: `
  <p>You requested for Create Account</p>
  <h5>click in this <a href='https://eventapp.thecbt.cyou/verify/${tokens}'>link</a> to active Your Account if you dont sent request to Create account then iqnore this message</h5>
  `,
        });
        if (user) {
          // let token = await generateToken(user.id);
          res.status(200).json({
            status: true,

            message: "User registered successfully",
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Error while registering user",
          });
        }
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Something went wrong",
    });
  }
};

exports.confirmEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.body.token,
    });

    if (!user)
      return res.status(422).json({ error: "Try again session expired" });

    user.resetToken = "";
    user.active = true;
    await user.save();
    res.json({ message: "Email Approved" });
  } catch (err) {
    console.log(err);
  }
};
