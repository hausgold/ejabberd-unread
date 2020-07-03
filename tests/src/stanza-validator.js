module.exports = (utils) => {
  const match = (xml, regex, message) => {
    if (regex.constructor !== RegExp) {
      regex = new RegExp(regex);
    }

    if (!regex.test(xml)) {
      utils.logError(message, xml, `Match failed for ${regex}`);
    }
  };

  const matchMissing = (xml, regex, message) => {
    if (regex.constructor !== RegExp) {
      regex = new RegExp(regex);
    }

    if (regex.test(xml)) {
      utils.logError(message, xml, `Match for ${regex}`);
    }
  };

  return {
    message: (room, nick) => {
      nick = nick || 'admin';
      return (xml, direction) => {
        if (direction !== 'response') { return; }
        const contains = (regex, message) => match(xml, regex, message);
        const missing = (regex, message) => matchMissing(xml, regex, message);
        const fullJid = `${room}/${nick}`;

        contains(
          `<message .* from=['"]${fullJid}['"] .*<body>.*</body></message>`,
          `Message response for ${room} failed.`
        );
      };
    }
  };
};
