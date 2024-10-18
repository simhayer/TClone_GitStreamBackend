const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Route to serve profile pictures
router.get("/profilePicture/:filename", (req, res) => {
  try {
    console.log("Profile picture requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "..", "uploads", filename);

    if (!fs.existsSync(filePath)) {
      console.error(`Profile picture not found: ${filePath}`);
      return res.status(404).send("Profile picture not found");
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending profile picture: ${err.message}`);
        res.status(500).send("Error sending profile picture");
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

router.get("/profilePicture/thumbnail/:filename", async (req, res) => {
  try {
    console.log("Thumbnail requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "..", "uploads", filename);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Profile picture not found: ${filePath}`);
      return res.status(404).send("Profile picture not found");
    }

    // Resize the image to a thumbnail (e.g., 50x50 pixels)
    const thumbnailBuffer = await sharp(filePath)
      .resize(50, 50) // Adjust the size as per your requirements
      .toBuffer();

    // Send the resized image as a response
    res.type("image/png").send(thumbnailBuffer);
  } catch (err) {
    // Handle any unexpected errors
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

// Route to serve thumbnails
router.get("/thumbnail/:filename", (req, res) => {
  try {
    console.log("Thumbnail requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "uploads/thumbnails", filename);

    if (!fs.existsSync(filePath)) {
      console.error(`Thumbnail not found: ${filePath}`);
      return res.status(404).send("Thumbnail not found");
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending thumbnail: ${err.message}`);
        res.status(500).send("Error sending thumbnail");
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

// Route to serve product images
router.get("/products/:filename", (req, res) => {
  try {
    console.log("Product image requested:", req.params.filename);
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "uploads/products", filename);

    if (!fs.existsSync(filePath)) {
      console.error(`Product image not found: ${filePath}`);
      return res.status(404).send("Product image not found");
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending product image: ${err.message}`);
        res.status(500).send("Error sending product image");
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    res.status(500).send("Internal server error");
  }
});

// Route to serve return URL file
router.get("/returnURL", (req, res) => {
  res.sendFile(path.join(__dirname, "Screens", "ReturnToBars.html"));
});

module.exports = router;
