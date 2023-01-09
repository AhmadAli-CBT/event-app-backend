const mongoose = require("mongoose");
const package = mongoose.Schema({
  mediaTypeallowed: String,
  maxMedia: Number,
  maxGuest: Number,
  accesstodownloads:Number,
  downloadAllowed: String,
  unregisteredGuest: String,
  duration: Number,
  title:String,
}, { timestamps: true }
);
const packages = mongoose.model("package", package);
module.exports = packages;
