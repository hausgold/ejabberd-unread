#!/usr/bin/env node

const async = require('async');

// Setup a new client and run the test suite
require('../src/client')(require('../config'), (client, utils) => {
  // Clear roster
  client.removeRosterItem('bob@jabber.local');
  client.unsubscribe('bob@jabber.local');

  // Listen for subscriptions
  client.on('presence', (presence) => {
    if (presence.type == 'subscribe') {
      let fromJid = presence.from.full;

      // Accept it
      client.acceptSubscription(fromJid);
      // Add the initiator to own roster
      // client.updateRosterItem({
      //   jid: fromJid,
      //   // name: 'Blub?' // UserContacts.findByJid(fromJid).nickname
      // });
      // Ask for subscription back
      // client.subscribe(fromJid);

      // Check roster
      setTimeout(() => {
        client.getRoster((err, roster) => {
          console.log(roster.roster.items);
        });
      }, 2000);
    }
  });

  // // Initial roster add
  // client.updateRosterItem({
  //   jid: 'bob@jabber.local',
  //   name: 'Bob Mustermann (2dbac006-8d15-452a-bf32-4d649663e063)'
  //   // UserContacts.findByJid(fromJid).nickname
  // });
  // client.subscribe('bob@jabber.local');

  // Initial roster add
  client.updateRosterItem({
    jid: 'admin@jabber.local',
    name: 'Admin Mustermann (2dbac006-8d15-452a-bf32-4d649663e063)'
  });
});
