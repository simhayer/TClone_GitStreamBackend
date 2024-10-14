const { User, Product } = require("../models/user");
const AppData = require("../models/AppData");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret =
  "0bbb60bc7d2fe832d54d785370672901832d3ba849366219ddfea07bd5eed8dc06d485";
const { sendResetCodeMail } = require("./mail");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const { OAuth2Client } = require("google-auth-library");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");

    // Check if the directory exists, if not, create it
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create directory and any necessary subdirectories
    }

    cb(null, uploadDir); // Set the destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set the file name
  },
});

const upload = multer({ storage: storage });

// Configure multer for file uploads
const storageProducts = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "products");

    // Check if the directory exists, if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Create directory and any necessary subdirectories
    }

    cb(null, dir); // Set the destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set the file name
  },
});

const uploadProduct = multer({ storage: storageProducts });

// auth.js
exports.register = async (req, res, next) => {
  try {
    console.log("Register function called");
    console.log("Request body:", req.body);

    const { fullname, email, password } = req.body;

    const lowerCaseEmail = email.toLowerCase();

    const randomUsername = `random_${Math.floor(1000 + Math.random() * 9000)}`;

    // Increment the highestUserID and save it
    let appData = await AppData.findOne();
    appData.highestUserID += 1;
    await appData.save();

    const newUserID = appData.highestUserID;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Check if password is provided and meets the length requirement
    if (!password) {
      return res.status(400).json({ message: "Password does not exist" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password less than 6 characters" });
    }

    // Hash the password and create the user
    bcrypt.hash(password, 10).then(async (hash) => {
      await User.create({
        fullname,
        email: lowerCaseEmail,
        password: hash,
        userID: newUserID,
        username: randomUsername,
      })
        .then((user) =>
          res.status(200).json({
            message: "User successfully created",
            user,
          })
        )
        .catch((error) =>
          res.status(400).json({
            message: "User not successfully created",
            error: error.message,
          })
        );
    });
  } catch (err) {
    res.status(401).json({
      message: "User not successfully created",
      error: err.message,
      stack: err.stack,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log("Login request received");
    const { email, password } = req.body;
    console.log("Request body:", req.body);

    const lowerCaseEmail = email.toLowerCase();

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Email or password not present",
      });
    }

    const user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(400).json({
        message: "Login not successful",
        error: "User not found",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Password match
      const token = jwt.sign({ email: user.email }, jwtSecret, {
        expiresIn: "20d",
      });
      console.log("User logged in successfully, generating token");
      return res
        .status(200)
        .json({ message: "User logged in", token: token, user });
    } else {
      // Password doesn't match
      console.log("Invalid credentials for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login process:", error);
    return res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};

exports.updateUsername = async (req, res, next) => {
  try {
    console.log("Update Username request received");
    const { email, username } = req.body;
    console.log("Request body:", req.body);

    const lowerCaseEmail = email.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    // Check if email and password are provided
    if (!email || !username) {
      return res.status(400).json({
        message: "Email or username not present",
      });
    }

    const user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(400).json({
        message: "Login not successful",
        error: "User not found",
      });
    }

    // Compare the provided password with the hashed password in the database
    const usrnameExists = await checkUsernameExists(lowerCaseUsername);

    if (usrnameExists) {
      console.log("Username already exists");
      return res.status(400).json({
        message: "Username already exists",
      });
    } else {
      user.username = lowerCaseUsername;
      await user.save();
      return res.status(200).json({
        message: "Username updated",
        user,
      });
    }
  } catch (error) {
    console.error("Error during login process:", error);
    return res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};

async function checkUsernameExists(username) {
  try {
    const lowerCaseUsername = username.toLowerCase();
    console.log("Check username request received");
    console.log("Username:", username);

    const user = await User.findOne({ username: lowerCaseUsername });
    return !!user; // Returns true if user exists, false otherwise
  } catch (error) {
    console.error("Error during username check process:", error);
    return res.status(400).json({
      message: "An error occurred during username check",
      error: error.message,
    });
  }
}

exports.update = async (req, res, next) => {
  try {
    const { role, id } = req.body;

    // First - Verifying if role and id are present
    if (role && id) {
      // Second - Verifying if the value of role is admin
      if (role === "admin") {
        // Finds the user with the id
        const user = await User.findById(id);

        // Third - Verifies the user is not an admin
        if (user.role !== "admin") {
          user.role = role;
          await user.save(); // Save the user, now returns a promise

          res.status(201).json({ message: "Update successful", user });
        } else {
          res.status(400).json({ message: "User is already an Admin" });
        }
      }
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

function generateRandomCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

exports.sendResetCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const lowerCaseEmail = email.toLowerCase();

    const code = generateRandomCode();

    // First - Verifying if email is present
    if (email) {
      // Update user's code directly in the database
      const currentDate = new Date();
      const newCode = code + "." + currentDate.toString();

      const updateResult = await User.updateOne(
        { email: lowerCaseEmail },
        { resetCode: newCode }
      );

      if (updateResult.nModified === 0) {
        return res
          .status(404)
          .json({ message: "User not found or code not updated" });
      }

      // Call function to send reset code mail
      sendResetCodeMail(lowerCaseEmail, code);

      res.status(201).json({ message: "Update successful", email });
    } else {
      res.status(400).json({ message: "Email is required" });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.verifyResetCode = async (req, res, next) => {
  try {
    const { email, resetCode } = req.body;

    const lowerCaseEmail = email.toLowerCase();

    // First - Verifying if email and code are present
    if (email && resetCode) {
      // Find the user with the given email
      const user = await User.findOne({ email: lowerCaseEmail });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Extract the reset code and the date from the user's code
      const [storedCode, storedDate] = user.resetCode.split(".");

      // Check if the provided code matches the stored code
      if (resetCode === storedCode) {
        // Check if the code is expired (you can set an expiration time here)
        const currentDate = new Date();
        const storedDateObject = new Date(storedDate);

        // Assuming the code expires after 24 hours
        const expirationTime = 15 * 60 * 1000; // 15mins in milliseconds
        const isExpired =
          currentDate.getTime() - storedDateObject.getTime() > expirationTime;

        if (isExpired) {
          return res.status(400).json({ message: "Reset code has expired" });
        }

        return res.status(200).json({ message: "Reset code is valid" });
      } else {
        return res.status(400).json({ message: "Reset code is invalid" });
      }
    } else {
      res.status(400).json({ message: "Email and code are required" });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;

    const lowerCaseEmail = email.toLowerCase();

    // First - Verifying if email is present
    if (email) {
      const existingUser = await User.findOne({ email: lowerCaseEmail });
      if (!existingUser) {
        return res.status(400).json({ message: "User not found" });
      }
      if (!password) {
        return res.status(400).json({ message: "Password does not exist" });
      }
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password less than 6 characters" });
      }

      bcrypt.hash(password, 10).then(async (hash) => {
        await User.updateOne({ email: lowerCaseEmail }, { password: hash })
          .then((user) =>
            res.status(200).json({
              message: "Password Updated",
              user,
            })
          )
          .catch((error) =>
            res.status(400).json({
              message: "Password not updated",
              error: error.message,
            })
          );
      });

      //res.status(201).json({message: 'Update successful', email});
    } else {
      res.status(400).json({ message: "Email is required" });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne(); // Use deleteOne method instead of remove

    res.status(201).json({ message: "User successfully deleted", user });
  } catch (error) {
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Check if username and password is provided
    const lowerCaseEmail = email.toLowerCase();
    if (!email) {
      return res.status(400).json({
        message: "email not present",
      });
    }

    const user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      res.status(400).json({
        message: "Logout not successful",
        error: "User not found",
      });
    } else {
      res.status(200).json({
        message: "Logout successful",
        user,
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};

// Update profile picture
exports.updateProfilePicture = [
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const lowerCaseEmail = email.toLowerCase();

      if (!email || !req.file) {
        return res.status(400).json({
          message: "Email or profile picture not present",
        });
      }

      const user = await User.findOne({ email: lowerCaseEmail });

      if (!user) {
        return res.status(400).json({
          message: "User not found",
        });
      }

      // Assuming you store the uploaded files in a local directory called 'uploads'
      const profilePicturePath = `/uploads/${req.file.filename}`;

      // Update the user's profile picture URL
      user.profilePicture = profilePicturePath;
      await user.save();

      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      console.error("Error during profile picture update:", error);
      return res.status(400).json({
        message: "An error occurred",
        error: error.message,
      });
    }
  },
];

exports.getUserDetailsFromUsername = async (username) => {
  try {
    console.log("Request Body:", username); // Log the body of the request
    if (!username) {
      return null;
    }

    const lowerCaseUsername = username.toLowerCase();

    const user = await User.findOne({ username: lowerCaseUsername }); // Look up the user by username
    if (!user) {
      return null;
    }
    return {
      email: user.email,
      username: user.username,
      fullname: user.fullname,
      profilePicture: user.profilePicture,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

exports.getUserStripeDetails = async (email) => {
  try {
    console.log("Request Body:", email); // Log the body of the request

    // Check if email is provided
    if (!email) {
      return null;
    }

    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerCaseEmail }); // Look up the user by email
    if (!user) {
      return null;
    } else {
      //console.log('User:', user);
      return {
        username: user.username,
        fullname: user.fullname,
        stripeUserId: user.stripeUserId,
        stripeConnectedAccountId: user.stripeConnectedAccountId,
      };
    }
  } catch (error) {
    console.error("Error fetching user stripe ID:", error);
    return null;
  }
};

exports.getUserStripeId = async (email) => {
  try {
    console.log("Request Body:", email); // Log the body of the request

    // Check if email is provided
    if (!email) {
      return null;
    }

    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerCaseEmail }); // Look up the user by email
    if (!user) {
      return null;
    } else {
      return user.stripeUserId;
    }
  } catch (error) {
    console.error("Error fetching user stripe ID:", error);
    return null;
  }
};

exports.setUserStripeId = async (email, stripeUserId) => {
  try {
    if (!email) {
      return;
    }

    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      return;
    } else {
      user.stripeUserId = stripeUserId;
      await user.save();
      return;
    }
  } catch (error) {
    console.error("Error setting user stripe ID:", error);
  }
};

exports.setUserStripeConnectedAccountId = async (
  email,
  stripeConnectedAccountId
) => {
  try {
    if (!email) {
      return;
    }

    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerCaseEmail });
    if (!user) {
      return;
    } else {
      user.stripeConnectedAccountId = stripeConnectedAccountId;
      await user.save();
      return;
    }
  } catch (error) {
    console.error("Error setting user stripe ID:", error);
  }
};

exports.getUserProducts = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log the body of the request
    const { email } = req.body;
    console.log("Request Body:", email); // Log the body of the request

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerCaseEmail }).populate(
      "products"
    ); // Look up the user by email
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json({ products: user.products });
    }
  } catch (error) {
    console.error("Error fetching user products:", error);
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.addProductToUser = [
  uploadProduct.single("productImage"), // Middleware to handle file upload
  async (req, res, next) => {
    try {
      const { email, name, size, type } = req.body;

      const lowerCaseEmail = email.toLowerCase();

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let productImageUrl = null;

      // Handle product image upload
      if (req.file) {
        productImageUrl = path.join("products", req.file.filename);
      }

      // Create and save the product
      const product = new Product({
        name,
        size,
        type,
        imageUrl: productImageUrl, // Save the image URL/path along with the product details
      });

      await product.save(); // Save the product to the database

      // Add the product to the user's products array
      user.products.push(product._id);
      await user.save();

      res.status(200).json({ message: "Product added to user", user });
    } catch (error) {
      console.error("Error adding product to user:", error);
      res
        .status(400)
        .json({ message: "An error occurred", error: error.message });
    }
  },
];

exports.removeProductsFromUser = async (req, res) => {
  try {
    const { email, products } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const lowerCaseEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerCaseEmail }).populate(
      "products"
    ); // Populate to access product details
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Iterate over the product IDs to be removed
    for (const productId of products) {
      // Find the index of the product in the user's products array
      const productIndex = user.products.findIndex(
        (p) => p._id.toString() === productId
      );

      // If the product exists, remove it and delete the associated image
      if (productIndex !== -1) {
        const productToRemove = user.products[productIndex];

        // Delete the image file associated with the product
        if (productToRemove.imageUrl) {
          fs.unlink(productToRemove.imageUrl, (err) => {
            if (err) console.error("Error deleting product image:", err);
            else
              console.log("Product image deleted:", productToRemove.imageUrl);
          });
        }

        // Remove the product from the user's products array
        user.products.splice(productIndex, 1);

        // Optionally, you may also want to delete the product from the Product collection
        await Product.findByIdAndDelete(productToRemove._id);
      }
    }

    await user.save();
    res.status(200).json({ message: "Products removed from user" });
  } catch (error) {
    console.error("Error removing products from user:", error);
    res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.getUserDetailsFromUsernameClient = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const lowerCaseUsername = username.toLowerCase();

    const user = await User.findOne({ username: lowerCaseUsername });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      fullname: user.fullname,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res
      .status(400)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.handleGoogleSignin = async (req, res) => {
  const { email, name, profilePicture } = req.body;
  const lowerCaseEmail = email.toLowerCase();

  try {
    let user = await User.findOne({ email: lowerCaseEmail });
    console.log("User found:", user);
    if (!user) {
      const randomPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const randomUsername = `random_${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const randomUserID = 1000 + Math.random() * 9000;

      // Create a new user
      user = await User.create({
        fullname: name,
        email: lowerCaseEmail,
        password: hashedPassword,
        userID: Number(randomUserID),
        username: randomUsername,
        profilePicture,
      });
    }

    // Generate a JWT token
    const token = jwt.sign({ email: user.email }, jwtSecret, {
      expiresIn: "20d",
    });
    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

const generateRandomPassword = (length = 12) => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
};
