const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.listContacts = async (req, res) => {
  try {
    const wanted = req.user.role === "customer" ? "provider" : "customer";
    const contacts = await User.find({ role: wanted })
      .select("name email role")
      .sort({ name: 1 });
    return res.json({ contacts });
  } catch (err) {
    console.error("List contacts error:", err);
    return res.status(500).json({ message: "Failed to load contacts." });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (userId === req.user.id) {
      return res.status(400).json({ message: "You cannot chat with yourself." });
    }

    const other = await User.findById(userId);
    if (!other) return res.status(404).json({ message: "User not found." });

    const pair = [req.user.role, other.role].sort().join("-");
    if (pair !== "customer-provider") {
      return res
        .status(403)
        .json({ message: "Chat is only available between a customer and a provider." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId],
      });
    }

    return res.status(201).json({ conversationId: conversation._id });
  } catch (err) {
    console.error("Start conversation error:", err);
    return res.status(500).json({ message: "Failed to start conversation." });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name role");

    const result = await Promise.all(
      conversations.map(async (c) => {
        const other = c.participants.find(
          (p) => p._id.toString() !== req.user.id
        );
        const unread = await Message.countDocuments({
          conversation: c._id,
          sender: { $ne: req.user.id },
          isRead: false,
        });
        return {
          id: c._id,
          name: other ? other.name : "Unknown user",
          role: other ? other.role : "",
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          unread,
        };
      })
    );

    return res.json({ conversations: result });
  } catch (err) {
    console.error("List conversations error:", err);
    return res.status(500).json({ message: "Failed to load conversations." });
  }
};

const loadOwnConversation = async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ message: "Invalid conversation id." });
    return null;
  }
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return null;
  }
  const isMember = conversation.participants.some(
    (p) => p.toString() === req.user.id
  );
  if (!isMember) {
    res.status(403).json({ message: "You are not part of this conversation." });
    return null;
  }
  return conversation;
};

exports.getMessages = async (req, res) => {
  try {
    const conversation = await loadOwnConversation(req, res);
    if (!conversation) return;

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .populate("sender", "name role");

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user.id },
        isRead: false,
      },
      { isRead: true }
    );

    return res.json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ message: "Failed to load messages." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const conversation = await loadOwnConversation(req, res);
    if (!conversation) return;

    const content = (req.body.content || "").trim();
    if (!content) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: "Message is too long." });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      content,
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populated = await message.populate("sender", "name role");
    return res.status(201).json({ message: populated });
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({ message: "Failed to send message." });
  }
};
