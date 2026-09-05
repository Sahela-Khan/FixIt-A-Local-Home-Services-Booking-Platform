const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { auth, role } = require("../middleware/auth");

router.use(auth);

router.get(
  "/active",
  role("customer", "provider", "admin"),
  categoryController.listActiveCategories
);

router.get("/", role("admin"), categoryController.listCategories);
router.post("/", role("admin"), categoryController.createCategory);
router.post("/import", role("admin"), categoryController.importUnregistered);
router.put("/:id", role("admin"), categoryController.updateCategory);
router.delete("/:id", role("admin"), categoryController.deleteCategory);

module.exports = router;
