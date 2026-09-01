const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("customer"));

router.get("/", serviceController.listServices);
router.get("/locations", serviceController.listLocations);
router.get("/saved-providers", serviceController.getSavedProviders);
router.put("/saved-providers/:providerId", serviceController.toggleSavedProvider);

module.exports = router;