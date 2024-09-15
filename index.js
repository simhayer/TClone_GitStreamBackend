const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const {createServer} = require('http');
const connectDB = require('./models/db');

const app = express();
app.use(express.json());
app.use('/api/auth', require('./routes/user'));
app.use('/', express.static(path.join(__dirname, 'static')));

const httpServer = createServer(app);
let port = process.env.PORT || 3000;

const io = socketIO(httpServer);

httpServer.listen(port);
console.log(`Server started on port ${port}`);

// Handling Error
process.on('unhandledRejection', err => {
  console.log(`An error occurred: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

// Endpoint to get profile pictures
app.get('/profilePicture/:filename', (req, res) => {
  console.log('Profile picture requested', req.params.filename);
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  console.log(filePath);
  res.sendFile(filePath);
});

app.get('/thumbnail/:filename', (req, res) => {
  console.log('Thumbnail requested', req.params.filename);
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads/thumbnails', filename);
  console.log(filePath);
  res.sendFile(filePath);
});

app.get('/products/:filename', (req, res) => {
  console.log('Thumbnail requested', req.params.filename);
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads/products', filename);
  console.log(filePath);
  res.sendFile(filePath);
});

require('./Socket/socketEvent')(io);
require('./Socket/socketFunction').init(io);
connectDB();
