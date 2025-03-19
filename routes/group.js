const express = require('express');
const Group = require('../models/group');
const GroupMessage = require('../models/groupMessage');
const router = express.Router();

// Create Group
router.post('/create-group', async (req, res) => {
  try {
    const { groupName, memberIds } = req.body;
    const group = new Group({
      name: groupName,
      members: memberIds
    });
    await group.save();
    res.status(201).json({ message: 'Group created successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error });
  }
});

// Send Message to Group
router.post('/send-group-message', async (req, res) => {
  try {
    const { groupId, senderId, message } = req.body;
    const groupMessage = new GroupMessage({
      groupId,
      sender: senderId,
      message
    });
    await groupMessage.save();
    res.status(201).json({ message: 'Message sent successfully', groupMessage });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});

// Get Messages for Group
router.get('/group-messages/:groupId', async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId }).populate('sender', 'name');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving messages', error });
  }
});

module.exports = router;
