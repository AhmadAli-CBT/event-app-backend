const path = require('path');
const fs = require('fs');
var AWS = require('aws-sdk');
const Category = require('../models/Category')
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Version = require('../models/Version');
const Main_Category = require('../models/PerentCategory');
const credentials = {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
};
AWS.config.update({ credentials: credentials, region: process.env.region });
const s3 = new AWS.S3();
exports.createCategory = async (req, res, next) => {
    try {
        let { category_name, paid, main_category_id } = req.body
        console.log(req.body)
        if (category_name == undefined || category_name == "" || req.file == undefined || req.file == [] || category_name == "" || paid == undefined) {
            res.status(400).json({
                status: false,
                message: 'All Inputs are Required..!'
            })
        } else {
            let isCategoryAlreadyExist = await Category.find({ category_name: category_name, isdeleted: false })
            if (isCategoryAlreadyExist && isCategoryAlreadyExist.length > 0) {
                res.status(422).json({
                    status: false,
                    message: "Category name is already in use"
                })
            } else {
                if (main_category_id) {
                    let findMainCategory = await Main_Category.findById({ _id: main_category_id })
                    if (findMainCategory) {
                        let category = await Category.create({
                            category_name: category_name,
                            category_image: req.file.location,
                            main_category: main_category_id,
                            paid: paid,
                            image_key: req.file.key
                        })
                        if (category) {
                            let find_version = await Version.findOne({})
                            if (find_version) {
                                find_version.last_updated_category = new Date()

                                await find_version.save()
                                res.status(200).json({
                                    status: true,
                                    data: category,
                                    message: "Category Added Successfully"
                                })
                            } else {
                                res.status(400).json({
                                    status: false,
                                    message: 'version not found error while creating category'
                                })
                            }
                        } else {
                            res.status(400).json({
                                status: false,
                                message: 'error while creating category'
                            })
                        }
                    } else {
                        res.status(400).json({
                            status: false,
                            message: 'main category not found..'
                        })
                    }
                } else {
                    let category = await Category.create({
                        category_name: category_name,
                        category_image: req.file.location,
                        paid: paid,
                        image_key: req.file.key
                    })
                    if (category) {
                        let find_version = await Version.findOne({})
                        if (find_version) {
                            find_version.last_updated_category = new Date()

                            await find_version.save()
                            res.status(200).json({
                                status: true,
                                data: category,
                                message: "Category Added Successfully"
                            })
                        } else {
                            res.status(400).json({
                                status: false,
                                message: 'version not found error while creating category'
                            })
                        }
                    } else {
                        res.status(400).json({
                            status: false,
                            message: 'error while creating category'
                        })
                    }
                }

            }
        }

    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.viewAllCategoryDetails = async (req, res, next) => {
    try {
        if (req.user_id && req.user_id != 1) {
            let { skip = 0, limit = 10, } = req.body;
            let count = await Category.count({ isdeleted: false })
            const category_details = await Category.aggregate(
                [
                    { $match: { "isdeleted": false }, },
                    { $sort: { "createdAt": -1 } },
                    { $skip: skip * limit },
                    { $limit: limit },
                ]
            )
            if (category_details && category_details.length > 0) {
                for (let i = 0; i < category_details.length; i++) {
                    let quote_count = await Quote.count({ category_id: category_details[i]._id, isdeleted: false })
                    var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                        Bucket: process.env.bucket,
                        Key: `${category_details[i].image_key}`, //filename
                        Expires: 604800 //time to expire in seconds
                    });
                    category_details[i].category_image = presignedThumbnailGETURL
                    category_details[i].quote_count = quote_count
                }
                res.status(200).json({
                    status: true,
                    data: category_details,
                    count: count
                })
            } else {
                res.status(400).json({
                    status: false,
                    message: 'No category found',
                })
            }
        } else {
            let { skip = 0, limit = 10, } = req.body;
            const category_details = await Category.aggregate(
                [
                    { $match: { "isdeleted": false }, },
                    { $sort: { "createdAt": -1 } },
                    {
                        $project: {
                            isdeleted: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            __v: 0
                        }
                    },
                    { $skip: skip * limit },
                    { $limit: limit },
                ]
            )
            if (category_details && category_details.length > 0) {
                for (let i = 0; i < category_details.length; i++) {
                    let presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                        Bucket: process.env.bucket,
                        Key: `${category_details[i].image_key}`, //filename
                        Expires: 604800 //time to expire in seconds
                    });
                    category_details[i].category_image = presignedThumbnailGETURL
                }
                res.status(200).json({
                    status: true,
                    data: category_details,
                })
            } else {
                res.status(400).json({
                    status: false,
                    data: [],
                    message: 'No category found',
                })
            }
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.viewCategoryDetails = async (req, res, next) => {
    try {
        let { category_id, skip = 0, limit = 10, } = req.body;
        req.body
        if (category_id == undefined) {
            res.status(400).json({
                status: false,
                message: 'All inputs are Required..!'
            })
        } else {
            let category_details = await Category.findOne({ _id: category_id }).populate("main_category", "category_name").exec()
            console.log(category_details);
            if (category_details) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${category_details.image_key}`, //filename
                    Expires: 604800 //time to expire in seconds
                });
                category_details.category_image = presignedThumbnailGETURL
                res.status(200).json({
                    status: true,
                    data: category_details,
                })
            } else {
                res.status(400).json({
                    status: false,
                    message: 'No category found',
                })
            }
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.updateCategoryDetails = async (req, res, next) => {
    try {
        const { category_name, category_id, paid, main_category_id } = req.body
        console.log(req.body)
        let category_details = await Category.findById(category_id)
        if (category_details) {
            let error = false
            if (category_name != undefined) {
                if (category_details.category_name != category_name) {
                    let checkcategoryname = await Category.findOne({
                        category_name: category_name,
                        _id: {
                            $ne: category_id
                        },
                        isdeleted: false
                    })
                    if (checkcategoryname) {
                        res.status(422).json({
                            status: false,
                            message: 'Category name is already in use'
                        })
                        return
                    } else {
                        category_details.category_name = category_name

                    }
                }
            }
            if (req.file) {
                category_details.category_image = req.file.location
                category_details.image_key = req.file.key
            }
            if (paid != undefined) {
                category_details.paid = paid
            }
            if (main_category_id != undefined) {
                category_details.main_category = main_category_id
            }
            if (error) {
                res.status(422).json({
                    status: false,
                    message: "Error while updating category details"
                })
            } else {
                let find_version = await Version.findOne({})
                if (find_version) {
                    await category_details.save()
                    console.log(category_details)
                    find_version.last_updated_category = new Date()
                    await find_version.save()
                    res.status(200).json({
                        status: true,
                        message: 'Category updated successfullyt'
                    })
                } else {
                    res.status(400).json({
                        status: false,
                        message: 'version not found error while updating category'
                    })
                }
            }
        } else {
            res.status(400).json({
                status: false,
                message: 'No Category Found.....',
            })
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.deleteCategory = async (req, res, next) => {
    try {
        if (req.role == 'admin') {
            let { category_id } = req.body
            console.log(req.body)
            if (category_id != undefined) {
                let category = await Category.findById({ _id: category_id, isdeleted: false })
                if (category) {
                    let quote = await Quote.find({ category_id: category_id, isdeleted: false })
                    if (quote && quote.length > 0) {
                        let uncategorized = await Category.findOne({ category_name: 'Uncategorized' })
                        console.log(uncategorized, "uuncaaja")
                        let update_quote = await Quote.updateMany({ category_id: category_id }, {
                            category_id: uncategorized._id
                        })
                        category.isdeleted = true
                        let find_version = await Version.findOne({})
                        if (find_version) {
                            await category.save()
                            find_version.last_updated_category = new Date()

                            await find_version.save()
                            res.status(200).json({
                                status: true,
                                message: 'Category and their all Quotes are deleted Successfully..'
                            })
                        } else {
                            res.status(400).json({
                                status: false,
                                message: 'version not found error while deleting category'
                            })
                        }

                    } else {
                        category.isdeleted = true
                        let find_version = await Version.findOne({})
                        if (find_version) {
                            await category.save()
                            find_version.last_updated_category = new Date()

                            await find_version.save()
                            res.status(200).json({
                                status: true,
                                message: 'Category and their all Quotes are deleted Successfully..'
                            })
                        } else {
                            res.status(400).json({
                                status: false,
                                message: 'version not found error while deleting category'
                            })
                        }
                    }
                } else {
                    res.status(400).json({
                        status: false,
                        message: 'Category not found'
                    })
                }
            } else {
                res.status(422).json({
                    status: false,
                    message: 'Provide Catgeory ID'
                })
            }
        } else {
            res.status(401).json({
                staus: false,
                message: 'Not authorized to access this route'
            })
        }

    } catch (err) {
        next(err)
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: "SomeThing Went Wrong Please try again later.."
        })
    }
}
exports.searchCategory = async (req, res, next) => {
    try {
        let { keyword, skip = 0, limit = 10, } = req.body
        if (keyword == undefined) {
            res.status(400).json({
                status: false,
                message: 'All Inputs are Required..!'
            })
        } else {
            if (keyword == "") {
                let count = await Category.count({ isdeleted: false })
                const category_details = await Category.aggregate(
                    [
                        {
                            $match: {
                                "isdeleted": false
                            },
                        },
                        {
                            $sort: {
                                "createdAt": -1
                            }
                        },
                        {
                            $lookup:
                            {
                                from: 'videos',
                                localField: '_id',
                                foreignField: 'category_id',
                                as: "video_info"
                            },
                        },
                        {
                            $match: {
                                "video_info.isdeleted": false
                            }
                        },
                        {
                            $addFields: { videocount: { $size: "$video_info" } },

                        },
                        {
                            $project: {
                                "video_info": 0
                            }
                        },
                        { $skip: skip * limit },
                        { $limit: limit },
                    ]
                )
                if (category_details && category_details.length > 0) {
                    res.status(200).json({
                        status: true,
                        data: category_details,
                        count: count
                    })
                } else {
                    res.status(400).json({
                        status: false,
                        message: 'No category found',
                    })
                }
            } else {
                let count = await Category.count({ $or: [{ category_name: { $regex: keyword, $options: 'i' }, isdeleted: false }, { description: { $regex: keyword, $options: 'i' }, isdeleted: false }] })
                const searched_category = await Category.find({
                    $or: [
                        { category_name: { $regex: keyword, $options: 'i' }, isdeleted: false }, { description: { $regex: keyword, $options: 'i' }, isdeleted: false }
                    ]
                }).skip(skip * limit).limit(limit).exec()
                if (searched_category && searched_category.length > 0) {
                    res.status(200).json({
                        status: true,
                        searched_count: count,
                        data: searched_category,
                    })
                } else {
                    res.status(400).json({
                        status: false,
                        data: [],
                        message: 'No category found'
                    })
                }
            }
        }

    } catch (err) {
        next(err)
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: "Something went wrong please try again later"
        })
    }
}
exports.viewAllCategoriesName = async (req, res, next) => {
    try {
        if (req.role == 'admin') {
            const category_details = await Category.aggregate(
                [
                    {
                        $match: {
                            "isdeleted": false
                        },
                    },
                    {
                        $sort: {
                            "createdAt": -1
                        }
                    },
                    {
                        $project: {
                            // "_id": 0,
                            "description": 0,
                            "category_image": 0,
                            "isdeleted": 0,
                            "createdAt": 0,
                            "updatedAt": 0,
                            "image_key": 0,
                            "__v": 0,
                        }
                    },
                ]
            )
            if (category_details && category_details.length > 0) {
                res.status(200).json({
                    status: true,
                    data: category_details,
                })
            } else {
                res.status(400).json({
                    status: false,
                    message: 'No category found',
                })
            }
        } else {
            res.status(401).json({
                staus: false,
                message: 'Not authorized to access this route'
            })
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.categoryFilters = async (req, res, next) => {
    console.log('aaaaaaa', req.body);
    try {
        const { category_name, sort, skip = 0, limit = 10 } = req.body
        if (category_name == undefined || sort == undefined) {
            res.status(400).json({
                status: false,
                message: 'All Inputs are Required..!'
            })
        } else {
            if (category_name == "") {
                let count = await Category.count({ isdeleted: false })
                const category_details = await Category.aggregate(
                    [
                        { $match: {  category_name: {$nin: ["General","Uncategorized"]}  ,"isdeleted": false  }},
                        { $sort: { "createdAt": -1 } },
                        {
                            $lookup:
                            {
                                from: 'main_categories',
                                localField: 'main_category',
                                foreignField: '_id',
                                as: "main_category"
                            },
                        },
                        { $skip: skip * limit },
                        { $limit: limit },
                    ]
                ).sort(sort)
                if (category_details && category_details.length > 0) {
                    let quote
                    for (i = 0; i < category_details.length; i++) {
                        var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                            Bucket: process.env.bucket,
                            Key: `${category_details[i].image_key}`, //filename
                            Expires: 604800 //time to expire in seconds
                        });
                        let quote_count = await Quote.count({ category_id: category_details[i]?._id, isdeleted: false })
                        category_details[i].quote_count = quote_count
                        category_details[i].category_image = presignedThumbnailGETURL
                    }
                    res.status(200).json({
                        status: true,
                        data: category_details,
                        count: count
                    })
                    return
                } else {
                    res.status(400).json({
                        status: false,
                        data: [],
                        message: 'No category found',
                    })
                    return
                }
            }
            if (category_name) {
                let count = await Category.count({ category_name: { $regex: category_name, $options: 'i' }, isdeleted: false })
                const searched_category = await Category.find({ category_name: { $regex: category_name, $options: 'i' }, isdeleted: false }).populate("main_category", "category_name").skip(skip * limit).limit(limit).sort(sort).exec()
                if (searched_category && searched_category.length > 0) {
                    let quote
                    for (i = 0; i < searched_category.length; i++) {
                        let quote_count = await Quote.count({ category_id: searched_category[i]._id, isdeleted: false })
                        var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                            Bucket: process.env.bucket,
                            Key: `${searched_category[i].image_key}`, //filename
                            Expires: 604800 //time to expire in seconds
                        });
                        searched_category[i].quote_count = quote_count
                        searched_category[i].category_image = presignedThumbnailGETURL
                        quote = quote_count
                    }
                    res.status(200).json({
                        status: true,
                        count: count,
                        quote_count: quote,
                        data: searched_category,
                    })
                    return
                } else {
                    res.status(400).json({
                        status: false,
                        data: [],
                        message: 'No category found'
                    })
                    return
                }
            }
        }
    } catch (err) {
        next(err)
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: "Something went wrong please try again later"
        })
    }
}
exports.searchCategoryByYear = async (req, res, next) => {
    try {
        let { year, skip = 0, limit = 10, } = req.body
        var start = new Date(Number(year), 11, 31);
        let end = new Date(Number(year), 00, 02);;
        start.setFullYear(start.getFullYear() - 1)
        end.setFullYear(end.getFullYear() + 1)
        if (year == undefined) {
            res.status(400).json({
                status: false,
                message: 'All Inputs are Required..!'
            })
        } else {
            // let count = await Category.count({ $or: [{ category_name: { $regex: year, $options: 'i' }, isdeleted: false }, { description: { $regex: year, $options: 'i' }, isdeleted: false }] })
            const searched_category = await Category.find({ createdAt: { $gt: start, $lt: end }, isdeleted: false }).skip(skip * limit).limit(limit).exec()
            if (searched_category && searched_category.length > 0) {
                // let category_array = []
                // for (let i = 0; i < searched_category.length; i++) {
                //     if (searched_category[i].createdAt.getFullYear() == year) {
                //         category_array.push(searched_category[i])
                //     }

                // }
                res.status(200).json({
                    status: true,
                    // searched_count: count,
                    data: searched_category,
                })
            } else {
                res.status(400).json({
                    status: false,
                    data: [],
                    message: 'No category found'
                })
            }
        }

    } catch (err) {
        next(err)
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: "Something went wrong please try again later"
        })
    }
}
exports.deleteCategoryandVideos = async (req, res, next) => {
    try {
        if (req.role == 'admin') {
            let { category_id } = req.body
            if (category_id != undefined) {
                let category = await Category.findById(category_id)
                if (category) {
                    let video = await Video.find({ category_id: category_id })
                    if (video && video.length > 0) {
                        let uncategorized = await Category.findOne({ category_name: 'Uncategorized' })
                        let update_videos = await Video.updateMany({ category_id: category_id }, {
                            category_id: uncategorized._id
                        })
                        if (update_videos && update_videos.length > 0) {
                            category.isdeleted = true
                            await category.save()
                            res.status(200).json({
                                status: true,
                                message: 'Category and their all videos are Deleted Successfully..'
                            })
                        } else {
                            res.status(400).json({
                                status: false,
                                message: 'Something went wrong while deleting category'
                            })
                        }

                    } else {
                        category.isdeleted = true
                        await category.save()
                        res.status(200).json({
                            status: true,
                            message: 'Category and their all videos are Deleted Successfully..'
                        })
                    }
                } else {
                    res.status(400).json({
                        status: false,
                        message: 'Category not found'
                    })
                }
            } else {
                res.status(422).json({
                    status: false,
                    message: 'Provide Catgeory ID'
                })
            }
        } else {
            res.status(401).json({
                staus: false,
                message: 'Not authorized to access this route'
            })
        }

    } catch (err) {
        next(err)
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: "SomeThing Went Wrong Please try again later.."
        })
    }
}
exports.viewAllCategoriesNames = async (req, res, next) => {
    try {
        let category_array = []
        const positive_category = await Category.aggregate(
            [
                {
                    $match: { category_name: "Positive", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (positive_category && positive_category.length > 0) {
            for (let i = 0; i < positive_category.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${positive_category[i].image_key}`,
                    Expires: 604800
                });

                positive_category[i].category_image = presignedThumbnailGETURL
                category_array.push(positive_category[i])
            }
        }
        const aff_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Affirmations", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (aff_details && aff_details.length > 0) {
            for (let i = 0; i < aff_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${aff_details[i].image_key}`,
                    Expires: 604800
                });

                aff_details[i].category_image = presignedThumbnailGETURL
                category_array.push(aff_details[i])
            }
        }
        const self_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Self improvement", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (self_details && self_details.length > 0) {
            for (let i = 0; i < self_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${self_details[i].image_key}`,
                    Expires: 604800
                });

                self_details[i].category_image = presignedThumbnailGETURL
                category_array.push(self_details[i])
            }
        }
        const love_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Love", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (love_details && love_details.length > 0) {
            for (let i = 0; i < love_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${love_details[i].image_key}`,
                    Expires: 604800
                });

                love_details[i].category_image = presignedThumbnailGETURL
                category_array.push(love_details[i])
            }
        }
        const personal_detail = await Category.aggregate(
            [
                {
                    $match: { category_name: "Personal growth", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (personal_detail && personal_detail.length > 0) {
            for (let i = 0; i < personal_detail.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${personal_detail[i].image_key}`,
                    Expires: 604800
                });

                personal_detail[i].category_image = presignedThumbnailGETURL
                category_array.push(personal_detail[i])
            }
        }
        const wrok_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Work & Finance", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (wrok_details && wrok_details.length > 0) {
            for (let i = 0; i < wrok_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${wrok_details[i].image_key}`,
                    Expires: 604800
                });

                wrok_details[i].category_image = presignedThumbnailGETURL
                category_array.push(wrok_details[i])
            }
        }
        const christen_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Christian Faith", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (christen_details && christen_details.length > 0) {
            for (let i = 0; i < christen_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${christen_details[i].image_key}`,
                    Expires: 604800
                });

                christen_details[i].category_image = presignedThumbnailGETURL
                category_array.push(christen_details[i])
            }
        }
        const effort_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Effort", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (effort_details && effort_details.length > 0) {
            for (let i = 0; i < effort_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${effort_details[i].image_key}`,
                    Expires: 604800
                });

                effort_details[i].category_image = presignedThumbnailGETURL
                category_array.push(effort_details[i])
            }
        }
        const relation_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Relationships", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (relation_details && relation_details.length > 0) {
            for (let i = 0; i < relation_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${relation_details[i].image_key}`,
                    Expires: 604800
                });

                relation_details[i].category_image = presignedThumbnailGETURL
                category_array.push(relation_details[i])
            }
        }
        const self_love_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Self love", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (self_love_details && self_love_details.length > 0) {
            for (let i = 0; i < self_love_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${self_love_details[i].image_key}`,
                    Expires: 604800
                });

                self_love_details[i].category_image = presignedThumbnailGETURL
                category_array.push(self_love_details[i])
            }
        }
        const inspirationl_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Inspirational", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (inspirationl_details && inspirationl_details.length > 0) {
            for (let i = 0; i < inspirationl_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${inspirationl_details[i].image_key}`,
                    Expires: 604800
                });

                inspirationl_details[i].category_image = presignedThumbnailGETURL
                category_array.push(inspirationl_details[i])
            }
        }
        const health_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Health & Fitness", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (health_details && health_details.length > 0) {
            for (let i = 0; i < health_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${health_details[i].image_key}`,
                    Expires: 604800
                });

                health_details[i].category_image = presignedThumbnailGETURL
                category_array.push(health_details[i])
            }
        }
        const adversity_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Adversity", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (adversity_details && adversity_details.length > 0) {
            for (let i = 0; i < adversity_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${adversity_details[i].image_key}`,
                    Expires: 604800
                });

                adversity_details[i].category_image = presignedThumbnailGETURL
                category_array.push(adversity_details[i])
            }
        }
        const family_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Family & Friends", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (family_details && family_details.length > 0) {
            for (let i = 0; i < family_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${family_details[i].image_key}`,
                    Expires: 604800
                });

                family_details[i].category_image = presignedThumbnailGETURL
                category_array.push(family_details[i])
            }
        }
        const self_esteem = await Category.aggregate(
            [
                {
                    $match: { category_name: "Self esteem", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (self_esteem && self_esteem.length > 0) {
            for (let i = 0; i < self_esteem.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${self_esteem[i].image_key}`,
                    Expires: 604800
                });

                self_esteem[i].category_image = presignedThumbnailGETURL
                category_array.push(self_esteem[i])
            }
        }
        const heart_details = await Category.aggregate(
            [
                {
                    $match: { category_name: "Heart break", isdeleted: false }
                },
                {
                    $sort: {
                        "createdAt": -1
                    }
                },
                {
                    $project: {
                        // "_id": 0,
                        // "category_image": 0,
                        "isdeleted": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        // "image_key": 0,
                        "__v": 0,
                    }
                },
            ]
        )
        if (heart_details && heart_details.length > 0) {
            for (let i = 0; i < heart_details.length; i++) {
                var presignedThumbnailGETURL = s3.getSignedUrl('getObject', {
                    Bucket: process.env.bucket,
                    Key: `${heart_details[i].image_key}`,
                    Expires: 604800
                });

                heart_details[i].category_image = presignedThumbnailGETURL
                category_array.push(heart_details[i])
            }
        }
        res.status(200).json({
            status: true,
            data: category_array,
        })
        // } else {
        //     res.status(400).json({
        //         status: false,
        //         message: 'No category found',
        //     })
        // }

    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.updateManyCategories = async (req, res, next) => {
    try {
        paid_false = true
        let updateCategory = await Category.updateMany({}, {
            paid: paid_false
        })
        res.status(200).json({
            status: false,
            updateCategory
        })
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.createVersion = async (req, res, next) => {
    try {
        let create_version = await Version.create({
            last_updated_category: new Date(),
            last_updated_theme: new Date()
        })
        if (create_version) {
            res.status(200).json({
                status: false,
                message: 'created'
            })
        } else {
            res.status(400).json({
                status: false,
                message: 'something is wrong while created'
            })
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};
exports.checkingIfCategoryOrThemeUpdated = async (req, res, next) => {
    try {
        let { new_date } = req.body
        let updated_date = new Date(new_date)
        let catgeory_updated = false
        let theme_updated = false
        let find_version = await Version.find()
        if (find_version && find_version.length > 0) {
            if (updated_date > find_version[0].last_updated_category) {
                catgeory_updated = true
            }
            if (updated_date > find_version[0].last_updated_theme) {
                theme_updated = true
            }
            res.status(200).json({
                status: true,
                message: 'result found',
                isCatgeoryUpdated: catgeory_updated,
                isThemeUpdated: theme_updated,
            })
        } else {
            res.status(400).json({
                status: false,
                message: 'something is wrong while fatching data'
            })
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({
            status: false,
            message: 'SomeThing Went Wrong Please Try Again Later..'
        })
    }
};