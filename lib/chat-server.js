import SocketIO from 'socket.io';

let io;
let guestNumber = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom = {};

export const listenChatServer = (server) => {
  io = SocketIO.listen(server);
  io.set('log level', 1);

  io.sockets.on('connection', (socket) => {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', () => {
      socket.emit('rooms', io.sockets.manager.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

const assignGuestName = (socket, guestNumber, nickNames, namesUsed) => {
  const name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;

  socket.emit('nameResult', {
    success: true,
    name,
  });

  namesUsed.push(name);
  return guestNumber += 1;
};

const joinRoom = (socket, room) => {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {room});
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} has jointed to ${room}.`,
  });

  const roomUsers = io.sockets.clients(room);

  // Should be refactored
  if (roomUsers.length > 1) {
    let roomUsersCount = `Users currently in ${room}:`;
    roomUsers.map((user, index) => {
      if (user.id !== socket.id) {
        if (index > 0) {
          roomUsersCount += ',';
        }
        roomUsersCount += nickNames[user.id];
      }
    });
    roomUsersCount += '.';
    socket.emit('message', {text: roomUsersCount});
  }
};

const handleNameChangeAttempts = (socket, nickNames, namesUsed) => {
  socket.on('nameAttempt', (name) => {
    console.log('name >>>', name);
    if (name.startsWith('Guest')) {
      socket.emit('nameResult', {
        success: false,
        message: 'Name cannot begins with "Guest"',
      });
    } else {
      if (!namesUsed.includes(name)) {
        const previousName = nickNames[socket.id];
        const previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        namesUsed.splice(previousNameIndex, 1);
        socket.emit('nameResult', {
          success: true,
          name,
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: `${previousName} is now known as ${name}.`,
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          text: 'The name is already in use',
        });
      }
    }
  });
};

const handleMessageBroadcasting = (socket) => {
  socket.on('message', (message) => {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`,
    });
  });
};

const handleRoomJoining = (socket) => {
  socket.on('join', (room) => {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
};

const handleClientDisconnection = (socket) => {
  socket.on('disconnect', () => {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    namesUsed.splice(nameIndex, 1);
    delete nickNames[socket.id];
  });
};
