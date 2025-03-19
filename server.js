// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user_management';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// User schema and model
const userSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

// Message schema and model
const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  room: String, // room can be a public chat room or a specific group
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Group schema and model
const groupSchema = new mongoose.Schema({
  groupName: { type: String, unique: true },
  createdBy: String, // creator's name
  createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.model('Group', groupSchema);

// Signup route
app.post('/api/signup', async (req, res) => {
  const { fName, lName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fName, lName, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Signup successful', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Signin route
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        // Save the user's first name in the response to be stored on the client-side
        return res.status(200).json({ message: 'Signin successful', name: user.fName });
      } else {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to create a new group
app.post('/api/groups/create', async (req, res) => {
  const { groupName, createdBy } = req.body;

  try {
    const existingGroup = await Group.findOne({ groupName });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group already exists' });
    }

    const newGroup = new Group({ groupName, createdBy });
    await newGroup.save();

    // Emit the new group to all connected clients
    io.emit('newGroupCreated', newGroup);
    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Chat functionality
io.on('connection', async (socket) => {
  console.log('New user connected');

  // Send all groups to the user when they join
  const groups = await Group.find({});
  socket.emit('allGroups', groups);

  // Handle user joining a room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);

    // Send all previous messages from the room to the user who just joined
    Message.find({ room }).sort({ createdAt: 1 }).then(messages => {
      socket.emit('previousMessages', messages);
    });
  });

  // Handle chat message
  socket.on('chatMessage', (msg) => {
    const newMessage = new Message(msg);

    // Save the message to MongoDB
    newMessage.save().then(() => {
      // Emit the message to all users in the room, including the sender
      io.to(msg.room).emit('chatMessage', newMessage);
    }).catch(err => {
      console.error('Error saving message:', err);
    });
  });

  // Handle group creation event
  socket.on('createGroup', async (groupName) => {
    try {
      const existingGroup = await Group.findOne({ groupName });
      if (existingGroup) {
        socket.emit('groupExists', { message: 'Group already exists' });
      } else {
        const newGroup = new Group({ groupName, createdBy: socket.id });
        await newGroup.save();

        // Emit the new group to all users
        io.emit('newGroupCreated', { group: newGroup });
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
