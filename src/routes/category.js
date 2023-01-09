var express = require("express");
var router = express.Router();
let aws = require("aws-sdk");
// const auth = require("../middleware/auth");
let Category = require('../controllers/category')

router.post("/", Category.create);
router.get("/", Category.get);
router.post("/edit", Category.editCategory);
router.post("/delete", Category.deleteCategory);
module.exports = router;