const License = require("../models/License");
const catchAsync = require("../utils/catchAsync");

exports.createLicenses = catchAsync(async (req, res) => {
  try {
    let { count, packageId } = req.body;
    let licenses = await makeLicense(count);
    let saveLicence;
    console.log(licenses);
    for (i = 0; i < licenses.length; i++) {
      saveLicence = await License.create({
        license_number: licenses[i],
        packageId
      });
    };
    res.status(200).json({
      status: 1,
      saveLicence,
      message: "Data saved successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      status: false,
      message: "something went wrong please try again later"
    })
  }
});
exports.viewAllLicenses = catchAsync(async (req, res) => {
  let data = await License.find({ is_used: false });
  res.status(200).json({
    status: 1,
    data,
    message: "Data fetched successfully",
  });
});
exports.detailLicense = catchAsync(async (req, res) => {
  let data = await License.find({ license_number: req.params.id }).populate(
    "packageId"
  );
  console.log(data);
  res.status(200).json({
    status: 1,
    data,
    message: "Data fetched successfully",
  });
});
exports.useLicense = catchAsync(async (req, res) => {
  let { license_id } = req.body;
  console.log(license_id);
  let license = await License.findById(license_id);
  console.log(license);
  if (license && license.is_used) {
    res.status(200).json({
      status: 0,
      message: "License expired",
      data: null,
    });
  } else {
    license.is_used = true;
    await license.save();
    res.status(200).json({
      status: 1,
      message: "License used successfull",
      data: license,
    });
  }
});
exports.remainingLicensesCount = catchAsync(async (req, res) => {
  let { license_id } = req.body;
  let licensesAvailable = await License.find({ is_used: false }).count();
  res.status(200).json({
    status: 1,
    message: "License used successfull",
    data: licensesAvailable,
  });
});
exports.createLicensesUpdated = catchAsync(async (req, res, next) => {
  try {
    let { count, package } = req.body;
    let licenses = await makeLicense(count);
    let saveLicence = [];
    console.log(licenses);
    for (i = 0; i < licenses.length; i++) {
      saveLicence.push(await License.create({
        license_number: licenses[i],
        packageId:package
      }));
    };
    res.status(200).json({
      status: 1,
      saveLicence,
      message: "Data saved successfully",
    });
  } catch (err) {
    next(err);
    res.status(500).json({
      status: 0,
      message: "Something went wrong please try again",
    });
  }
});
let makeLicense = async (count) => {
  let licenses = [];
  for (let i = 0; i < count; i++) {
    let license = await getRandomLicense()
    console.log(license, '----------------------------')
    licenses.push(license)
  }
  return licenses;
};
let getRandomLicense = async () => {
  var val1 = Math.floor(1000 + Math.random() * 9000);
  var val2 = Math.floor(1000 + Math.random() * 9000);
  let license = `${val1}-${val2}`;
  console.log(license)
  if (await License.findOne({ license_number: license })) {
    await getRandomLicense();
  } else {
    return license;
  }
};
let makeid = async (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
