const { path } = require("express/lib/application");
const mongoose = require("mongoose");
const usersSchema = mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    role: String,
    deviceId: String,
    status: { default: 0, type: Number },
    photoURL: String,
    type: String,
    name: String,
    resetToken:String,
    active:Boolean,
    socialEmail: String,
    profile: {
      image_location: String,
      image_key: String,
    },
  },
  { timestamps: true }
);
const User = mongoose.model("User", usersSchema);
module.exports = User;
