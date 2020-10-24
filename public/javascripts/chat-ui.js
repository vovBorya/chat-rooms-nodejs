const divEscapedContentElement = (message) => {
  return $('<div></div>').text(message);
};

const divSystemContentElement = (message) => {
  return $('<div></div>').html('<i>' + message + '</i>');
};

const processUserInput = (chatApp, socket) => {
  const message = $('.send-message').val();
  let systemMessage;

  console.log('message >>>', message);

  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('.messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('.room').text(), message);
    $('.messages').append(divEscapedContentElement(message));
    $('.messages').scrollTop($('.messages').prop('scrollHeight'));
  }

  $('.send-message').val('');
};

const socket = io.connect();

$(() => {
  const chatApp = new Chat(socket);

  socket.on('nameResult', (result) => {
    let message;

    if (result.success) {
      message = `You are now known as ${result.name} .`;
    } else {
      result = result.message;
    }
    $('.messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', (result) => {
    $('.room').text(result.room);
    $('.messages').append(divSystemContentElement('Room changed'));
  });

  socket.on('message', (message) => {
    const newElement = $('<div></div>').text(message.text);
    $('.messages').append(newElement);
  });

  socket.on('rooms', (rooms) => {
    $('.room-list').empty();
    for (let room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }


    $('#room-list div').click(() => {
      chatApp.processCommand('/join ' + $(this).text());
      $('.send-message').focus();
    });
  });


  setInterval(() => {
    socket.emit('rooms');
  }, 800);

  $('.send-message').focus();

  $('.send-form').submit((event) => {
    event.preventDefault();
    processUserInput(chatApp, socket);
    return false;
  });
});