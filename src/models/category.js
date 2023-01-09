const mongoose = require('mongoose');
const category = mongoose.Schema(
    {
        name: String,
        is_deleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);
const Category = mongoose.model('category', category);
module.exports = Category;