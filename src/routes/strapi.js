let express = require("express");
const { strapiData, strapiDataMobile, strapiDataMobilePromise } = require("../controllers/strapi");
let router = express.Router();

router.post('/', strapiData);
router.get('/mobile/:language', strapiDataMobilePromise);
router.get('/mobile-all/:language', strapiDataMobilePromise);


module.exports = router;