const express = require("express");
const path = require("path");
const socketIO = require("socket.io");
const { createServer } = require("http");
const connectDB = require("./models/db");
const fileRoutes = require("./routes/fileRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", require("./routes/user"));
app.use("/", express.static(path.join(__dirname, "static")));

app.use(fileRoutes);

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

app.get("/returnURL", (req, res) => {
  res.sendFile(path.join(__dirname, "Screens", "ReturnToBars.html"));
});

require("./Socket/socketEvent")(io);
require("./Socket/socketFunction").init(io);
//connectDB();

connectDB().catch(console.error);
