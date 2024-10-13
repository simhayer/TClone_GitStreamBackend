const express = require("express");
const path = require("path");
const socketIO = require("socket.io");
const { createServer } = require("http");
const connectDB = require("./models/db");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use("/api/auth", require("./routes/user"));
app.use("/", express.static(path.join(__dirname, "static")));

const httpServer = createServer(app);
let port = process.env.PORT || 3000;

const io = socketIO(httpServer);

httpServer.listen(port);
console.log(`Server started on port ${port}`);

// Handling Error
process.on("unhandledRejection", (err) => {
  console.log(`An unhandled rejection occurred: ${err.message}`);
  // Log the error but don't shut down the server
});

process.on("uncaughtException", (err) => {
  console.log(`An uncaught exception occurred: ${err.message}`);
  // Log the error but don't shut down the server
  // Optionally: httpServer.close(() => process.exit(1));
});

app.get("/profilePicture/:filename", (req, res) => {
  try {
    console.log("Profile picture requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "uploads", filename);

    // Check if the file exists synchronously
    if (!fs.existsSync(filePath)) {
      console.error(`Profile picture not found: ${filePath}`);
      return res.status(404).send("Profile picture not found");
    }

    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending profile picture: ${err.message}`);
        res.status(500).send("Error sending profile picture");
      }
    });
  } catch (err) {
    // Handle any unexpected errors
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

// Route for serving thumbnails
app.get("/thumbnail/:filename", (req, res) => {
  try {
    console.log("Thumbnail requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "uploads/thumbnails", filename);

    // Check if the file exists synchronously
    if (!fs.existsSync(filePath)) {
      console.error(`Thumbnail not found: ${filePath}`);
      return res.status(404).send("Thumbnail not found");
    }

    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending thumbnail: ${err.message}`);
        res.status(500).send("Error sending thumbnail");
      }
    });
  } catch (err) {
    // Handle any unexpected errors
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

app.get("/products/:filename", (req, res) => {
  try {
    console.log("Thumbnail requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "uploads/products", filename);

    // Check if the file exists synchronously
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).send("File not found");
    }

    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        res.status(500).send("Error sending file");
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

app.get("/returnURL", (req, res) => {
  res.sendFile(path.join(__dirname, "Screens", "ReturnToBars.html"));
});

require("./Socket/socketEvent")(io);
require("./Socket/socketFunction").init(io);
//connectDB();

connectDB().catch(console.error);
