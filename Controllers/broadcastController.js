const broadcastService = require("../Services/broadcastServices");
const { broadcasters } = require("../Data/data");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/thumbnails"); // Set the destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set the file name
  },
});

const upload = multer({ storage: storage });

async function add(req, res) {
  try {
    console.log("in Broadcast");

    // Use multer to handle the file upload
    upload.single("thumbnail")(req, res, async function (err) {
      if (err) {
        return res
          .status(400)
          .json({ message: "File upload failed", error: err.message });
      }

      const { body } = req;
      let thumbnailFilename = null;

      if (req.file) {
        thumbnailFilename = req.file.filename; // Get the filename of the uploaded thumbnail
      }

      // Call the addBroadcast function and pass the filename
      var id = await broadcastService.addBroadcast(
        body.socket_id,
        body.sdp,
        body.username,
        body.profilePicture,
        body.title,
        thumbnailFilename, // Pass the filename to addBroadcast
        body.meetingId
      );

      var data = {
        message: "failed",
        data: {},
      };

      if (id != null) {
        data = {
          message: "success",
          data: {
            id: id,
          },
        };
      }

      res.json(data);
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function fetch(req, res) {
  try {
    var data = await broadcastService.fetch();
    res.json(data);
  } catch (error) {
    console.error("An error occurred during fetch", error);
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
}

module.exports = {
  add,
  fetch,
};
