const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("customer", "provider"));

router.get("/contacts", chatController.listContacts);
router.get("/conversations", chatController.listConversations);
router.post("/conversations", chatController.startConversation);
router.get("/conversations/:id/messages", chatController.getMessages);
router.post("/conversations/:id/messages", chatController.sendMessage);

module.exports = router;
