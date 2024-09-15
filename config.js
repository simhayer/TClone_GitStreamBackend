const {Server} = require('socket.io');

const StripePublishableKey =
  'sk_test_51PqQlpD4UkX571U3Ov9ibcLrU3fqL4oamSp42vx8wl4PjNS0f1USJEkSz54uAbhhHALQ9pBqXghaVAKdiyFVvHwP00kDi3orE0';

const PORT = 3000;
const SERVER_URL = 'http://localhost:3000';

const TAXRATE = 0.13;
const COMMISIONRATE = 0.08;

module.exports = {
  StripePublishableKey,
  PORT,
  SERVER_URL,
  TAXRATE,
  COMMISIONRATE,
};
