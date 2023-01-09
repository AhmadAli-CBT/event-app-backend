var AWS = require("aws-sdk");
const Category = require("../models/category");
const Packages = require("../models/packages");
const License = require("../models/License");
const { default: mongoose } = require("mongoose");
const credentials = {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region,
};
AWS.config.update({ credentials });
const s3 = new AWS.S3({
  endpoint: 's3-eu-central-1.amazonaws.com',
  signatureVersion: 'v4',
  region: 'eu-central-1'
});

exports.get = async (req, res) => {
  try {
    let packages = await Packages.find().sort({createdAt: -1});
    // console.log(packages);
    if (packages.length > 0) {
      res.status(200).json({
        status: true,
        packages,
        message: "packages fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        packages: [],
        message: "Error while fetched  packages",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching packages",
    });
  }
};
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    let packages = await Packages.findByIdAndDelete(id);
    if (packages) {
      res.status(200).json({
        status: true,
        packages,
        message: "packages deleted successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while deleted  packages",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while deleted packages",
    });
  }
};
exports.create = async (req, res) => {
  try {
    console.log(req.body)
    const { title, maxMedia, mediaTypeallowed, accesstodownloads, maxGuest, downloadAllowed, unregisteredGuest, duration } = req.body.inputValues;
    let packages = await Packages.create({ title, maxMedia, mediaTypeallowed, maxGuest, downloadAllowed, accesstodownloads, unregisteredGuest, duration: duration });

    if (packages) {
      res.status(200).json({
        status: true,
        packages,
        message: "packages created successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while created  packages",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while created packages",
    });
  }
};
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.body)
    const { title, maxMedia, mediaTypeallowed, maxGuest, downloadAllowed, unregisteredGuest, accesstodownloads,duration } = req.body.inputValues;
    let packages = await Packages.findByIdAndUpdate(id, { title, maxMedia, mediaTypeallowed, maxGuest, downloadAllowed, accesstodownloads, unregisteredGuest,duration });

    if (packages) {
      res.status(200).json({
        status: true,
        packages,
        message: "packages updated successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while updated  packages",
      });
    }
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while updated packages",
    });
  }
};
exports.licensesByPackageID = async (req, res) => {
  try {
    let { package_id } = req.params
    console.log(req.params.package_id);
    let boolean = true
    let unUsedLicenses = await License.find({is_used:false,packageId:package_id})
    let licenses = await License.aggregate([{ $match: { packageId: mongoose.Types.ObjectId(package_id) } },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: 'license_id',
        as: "event_info"
      }
    },
    {
      $unwind: "$event_info"
    }
    ]);
    console.log(licenses);
    if (licenses.length > 0) {
      res.status(200).json({
        status: true,
        unUsedLicenses,
        licenses,
        message: "licenses fetched successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        unUsedLicenses:[],
        licenses: [],
        message: "Error while fetched licenses",
      });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      status: false,
      error: err.message,
      message: "Error while fetching packages",
    });
  }
};