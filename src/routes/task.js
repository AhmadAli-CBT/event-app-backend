var express = require("express");
var router = express.Router();
let Task = require('../controllers/task');
const admin_auth = require("../middleware/admin_auth");
const auth = require("../middleware/auth");

// host routes
router.post("/", auth, Task.create)
router.post("/", auth, Task.viewAll)
router.post("/details-for-current-user", auth, Task.viewAllTasksImagesOfCurrentUser)
router.post("/user", auth, Task.viewAll)
router.get("/approved", auth, Task.viewAllApproved)
router.post("/taskComplete", auth, Task.changestatus)
router.post("/task-delete", auth, Task.deleteTaskOfAUser)

// Admin routes 

router.get("/taskcomplete/:id", auth, Task.completeTask)

router.post("/randomTask",auth, Task.getRandomTask)
router.post("/tasks-check",auth, Task.checkIfAllTasksAreDone)
router.post("/admin", auth, Task.viewAll)
router.post("/taskdeleted", Task.deleted)
router.post("/admin/update", admin_auth, Task.update)
router.get("/admin/remove", admin_auth, Task.viewAll)
router.get("/admin/edit", admin_auth, Task.viewAll)

module.exports = router;