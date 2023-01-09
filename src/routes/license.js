var express = require("express");
var router = express.Router();

let LicenseController = require('../controllers/license')

 router.post("/create", LicenseController.createLicenses);
router.get("/", LicenseController.viewAllLicenses);
router.get("/:id", LicenseController.detailLicense);
router.post("/use", LicenseController.useLicense);
router.get("/licenses-available", LicenseController.useLicense);
router.post("/create-licenses", LicenseController.createLicensesUpdated);

module.exports = router;