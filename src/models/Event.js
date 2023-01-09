const mongoose = require('mongoose')
const eventSchema = mongoose.Schema({
    license_number: String,
    license_id: mongoose.Types.ObjectId,
    general_info: {
        event_name: String,
        event_location: String,
        description: String,
        date_from: Date,
        date_to: Date,
        time_from: String,
        time_to: String,

    },
    duration: Number,
    user_id: mongoose.Types.ObjectId,
    profile_image: String,
    cover_image: String,
    welcome_image: String,
    is_public: Boolean,
    qrCode: {
        default: false,
        type: Boolean,
    },
    mediaTypeallowed: String,
    maxMedia: Number,
    maxGuest: Number,
    accesstodownloads: Number,
    downloadAllowed: String,
    unregisteredGuest: String,
    tasks: [{
        type: mongoose.Types.ObjectId,
        ref: "Task",
    }],
    is_deleted: {
        type: Boolean,
        default: false
    },
    is_cancelled: {
        type: Boolean,
        default: false
    },
    event_code: String
}, { timestamps: true })
const Event = mongoose.model('Event', eventSchema);
module.exports = Event;