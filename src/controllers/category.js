const Category = require('../models/category');

exports.create = async (req, res) => {
    try {
        let { name } = req.body;

        let category = await new Category({ name })
        await category.save();
        if (category) {
            res.status(200).json({
                status: true,
                message: "categroy created successfully"
            })
        } else {
            res.status(200).json({
                status: false,
                message: "Error while creating categroy"
            })
        }


    } catch (err) {
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while creating categroy"
        })
    }
};
exports.editCategory = async (req, res) => {
    try {
        let { category_id, name } = req.body;
        let category = await Category.findById(category_id);
        category.name = name;
        await category.save();
        if (category) {
            res.status(200).json({
                status: true,
                message: "categroy updated successfully"
            })
        } else {
            res.status(200).json({
                status: false,
                message: "Error while creating categroy"
            })
        }


    } catch (err) {
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while creating categroy"
        })
    }
}
exports.deleteCategory = async (req, res) => {
    try {
        let { category_id } = req.body;
        let category = await Category.findById(category_id);
        category.is_deleted = true;
        await category.save();
        if (category) {
            res.status(200).json({
                status: true,
                message: "categroy deleted successfully"
            })
        } else {
            res.status(200).json({
                status: false,
                message: "Error while creating categroy"
            })
        }


    } catch (err) {
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while creating categroy"
        })
    }
}
exports.get = async (req, res) => {
    try {
        let category = await Category.find({is_deleted: false}).sort({ createdAt: -1 });
        // console.log(category)

        if (category.length > 0) {
            res.status(200).json({
                status: true,
                category,
                message: "categroy fetched successfully"
            })
        } else {
            res.status(200).json({
                status: false,
                message: "Error while fetching categroy"
            })
        }


    } catch (err) {
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while fetching categroy"
        })
    }
}
// "attributes": {
//     "createdAt": "2022-11-09T07:10:45.984Z",
//     "updatedAt": "2022-11-10T11:00:05.429Z",
//     "publishedAt": "2022-11-09T07:10:47.835Z",
//     "home": "Home",
//     "events": "Events",
//     "host": "Hosts",
//     "guest": "Guests",
//     "category": "Categories",
//     "package": "Packages",
//     "home_welcome": "Welcome",
//     "home_happening_now": "Happening Now",
//     "home_cancelled": "Cancelled",
//     "home_upcoming": "Upcoming Events",
//     "home_welcome_text": "You've joined as",
//     "home_schedule": "Schedule of Events",
//     "home_event_name": "Event Name",
//     "home_event_start": "Start Date",
//     "home_event_end": "End Date",
//     "home_event_location": "Event Location",
//     "home_event_view_button": "View Details",
//     "category_add": "Add New Category",
//     "category_name": "Name",
//     "category_actions": "Actions",
//     "category_task_name": "Task Name",
//     "actions": "Actions",
//     "category_edit_task": "Edit Task",
//     "category_add_task": "Add New Task",
//     "add_task": "Add Task",
//     "create": "Create",
//     "select": "Select",
//     "license_count": "Select number of licenses",
//     "license_generate": "Generate License",
//     "package_add": "Add New Package",
//     "Title": "Title",
//     "media_allowed": "Media Allowd",
//     "max_upload_media": "Max Upload Media",
//     "max_guests": "Max Allowed Guests",
//     "download_allowed": "Download Allowed",
//     "unregistered_download": "Download For Unregistered Guests",
//     "show_gallery": "Show Gallery",
//     "license": "Licenses",
//     "package_title": "Title",
//     "package_days_to_show": "No of days to show gallery",
//     "package_media_type_allowed": "Media type allowed",
//     "package_max_media_upload": "No of max media allowed",
//     "package_max_guests": "No of maximum allowed guests",
//     "package_download_allowed": "Download allowed",
//     "package_unregistered": "Download allowed for unregistered guests",
//     "package_add_button": "Add"
// }