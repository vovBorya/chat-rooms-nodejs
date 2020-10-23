import SocketIO from "socket.io";

const io;
const guestNumber = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom;

export const listen = (server) => {
  io = SocketIO.listen(server);
  io.set("log level", 1);

  io.sockets.on("connection", (socket) => {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, "Lobby");
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on("rooms", () => {
      socket.emit("rooms", io.sockets.manager.rooms);
    });
    hahandleClientDisconnection(socket, nickNames, namesUsed);
  });
}