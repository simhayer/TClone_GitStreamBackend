const broadcastService = require("../Services/broadcastServices");

module.exports = (io) => {
  io.on("connection", async function (socket) {
    console.log("new connection: " + socket.id);

    socket.emit("from-server", socket.id);

    socket.on("watcher", (data) => {
      console.log("watcher: " + data);
      broadcastService
        .addWatcher(data.id)
        .then((updatedWatchers) => {
          io.to(data.id).emit("updateWatcher", updatedWatchers);
        })
        .catch((error) => {
          console.error("Error updating watchers:", error);
        });
    });

    // When a user joins a specific stream
    socket.on("joinStream", (broadcastId) => {
      socket.join(broadcastId);
      console.log(`User ${socket.id} joined broadcast room: ${broadcastId}`);
    });

    socket.on("broadcast-started", (data) => {
      const { broadcastId, socketId } = data;
      socket.join(broadcastId);
      console.log(
        `Broadcaster ${socketId} started broadcast and joined room: ${broadcastId}`
      );
    });

    socket.on("comment", (data) => {
      console.log("comment: " + data);
      try {
        broadcastService.addComment(
          data.id,
          data.comment,
          data.userUsername,
          data.userProfilePicture
        );
        io.to(data.id).emit("newComment", data);
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    });

    socket.on("bid", (data) => {
      console.log("bid: " + data);
      const id = data?.id;
      if (id) {
        broadcastService
          .addBid(id, data.bidAmount, data.userUsername)
          .then((bidData) => {
            io.to(id).emit("newBid", bidData);
          })
          .catch((error) => {
            console.error("Error adding bid:", error);
          });
      } else {
        console.log("id is undefined or missing");
      }
    });

    socket.on("start-bid", (data) => {
      console.log("start-bid: " + data);
      if (data?.id && data?.product) {
        broadcastService.startBid(data.id, data.product);
        io.to(data.id).emit("startBid", data);
      } else {
        console.log("Missing data for start-bid");
      }
    });

    socket.on("end-bid", (data) => {
      console.log("end data:", data);
      const id = data?.id;
      if (id) {
        broadcastService
          .endBid(id)
          .then((bidData) => {
            io.to(id).emit("endBid", bidData);
          })
          .catch((error) => {
            console.error("Error ending bid:", error);
          });
      } else {
        console.log("id is undefined or missing");
      }
    });

    // socket.on("disconnect", () => {
    //   try {
    //     broadcastService.removeBroadcast(socket.id);
    //     console.log(`User ${socket.id} disconnected`);
    //   } catch (error) {
    //     console.error("Error removing broadcast on disconnect:", error);
    //   }
    // });
  });
};
