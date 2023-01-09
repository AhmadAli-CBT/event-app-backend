const mongoose = require("mongoose");
const Event = require("../models/Event");
const gallery = require("../models/Gallery");
const JointEvent = require("../models/JointEvents");
const Task = require("../models/Task");
var AWS = require("aws-sdk");
const credentials = {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region
};
AWS.config.update({ credentials });
const s3 = new AWS.S3({
  endpoint: "s3-eu-central-1.amazonaws.com",
  signatureVersion: "v4",
  region: "eu-central-1",
});
// Host Routes
exports.create = async (req, res) => {
  try {
    let { name, categoryId } = req.body;
    console.log(req.body)
    let task;
    if (categoryId == "") {
      task = await Task.create({
        name,
        unCategorized: true,
        status: 1,
        createdBy: req.user.id,
      });
    } else {
      task = await Task.create({
        name,
        unCategorized: false,
        status: 1,
        categoryId,
        createdBy: req.user.id,
      });
    }
    if (task) {
      res.status(200).json({
        status: true,
        message: "Task created successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while creating task",
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
exports.createTaskHost = async (req, res) => {
  try {
    let { name } = req.body;

    let task = await Task.create({
      name,
      categoryId,
      status: 0,
      createdBy: req.user.id,
    });
    if (task) {
      res.status(200).json({
        status: true,
        message: "Task created successfully",
      });
    } else {
      res.status(200).json({
        status: false,
        message: "Error while creating task",
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
exports.viewAll = async (req, res) => {
  try {
    let { limit, offset, search, type, sort } = req.body;
    let total_tasks = await Task.count();
    let tasks;
    if (search && search.length > 0) {
      tasks = await Task.find();
    } else {
      tasks = await Task.find();
    }
    // .sort(sort)
    let pendingTasks = await Task.find({ status: 0 });
    let approvedTasks = await Task.find({ status: 1 });
    let rejectedTasks = await Task.find({ status: 2 });
    // let tasks = await Task.find()
    //     .select({
    //         name: 1
    //     });
    res.status(200).json({
      tasks,
      total_tasks,
      pending: pendingTasks,
      approved: approvedTasks,
      rejected: rejectedTasks,
      status: true,
      message: "Tasks fetched successfully",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.viewAllTasksImagesOfCurrentUser = async (req, res) => {
  try {
    let { task_id, participant_id } = req.body;
    let images = await gallery.find({ pid: participant_id, taskId: task_id });
    for (let i = 0; i < images.length; i++) {
      let profile_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.bucket,
        Key: `${images[i].image}`,
        Expires: 604800,
      });
      let user_id = req.user.id;
      let liked = await gallery.findOne({
        _id: images[i]._id,
        "likes.user_id": mongoose.Types.ObjectId(user_id),
      });
      // console.log(liked)
      if (liked) {
        // console.log('------------- is liked')
        images[i].is_liked = true;
      } else {
        // console.log('-------------')
        images[i].is_liked = false;
      }
      images[i].image = profile_image;
      // console.log(images[i].comments.length);
      images[i].commentsCount = images[i].comments.length;
    }
    // console.log(images)
    let task = await Task.findById(task_id);
    res.status(200).json({
      status: true,
      task,
      images,
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while fetching data",
    });
  }
};
exports.viewAllTasksOfUser = async (req, res) => {
  try {
    let { limit, offset, search, type, sort } = req.body;
    let total_tasks = await Task.count({
      name: { $regex: search, $options: "i" },
      status: type,
      createdBy: mongoose.Types.ObjectId(req.user.id),
      is_deleted: false,
    });
    let tasks;
    if (search && search.length > 0) {
      tasks = await Task.find({
        name: { $regex: search, $options: "i" },
        status: type,
        is_deleted: false,
      })
        .skip(offset * limit)
        .limit(limit)
        .select({
          name: 1,
        });
    } else {
      tasks = await Task.find({ status: type, is_deleted: false })
        .skip(offset * limit)
        .limit(limit);
    }
    // .sort(sort)
    let pendingTasks = await Task.find({ status: 0 });
    let approvedTasks = await Task.find({ status: 1 });
    let rejectedTasks = await Task.find({ status: 2 });
    // let tasks = await Task.find()
    //     .select({
    //         name: 1
    //     });
    res.status(200).json({
      tasks,
      total_tasks,
      pending: pendingTasks,
      approved: approvedTasks,
      rejected: rejectedTasks,
      status: true,
      message: "Tasks fetched successfully",
    });
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
    let { task_id } = req.body;
    console.log(req.body)
    let task = await Task.findById(task_id);
    task.is_deleted = true;
    await task.save();
    if (task) {
      res.status(200).json({
        task,
        status: true,
        message: "Task updated successfully",
      });
    } else {
      res.status(200).json({
        task: null,
        status: false,
        message: "Error while updating task",
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
exports.viewAllApproved = async (req, res) => {
  try {
    let tasks = await Task.find({ status: 1, unCategorized: false, is_deleted: false });
    // console.log(tasks)
    if (tasks && tasks.length) {
      res.status(200).json({
        tasks,
        status: true,
        message: "Tasks fetched successfully",
      });
    } else {
      res.status(200).json({
        tasks,
        status: true,
        message: "Tasks fetched successfully",
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
exports.getRandomTask = async (req, res) => {
  try {
    // console.log(req.body);
    let { event_id } = req.body;
    // console.log(req.body);
    let event = await Event.findOne({
      _id: event_id,
      is_deleted: false,
    });
    if (event) {
      const jointEvent = await JointEvent.findOne({
        uid: req.user.id,
        EventId: event_id,
      });
      if (jointEvent && jointEvent.tasksId && jointEvent.tasksId.length > 0) {
        // console.log('---------')
        let getRandomtask = await getRandomTaskFunction(
          jointEvent.tasksId,
          event.tasks
        );
        console.log(getRandomtask);
        let randomTaskIndex = Math.floor(Math.random() * getRandomtask.length);
        // console.log(randomTaskIndex)
        let task = await Task.findById(getRandomtask[randomTaskIndex]);
        if (task) {
          // jointEvent.tasksId.push({ taskid: task._id, status: false });
          // await jointEvent.save();
          res.status(200).json({
            task: task,
            id: jointEvent._id,
            status: true,
            taskstatus: false,
            message: "Tasks fetched successfully",
          });
        } else {
          res.status(200).json({
            task: {},
            id: jointEvent._id,
            status: true,
            taskstatus: false,
            message: "Tasks fetched successfully",
          });
        }
      } else {
        if (event) {
          const task = Math.floor(Math.random() * event.tasks.length);
          let tasks = await Task.findById(event.tasks[task]);
          res.status(200).json({
            task: tasks,
            id: jointEvent._id,
            status: true,
            taskstatus: false,
            message: "Tasks fetched successfully",
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Error while assigning task",
          });
        }

      }

    } else {
      res.status(200).json({
        status: false,
        task: null,
        id: null,
        taskstatus: null,
        message: "Something went wrong please try again later",
      });
    }
  }
  catch (err) {
    console.log(err);
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.deleteTaskOfAUser = async (req, res) => {
  try {
    let { task_id, participant_id } = req.body;
    console.log(req.body)
    let task = await Task.findById(task_id);
    if (task) {
      let galleryInstance = await gallery.findOne({
        taskId: task.id,
        pid: participant_id,
        isDeleted: false
      });
      if (galleryInstance) {
        let participant = await JointEvent.findOne({ uid: req.user.id });
        // console.log(participant,"participant");
        if (participant) {
          let participantById = await JointEvent.findById(participant_id)
          console.log(participant)
          // console.log(participant,"aaaa")
          // array.splice(index, 1);
          let index = -1;
          console.log('task_id : ', task_id, task.id)
          console.log('task_ids : ', participantById.tasksId)
          for (let i = 0; i < participantById.tasksId.length; i++) {
            if (String(participantById.tasksId[i].taskid) == String(task.id)) {
              index = i;
              break;
            }
          }
          console.log(index, '888888-----------')
          if (index > -1) {
            participantById.tasksId.splice(index, 1);
            await participantById.save();
            let galleryById = await gallery.findById(galleryInstance.id);
            galleryById.isDeleted = true;
            // console.log(galleryById)
            await galleryById.save();
            res.status(200).json({
              status: true,
              message: "Task deleted successfully",
            });
          }
          else {
            let galleryById = await gallery.findById(galleryInstance.id);
            galleryById.isDeleted = true;
            console.log(galleryById)
            await galleryById.save();
            res.status(200).json({
              status: false,
              message: "Error while deleting task",
            });
            // res.status(200).json({
            //   status: false,
            //   message: "No Tasks of User Found",
            // });
          }
        } else {
          res.status(200).json({
            status: false,
            message: "participant not found",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          message: "gallery not found",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "task not found",
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
}
exports.checkIfAllTasksAreDone = async (req, res) => {
  try {
    let { event_id } = req.body;
    let event = await Event.findById(event_id);
    if (event) {
      const participant = await JointEvent.findOne({
        uid: req.user.id,
        EventId: event_id,
      });
      if (participant) {
        // console.log(event)
        // console.log(participant)
        if (
          participant.tasksId.length > 0 &&
          event.tasks.length > 0 &&
          event.tasks.length == participant.tasksId.length
        ) {
          res.status(200).json({
            status: true,
            tasks_available: false,
            message: "All tasks completed",
          });
        } else {
          res.status(200).json({
            status: true,
            tasks_available: true,
            message: "Tasks available",
          });
        }
      } else {
        res.status(200).json({
          status: false,
          message: "Participant not found with given ID",
        });
      }
    } else {
      res.status(200).json({
        status: false,
        message: "event not found with given ID",
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

// Admin Routes
exports.viewAll = async (req, res) => {
  try {
    console.log('admin api')
    let { limit, offset, search, type, sort } = req.body;
    let total_tasks = await Task.count({
      is_deleted: false,
    });
    console.log(total_tasks, 'tot')
    let tasks;
    if (search && search.length > 0) {
      tasks = await Task.find()
        .select({
          name: 1,
        });
    } else {
      tasks = await Task.find();
    }
    // .sort(sort)
    let pendingTasks = await Task.find({ status: 0, is_deleted: false }).select(
      { name: 1 }
    );
    let approvedTasks = await Task.find({
      status: 1,
      is_deleted: false,
    });
    let rejectedTasks = await Task.find({
      status: 2,
      is_deleted: false,
    });
    // let tasks = await Task.find()
    //     .select({
    //         name: 1
    //     });
    res.status(200).json({
      tasks,
      total_tasks,
      pending: pendingTasks,
      approved: approvedTasks,
      rejected: rejectedTasks,
      status: true,
      message: "Tasks fetched successfully",
    });
  } catch (err) {
    res.status(200).json({
      status: false,
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.update = async (req, res) => {
  try {
    let { task_id, categoryId, name } = req.body;
    console.log(req.body);
    if (categoryId == "") {
      let task = await Task.findById({ _id: task_id }).update({
        name,
        unCategorized: true,
      });
      if (task) {
        res.status(200).json({
          task,
          status: true,
          message: "Task updated successfully",
        });
      } else {
        res.status(200).json({
          task: null,
          status: false,
          message: "Error while updating task",
        });
      }
    } else {
      let task = await Task.findById({ _id: task_id }).update({
        categoryId,
        name,
        unCategorized: false,
      });
      if (task) {
        res.status(200).json({
          task,
          status: true,
          message: "Task updated successfully",
        });
      } else {
        res.status(200).json({
          task: null,
          status: false,
          message: "Error while updating task",
        });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      status: false,
      error: err.message,
      message: "Something went wrong please try again later..!",
    });
  }
};
exports.edit = async (req, res) => {
  try {
    let { task_id, name } = req.body;
    console.log("edit", req.body);
    let task = await Task.findById(task_id).update({
      name,
    });
    if (task) {
      res.status(200).json({
        task,
        status: true,
        message: "Task updated successfully",
      });
    } else {
      res.status(200).json({
        task: null,
        status: false,
        message: "Error while updating task",
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
exports.changestatus = async (req, res) => {
  try {
    let { taskId, pid } = req.body;
    console.log(req.body);

    let taskupdate = await JointEvent.findOne({
      _id: pid,
    });
    taskupdate.tasksId.push({ taskid: taskId, status: true });
    await taskupdate.save();
    if (taskupdate) {
      res.status(200).json({
        task: taskupdate.tasksId[taskupdate.tasksId.length - 1],
        status: true,
        message: "Task updated successfully",
      });
    } else {
      res.status(200).json({
        task: taskupdate.tasksId[taskupdate.tasksId.length - 1],
        status: false,
        message: "Error while updating task",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json({
      error: err.message,
      message: "Error while creating task",
    });
  }
};
exports.completeTask = async (req, res) => {
  try {
    let { id } = req.params;
    const taskupdate = await JointEvent.aggregate([
      {
        $match: {
          "tasksId.status": true,
          EventId: mongoose.Types.ObjectId(id),
          uid: mongoose.Types.ObjectId(req.user.id),
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "tasksId.taskid",
          foreignField: "_id",
          as: "participant",
        },
      },
      {
        $unwind: "$participant",
      },

    ]);
    console.log(taskupdate, "asasassa");
    const alltask = taskupdate.map((val) => val.participant);

    let event = await Event.findById(id);

    if (taskupdate.length > 0) {
      res.status(200).json({
        task: alltask,
        completeCount: alltask.length,
        status: true,
        randomCount: event.tasks.length,
        message: "Completed Task",
      });
    } else {
      res.status(200).json({
        task: [],
        completeCount: 0,
        status: true,
        randomCount: event.tasks.length,
        message: "Completed Task",
      });
    }
  } catch (err) {
    console.log(err.message, 'catch response');
    res.status(200).json({
      error: err.message,
      message: "Error while creating task",
    });
  }
};
let getRandomTaskFunction = async (userTasks, allTasks) => {
  try {
    let tasks = [];
    console.log("--------------------------");
    // console.log(userTasks)
    // console.log(allTasks)
    let array1 = [];
    let array2 = [];
    for (let i = 0; i < allTasks.length; i++) {
      array1.push(String(allTasks[i]));
    }
    for (let i = 0; i < userTasks.length; i++) {
      array2.push(String(userTasks[i].taskid));
    }
    tasks = array1.filter(function (obj) {
      return array2.indexOf(obj) == -1;
    });
    console.log("--------------", tasks);
    return tasks;
  } catch (err) {
    console.log(err);
  }
};
