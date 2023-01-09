const mongoose = require('mongoose');
const licenseSchema = mongoose.Schema(
    {
        license_number: {
            type: String,
        },
        is_used: {
            type: Boolean,
            default:false
        },
        packageId: {
            type: mongoose.Types.ObjectId,
            ref: "package",
        },
        user_id: mongoose.Types.ObjectId,
        event_id: mongoose.Types.ObjectId
    },
    {
        timestamps: true,
    }
);
const License = mongoose.model('License', licenseSchema);
module.exports = License;