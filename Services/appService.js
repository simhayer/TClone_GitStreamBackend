const config = require("../config");

const getGoogleClientId = async (req, res) => {
  console.log("gettingGoogleClientId");
  try {
    const googleAndroidClientId = config.GOOGLE_ANDROID_CLIENT_ID;
    const googleIosClientId = config.GOOGLE_IOS_CLIENT_ID;
    return res.status(200).json({ googleAndroidClientId, googleIosClientId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGoogleClientId,
};
