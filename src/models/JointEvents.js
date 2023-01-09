const mongoose = require("mongoose");
const jointEvent = mongoose.Schema(
  {
    uid: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    EventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    tasksId: [
      {
        taskid: mongoose.Schema.Types.ObjectId,
        status: Boolean,
      },
    ],
  },
  { timestamps: true }
);
const JointEvent = mongoose.model("participant", jointEvent);
module.exports = JointEvent;
