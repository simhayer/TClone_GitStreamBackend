const { Server } = require("socket.io");

const StripePublishableKey =
  "sk_test_51PqQlpD4UkX571U3Ov9ibcLrU3fqL4oamSp42vx8wl4PjNS0f1USJEkSz54uAbhhHALQ9pBqXghaVAKdiyFVvHwP00kDi3orE0";

const PORT = 3000;
//const SERVER_URL = "http://localhost:3000";
const SERVER_URL = "https://thebars.duckdns.org"; //for AWS EC2

const TAXRATE = 0.13;
const COMMISIONRATE = 0.08;

const GOOGLE_ANDROID_CLIENT_ID =
  "423122273522-adm11brgik1kv9bj2soq8r3ge88rom6g.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  "423122273522-f7tikrloftd730mu77nnneb9ik3t74k0.apps.googleusercontent.com";

module.exports = {
  StripePublishableKey,
  PORT,
  SERVER_URL,
  TAXRATE,
  COMMISIONRATE,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
};
