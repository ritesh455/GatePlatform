const { io } = require("socket.io-client");

const socket = io("https://gateplatform.onrender.com");

socket.on("connect", () => {

  console.log("Connected:", socket.id);

  socket.emit("joinRoom", 1);

  socket.emit("sendMessage", {
    groupId: 1,
    senderId: 2,
    message: "Hello group!"
  });

});

socket.on("receiveMessage", (msg) => {
  // console.log("New Message:", msg);
});

socket.on("sendMessage", async (data) => {

  const { roomId, senderId, message } = data;

  await db.query(
    `INSERT INTO messages (room_id,sender_user_no,message)
     VALUES ($1,$2,$3)`,
    [roomId, senderId, message]
  );

  io.to(`room_${roomId}`).emit("receiveMessage", {
    roomId,
    senderId,
    message
  });

});

socket.on("joinRoom", (roomId) => {

  socket.join(`room_${roomId}`);

});

