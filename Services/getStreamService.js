//import {StreamClient} from '@stream-io/node-sdk';
// or
const {StreamClient} = require('@stream-io/node-sdk');

const apiKey = '8ryv3hxy9p2s';
const secret =
  'z5fr9c6rytbjcqueha8g7c48cfwtcyba86mnupqsxg4ccfjgxfmek9n87us7wrqa';
client = new StreamClient(apiKey, secret);

const createStreamUser = async (req, res) => {
  const {username} = req.body;

  try {
    const newUser = {
      id: username,
      role: 'user',
      custom: {
        color: 'red',
      },
      name: username,
      image: 'link/to/profile/image',
    };
    await client.upsertUsers([newUser]);

    token = client.generateUserToken({user_id: username});
    res.status(201).json(token);
  } catch (error) {
    res.status(400).json({error: error.message});
  }
};

const queryActiveStreamCalls = async (req, res) => {
  console.log('Querying active stream calls');
  try {
    //const activeCalls = await client.queryCalls({state: 'active'});
    const {calls} = await client.video.queryCalls({
      filter_conditions: {ongoing: {$eq: true}},
    });

    res.status(200).json(calls);
  } catch (error) {
    console.error('Error querying active stream calls:', error);
    res.status(400).json({error: error.message});
  }
};

module.exports = {
  createStreamUser,
  queryActiveStreamCalls,
};
