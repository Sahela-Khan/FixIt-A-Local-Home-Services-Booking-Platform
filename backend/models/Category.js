const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1, name: 1 });

categorySchema.statics.escapeName = function (value) {
  return String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

categorySchema.statics.findByNameInsensitive = function (name, excludeId) {
  const pattern = new RegExp("^" + this.escapeName(name) + "$", "i");
  const query = { name: pattern };
  if (excludeId) query._id = { $ne: excludeId };
  return this.findOne(query);
};

categorySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Category", categorySchema);
