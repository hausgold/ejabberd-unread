const async = require('async');

module.exports = (client, utils) => {
  const match = (input, regex, message) => {
    if (regex.constructor !== RegExp) {
      regex = new RegExp(regex);
    }

    if (!regex.test(input)) {
      utils.logError(message, input, `Match failed for ${regex}`);
    }
  };

  const matchCount = (actual, expected, message) => {
    if (actual != expected) {
      utils.logError(
        message,
        '',
        `${actual} (actual) != ${expected} (expected)`
      );
    }
  };

  return {
    archiveOneMoreDirect: (finalCallback, userCallback) => {
      const query = 'SELECT COUNT(*) FROM archive';
      utils.setMatcherFake();
      async.waterfall([
        // Fetch initial count
        (callback) => {
          client.query(query, (err, res) => {
            if (err) { return callback(err); }
            callback(null, parseInt(res.rows[0].count));
          });
        },
        // Run the given user callback
        (orig, callback) => { userCallback(() => callback(null, orig)); },
        // Check the final count
        (orig, callback) => {
          client.query(query, (err, res) => {
            if (err) { return callback(err); }
            let actual = parseInt(res.rows[0].count);
            matchCount(
              actual,
              orig + 2,
              'Archive row count did not changed correctly'
            );
            callback();
          });
        }
      ], finalCallback);
    },

    allUnreadMessages: (expected, callback) => {
      utils.setMatcherFake();
      client.query('SELECT COUNT(*) FROM unread_messages', (err, res) => {
        if (err) { return callback(err); }
        let actual = parseInt(res.rows[0].count);
        matchCount(actual, expected, 'Unread messages row count is unexpected');
        callback();
      });
    },

    unreadMessages: (of, expected, callback) => {
      utils.setMatcherFake();
      const query = 'SELECT COUNT(*) FROM unread_messages WHERE user_jid = $1';
      client.query(query, [of], (err, res) => {
        if (err) { return callback(err); }
        let actual = parseInt(res.rows[0].count);
        matchCount(
          actual,
          expected,
          `Unread messages of ${of} row count is unexpected`
        );
        callback();
      });
    },

    unreadMessagesConversation: (of, on, expected, callback) => {
      utils.setMatcherFake();
      const query = `SELECT COUNT(*) FROM unread_messages
        WHERE user_jid = $1 AND conversation_jid = $2`;
      client.query(query, [of, on], (err, res) => {
        if (err) { return callback(err); }
        let actual = parseInt(res.rows[0].count);
        matchCount(
          actual,
          expected,
          `Unread messages of ${of} on ${on} row count is unexpected`
        );
        callback();
      });
    },

    firstUnreadMessageId: (user, conversation, callback) => {
      const query = `SELECT message_id FROM unread_messages
        WHERE user_jid = $1 AND conversation_jid = $2
        ORDER BY message_id ASC LIMIT 1`;
      client.query(query, [user, conversation], (err, res) => {
        if (err) { return callback(err); }
        if (!res.rows.length) { return callback(null); }
        callback(parseInt(res.rows[0].message_id));
      });
    },

    lastUnreadMessageId: (user, conversation, callback) => {
      const query = `SELECT message_id FROM unread_messages
        WHERE user_jid = $1 AND conversation_jid = $2
        ORDER BY message_id DESC LIMIT 1`;
      client.query(query, [user, conversation], (err, res) => {
        if (err) { return callback(err); }
        if (!res.rows.length) { return callback(null); }
        callback(parseInt(res.rows[0].message_id));
      });
    }
  };
};
