#!/usr/bin/env node

const async = require('async');

// Setup a new client and run the test suite
const config = Object.assign(require('../config'), {
  jid: 'bob@jabber.local',
  password: 'bob'
});

require('../src/client')(config, (client, utils) => {
  // Listen for subscriptions
  client.on('presence', (presence) => {
    if (presence.type == 'subscribe') {
      let fromJid = presence.from.full;

      // Accept it
      client.acceptSubscription(fromJid);
      // Add the initiator to own roster
      client.updateRosterItem({
        jid: fromJid,
        name: 'Blub?' // UserContacts.findByJid(fromJid).nickname
      });
      // Ask for subscription back
      client.subscribe(fromJid);

      // Check roster
      setTimeout(() => {
        client.getRoster((err, roster) => {
          console.log(roster.roster.items);
        });
      }, 2000);
    }
  });
});
