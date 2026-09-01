const mongoose = require("mongoose");

// Singleton document holding platform-wide, admin-configurable values.
// FR-20.2 — the partial refund percentage used when a customer cancels
// after provider acceptance but 24+ hours before the scheduled job.
const platformSettingsSchema = new mongoose.Schema(
  {
    // Fixed key so there is always exactly one settings document.
    key: { type: String, default: "global", unique: true },
    partialRefundPercent: { type: Number, default: 50, min: 0, max: 100 },
  },
  { timestamps: true }
);

platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "global" });
  if (!settings) {
    settings = await this.create({ key: "global" });
  }
  return settings;
};

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
