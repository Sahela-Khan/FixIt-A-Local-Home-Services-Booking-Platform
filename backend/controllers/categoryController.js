const mongoose = require("mongoose");
const Category = require("../models/Category");
const Service = require("../models/Service");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const countServices = async (name) => {
  const pattern = new RegExp("^" + Category.escapeName(name) + "$", "i");
  return Service.countDocuments({ category: pattern });
};

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 })
      .populate("createdBy", "name email");

    const usage = await Service.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const usageMap = new Map(
      usage.map((u) => [String(u._id || "").toLowerCase(), u.count])
    );

    const withCounts = categories.map((c) => ({
      ...c.toJSON(),
      serviceCount: usageMap.get(c.name.toLowerCase()) || 0,
    }));

    const managed = new Set(categories.map((c) => c.name.toLowerCase()));
    const unregistered = usage
      .filter((u) => u._id && !managed.has(String(u._id).toLowerCase()))
      .map((u) => ({ name: u._id, serviceCount: u.count }))
      .sort((a, b) => b.serviceCount - a.serviceCount);

    return res.json({ categories: withCounts, unregistered });
  } catch (err) {
    console.error("List categories error:", err);
    return res.status(500).json({ message: "Failed to load categories." });
  }
};

exports.listActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select("name description");
    return res.json({ categories });
  } catch (err) {
    console.error("List active categories error:", err);
    return res.status(500).json({ message: "Failed to load categories." });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "A category name is required." });
    }
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 40) {
      return res
        .status(400)
        .json({ message: "Category name must be between 2 and 40 characters." });
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9 &/-]*$/.test(clean)) {
      return res.status(400).json({
        message: "Use only letters, numbers, spaces and the symbols & / -",
      });
    }

    const existing = await Category.findByNameInsensitive(clean);
    if (existing) {
      return res
        .status(409)
        .json({ message: `A category named ${existing.name} already exists.` });
    }

    const category = await Category.create({
      name: clean,
      description: typeof description === "string" ? description.trim() : "",
      createdBy: req.user.id,
    });

    const serviceCount = await countServices(clean);
    return res.status(201).json({ category: { ...category.toJSON(), serviceCount } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "That category already exists." });
    }
    if (err.name === "ValidationError") {
      const first = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: first });
    }
    console.error("Create category error:", err);
    return res.status(500).json({ message: "Failed to create the category." });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category id." });
    }
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    const { name, description, isActive } = req.body;
    const previousName = category.name;
    let renamed = 0;

    if (typeof name === "string" && name.trim() && name.trim() !== previousName) {
      const clean = name.trim();
      if (clean.length < 2 || clean.length > 40) {
        return res
          .status(400)
          .json({ message: "Category name must be between 2 and 40 characters." });
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9 &/-]*$/.test(clean)) {
        return res.status(400).json({
          message: "Use only letters, numbers, spaces and the symbols & / -",
        });
      }
      const clash = await Category.findByNameInsensitive(clean, category._id);
      if (clash) {
        return res
          .status(409)
          .json({ message: `A category named ${clash.name} already exists.` });
      }
      category.name = clean;
    }

    if (typeof description === "string") category.description = description.trim();
    if (typeof isActive === "boolean") category.isActive = isActive;

    await category.save();

    if (category.name !== previousName) {
      const pattern = new RegExp("^" + Category.escapeName(previousName) + "$", "i");
      const result = await Service.updateMany(
        { category: pattern },
        { $set: { category: category.name } }
      );
      renamed = result.modifiedCount || 0;
    }

    const serviceCount = await countServices(category.name);
    return res.json({
      category: { ...category.toJSON(), serviceCount },
      renamedServices: renamed,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "That category already exists." });
    }
    console.error("Update category error:", err);
    return res.status(500).json({ message: "Failed to update the category." });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid category id." });
    }
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    const inUse = await countServices(category.name);

    if (inUse > 0) {
      const { reassignTo } = req.body || {};
      if (!reassignTo) {
        return res.status(409).json({
          message: `${inUse} service(s) still use ${category.name}. Choose another category to move them to first.`,
          serviceCount: inUse,
        });
      }
      if (!isValidId(reassignTo)) {
        return res.status(400).json({ message: "Invalid replacement category." });
      }
      const target = await Category.findById(reassignTo);
      if (!target || target._id.toString() === category._id.toString()) {
        return res
          .status(400)
          .json({ message: "Choose a different existing category." });
      }
      const pattern = new RegExp("^" + Category.escapeName(category.name) + "$", "i");
      await Service.updateMany(
        { category: pattern },
        { $set: { category: target.name } }
      );
    }

    await category.deleteOne();
    return res.json({
      message: `Category ${category.name} removed.`,
      id: req.params.id,
      movedServices: inUse,
    });
  } catch (err) {
    console.error("Delete category error:", err);
    return res.status(500).json({ message: "Failed to remove the category." });
  }
};

exports.importUnregistered = async (req, res) => {
  try {
    const usage = await Service.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const categories = await Category.find().select("name");
    const managed = new Set(categories.map((c) => c.name.toLowerCase()));

    const toCreate = usage
      .filter((u) => u._id && String(u._id).trim() && !managed.has(String(u._id).toLowerCase()))
      .map((u) => ({
        name: String(u._id).trim().slice(0, 40),
        description: "",
        createdBy: req.user.id,
      }));

    if (toCreate.length === 0) {
      return res.json({ created: 0, categories: [] });
    }

    const created = await Category.insertMany(toCreate, { ordered: false });
    return res.status(201).json({ created: created.length, categories: created });
  } catch (err) {
    console.error("Import categories error:", err);
    return res.status(500).json({ message: "Failed to import existing categories." });
  }
};
