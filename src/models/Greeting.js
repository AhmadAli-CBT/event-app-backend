const mongoose = require('mongoose');
const greetingSchema = mongoose.Schema(
    {
        event_id: mongoose.Types.ObjectId,
        title: String,
        description: String,
        user_id: mongoose.Types.ObjectId,
        images: [{ file: String, file_type: String }],
        is_deleted: {
            type: Boolean,
            default: false
        }
    }, { timestamps: true }
);
const Greeting = mongoose.model('Greeting', greetingSchema);
module.exports = Greeting;