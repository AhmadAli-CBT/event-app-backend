var express = require("express");
var router = express.Router();

let Packages = require('../controllers/pacakges')

// router.get("/create-licenses", LicenseController.createLicenses);
router.get("/", Packages.get);
router.post("/", Packages.create);
router.post("/:id", Packages.delete);
router.post("/edit/:id", Packages.update);
router.get('/licences-by-pkg-id/:package_id',Packages.licensesByPackageID)


module.exports = router;