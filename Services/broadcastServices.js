const webrtc = require('wrtc');
const {MediaStream} = require('wrtc');
const {v4: uuidv4} = require('uuid');
const config = require('../config');
const {broadcasters} = require('../Data/data');
const socketFunction = require('../Socket/socketFunction');
const stripeService = require('../Services/stripeService');
const orderService = require('../Services/orderService');

class Broadcaster {
  constructor(
    _id = null,
    _socket_id,
    _username,
    _profilePicture,
    _title,
    _thumbnailFilename,
    _meetingId,
  ) {
    this.id = _id;
    this.socket_id = _socket_id;
    this.username = _username;
    this.profilePicture = _profilePicture;
    this.title = _title;
    this.meetingId = _meetingId;
    this.watchers = 0;
    this.comments = [];
    this.isBidding = false;
    this.curBidDetails = {};
    this.thumbnailFilename = _thumbnailFilename;
  }
}

async function addBroadcast(
  socket_id,
  sdp,
  username,
  profilePicture,
  title,
  thumbnailFilename, // Receive the filename here
  meetingId,
) {
  console.log('new broadcast');
  var id = socket_id;
  console.log('username: ' + username);

  var broadcast = new Broadcaster(
    id,
    socket_id,
    username,
    profilePicture,
    title,
    thumbnailFilename, // Assign the filename to the broadcaster object
    meetingId,
  );

  broadcasters[id] = broadcast;

  return id;
}

async function broadcastConnectionState(id) {
  socketFunction.sendListUpdateSignal();
}

async function removeBroadcast(id) {
  if (broadcasters[id] != null) {
    console.log('\x1b[31m', 'remove broadcaster: ' + id, '\x1b[0m');
    delete broadcasters[id];
  }
}

async function addWatcher(id) {
  if (broadcasters[id] != null) {
    console.log('\x1b[31m', 'Updating broadcaster: ' + id, '\x1b[0m');

    if (broadcasters[id].watchers == null) {
      broadcasters[id].watchers = 0;
    }
    broadcasters[id].watchers += 1;

    return broadcasters[id].watchers;
  } else {
    console.log('\x1b[31m', 'Broadcaster not found: ' + id, '\x1b[0m');
    return 0;
  }
}

async function addComment(id, comment, userUsername, userProfilePicture) {
  if (broadcasters[id] != null) {
    console.log('\x1b[31m', 'Updating broadcaster: ' + id, '\x1b[0m');
    broadcasters[id].comments.push({comment, userUsername, userProfilePicture});
  } else {
    console.log('\x1b[31m', 'Broadcaster not found: ' + id, '\x1b[0m');
  }
}

async function addBid(id, bidAmount, userUsername) {
  if (broadcasters[id] != null) {
    console.log('Updating bid for broadcaster: ' + id);
    console.log('bidAmount: ' + bidAmount);

    const currentProduct = broadcasters[id].curBidDetails.product;

    broadcasters[id].curBidDetails = {
      userUsername,
      bidAmount,

      bidNo: broadcasters[id].curBidDetails.bidNo + 1,
      product: currentProduct, // Ensure the product remains the same
    };

    return broadcasters[id].curBidDetails;
  } else {
    console.log('\x1b[31m', 'Broadcaster not found: ' + id, '\x1b[0m');
  }
}

async function startBid(id, product) {
  if (broadcasters[id] != null) {
    console.log('Starting bid for broadcaster: ' + id);

    var ret = broadcasters[id].curBidDetails;

    broadcasters[id].curBidDetails = {
      userUsername: 'null',
      bidAmount: 0,
      bidNo: 0,
      product,
    };

    console.log(
      'broadcasters[id].curBidDetails: ' + broadcasters[id].curBidDetails,
    );

    return ret;
  } else {
    console.log('\x1b[31m', 'Broadcaster not found: ' + id, '\x1b[0m');
    return 0;
  }
}

async function endBid(id) {
  if (broadcasters[id] != null) {
    console.log('Ending bid for broadcaster: ' + id);
    console.log('ret: ' + broadcasters[id].curBidDetails.bidAmount);
    const ret = broadcasters[id].curBidDetails;
    broadcasters[id].isBidding = false;
    broadcasters[id].curBidDetails = {};

    if (ret.userUsername == 'null') {
      return ret;
    }

    const tax = ret.bidAmount * config.TAXRATE;

    // Charge the customer
    stripeService.chargeCustomerOffSessionForAccount({
      id,
      amount: ret.bidAmount + tax,
      userUsername: ret.userUsername,
      broadcasterUsername: broadcasters[id].username,
    });

    // Handle the order creation and saving
    const orderResult = await orderService.handleOrderCreation(
      ret.userUsername,
      broadcasters[id].username,
      ret.bidAmount,
      ret.product, // Assuming this field exists in your curBidDetails object
    );

    if (orderResult.success) {
      // Send the winner details to the client
      //sendWinnerToClient(broadcasters[id].socket, ret);
    } else {
      console.log('Order creation failed:', orderResult.message);
    }

    return ret;
  } else {
    console.log('\x1b[31m', 'Broadcaster not found: ' + id, '\x1b[0m');
    return {userUsername: 'null', bidAmount: 0, bidNo: 0};
  }
}

function fetch() {
  var data = [];
  for (var bs in broadcasters) {
    if (broadcasters.hasOwnProperty(bs)) {
      data.push({
        id: bs,
        username: broadcasters[bs].username,
        profilePicture: broadcasters[bs].profilePicture,
        title: broadcasters[bs].title,
        thumbnail: broadcasters[bs].thumbnailFilename,
        meetingId: broadcasters[bs].meetingId,
        socketID: broadcasters[bs].socket_id,
        watchers: broadcasters[bs].watchers,
        comments: broadcasters[bs].comments,
        isBidding: broadcasters[bs].isBidding,
        curBidDetails: broadcasters[bs].curBidDetails,
      });
    }
  }
  return data;
}

module.exports = {
  addBroadcast,
  fetch,
  addWatcher,
  addComment,
  addBid,
  startBid,
  endBid,
  removeBroadcast,
};
