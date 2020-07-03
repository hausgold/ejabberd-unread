 // Wait for the XMPP client
setTimeout(() => {
  client.joinRoom(roomJid, config.jid.local);

  setTimeout(() => {
    client.utils.log('Send a new message to ' + room.magenta);
    let message = faker.hacker.phrase();
    let callbacked = false;
    let safeMessage = client.utils.escapeXml(message);

    client.utils.config.lastMessage = safeMessage;
    client.utils.setMatcher(msgMatcher(safeMessage), (xml, direction) => {
      if (callbacked) { return; }
      callbacked = true;

      // Check the input message
      validator.message(roomJid, client.config.jid.local)(xml, direction);
      // Continue
      setTimeout(() => callback(), 200);
    });

    setTimeout(() => {
      client.sendMessage({
        to: roomJid,
        body: message,
        type: 'groupchat'
      });
    }, 200);
  }, 200);
}, 200);
