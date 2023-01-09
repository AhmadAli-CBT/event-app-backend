const { Date } = require('mongoose');

const mongoose = require('mongoose')
const gallerySchema = mongoose.Schema({
  image: String,
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  eventId: mongoose.Schema.Types.ObjectId,
  uid: mongoose.Schema.Types.ObjectId,
  pid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'participant'
  },
  eventId: {
    type: mongoose.Types.ObjectId,

  },

  comments: [
    {
      user_id: mongoose.Schema.Types.ObjectId,
      comments: String,

      createdAt : { type : Date, default: Date.now }
    }
  ],
  likes: [
    {
      user_id: mongoose.Schema.Types.ObjectId,

    },
  ],
  likes_count: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  type:String,
  isDeleted: {
    type:Boolean,
    default:false
  },
  is_liked: Boolean,
  liked: Boolean,
  commentscount: Number,
  task: {},
  user: {}
}, { timestamps: true })
const gallery = mongoose.model('gallery', gallerySchema);
module.exports = gallery;