const fetch = require("node-fetch");
const { StreamClient } = require("@stream-io/node-sdk");

globalThis.fetch = fetch;

const apiKey = "c59unja7hkef";
const secret =
  "amfp4vht3t47ktbhh8vzyqxpudcau9kxqgxcscartqz5frwpmh5xbfzm83pv6q8u";
client = new StreamClient(apiKey, secret);

const createStreamUser = async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = {
      id: username,
      role: "user",
      custom: {
        color: "red",
      },
      name: username,
    };

    await client.upsertUsers([newUser]);
    const validity = 24 * 60 * 60;
    // token = client.generateUserToken({ user_id: username });
    token = client.generateUserToken({
      user_id: username,
      validity_in_seconds: validity,
    });
    res.status(201).json({ apiKey, token });
  } catch (error) {
    console.error("Error creating stream user:", error);
    res.status(400).json({ error: error.message });
  }
};

const queryActiveStreamCalls = async (req, res) => {
  try {
    console.log("Querying active stream calls");

    //const activeCalls = await client.queryCalls({state: 'active'});
    const { calls } = await client.video.queryCalls({
      filter_conditions: { ongoing: { $eq: true } },
    });

    res.status(200).json(calls);
  } catch (error) {
    console.error("Error querying active stream calls:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createStreamUser,
  queryActiveStreamCalls,
};
