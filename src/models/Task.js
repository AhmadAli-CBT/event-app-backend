const mongoose = require('mongoose')
const taskSchema = mongoose.Schema({
   name: {
      type: String,
     
   },
   unCategorized:{
      default:false,
      type:Boolean,
   },
   categoryId:{
      type:mongoose.Types.ObjectId,
      ref:"category"
   },
   status: Number,
   is_deleted:{
     type: Boolean,
   default:false},
   createdBy: mongoose.Types.ObjectId
}, { timestamps: true })
const Task = mongoose.model('Task', taskSchema);
module.exports = Task;