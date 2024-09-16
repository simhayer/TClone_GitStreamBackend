// db.js
const mongoose = require("mongoose");
const AppData = require("./AppData");

//const localDB = `mongodb://0.0.0.0:27017/role_auth`;

const uri =
  "mongodb+srv://wooble-db:wooble-db@cluster0.bqjnfql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const initializeAppData = async () => {
  try {
    const highestUserID = await AppData.findOne();
    if (!highestUserID) {
      await AppData.create({ highestUserID: 1 });
    }
  } catch (error) {
    console.error("Error initializing app data:", error);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {});
    console.log("Successfully connected to MongoDB!");
    await initializeAppData();
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
};

module.exports = connectDB;
