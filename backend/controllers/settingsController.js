const PlatformSettings = require("../models/PlatformSettings");

// @desc  Get platform settings (currently just the configurable partial-refund %)
// @route GET /api/settings/refund
// @access Private (admin)
exports.getRefundSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    return res.status(200).json({ partialRefundPercent: settings.partialRefundPercent });
  } catch (err) {
    console.error("getRefundSettings error:", err);
    return res.status(500).json({ message: "Server error while fetching settings." });
  }
};

// @desc  Update the configurable partial-refund percentage (FR-20.2)
// @route PUT /api/settings/refund
// @access Private (admin)
exports.updateRefundSettings = async (req, res) => {
  try {
    const { partialRefundPercent } = req.body;
    const value = Number(partialRefundPercent);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return res.status(400).json({ message: "partialRefundPercent must be a number between 0 and 100." });
    }
    const settings = await PlatformSettings.getSettings();
    settings.partialRefundPercent = value;
    await settings.save();
    return res.status(200).json({ message: "Refund settings updated.", partialRefundPercent: settings.partialRefundPercent });
  } catch (err) {
    console.error("updateRefundSettings error:", err);
    return res.status(500).json({ message: "Server error while updating settings." });
  }
};
