class Chat {
  constructor(socket) {
    this.socket = socket
  }

  sendMessage = (room, text) => {
    this.socket.emit('message', {room, text});
  };

  changeRoom = (room) => {
    this.socket.emit('join', {
      newRoom: room,
    });
  };

  processCommand = (text) => {
    const words = text.split(' ');
    const command = words[0].substring(1, words[0].length).toLowerCase();
    let message = false;
  
    switch (command) {
      case 'join':
        words.shift();
        const room = words.join(' ');
        this.changeRoom(room);
        break;
      case 'nick':
        words.shift();
        const name = words.join(' ');
        this.socket.emit('nameAttempt', name);
        break;
      default:
        message = 'Unrecognized command';
        break;
    }
  
    return message;
  };
}

