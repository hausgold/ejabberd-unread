#!/usr/bin/env node

const async = require('async');

// Setup a new client and run the test suite
const config = Object.assign(require('../config'), {
  jid: 'bob@jabber.local',
  password: 'bob'
});

require('../src/client')(config, (client, utils) => {
  client.getVCard('bernd@jabber.local', (err, vcard) => {
    console.log(err);
    console.log(vcard);
  });
});

// vcard = { vCardTemp:
//    { name: { family: 'Mustermann', given: 'Bernd' },
//      role: 'broker',
//      website:
//       'gid://maklerportal-api/User/96a9e238-9283-44de-a296-57acd26e3ae9',
//      fullName: 'Bernd Mustermann' },
//   lang: 'en',
//   id: '9128c4e3-fa88-462e-b953-9217720a545c',
//   to:
//    JID {
//      _isJID: true,
//      local: 'bob',
//      domain: 'jabber.local',
//      resource: '60546251428764978083172',
//      bare: 'bob@jabber.local',
//      full: 'bob@jabber.local/60546251428764978083172',
//      unescapedLocal: 'bob',
//      unescapedBare: 'bob@jabber.local',
//      unescapedFull: 'bob@jabber.local/60546251428764978083172',
//      prepped: true },
//   from:
//    JID {
//      _isJID: true,
//      local: 'bernd',
//      domain: 'jabber.local',
//      resource: '',
//      bare: 'bernd@jabber.local',
//      full: 'bernd@jabber.local',
//      unescapedLocal: 'bernd',
//      unescapedBare: 'bernd@jabber.local',
//      unescapedFull: 'bernd@jabber.local',
//      prepped: true },
//   type: 'result',
//   resultReply: [Function: resultReply],
//   errorReply: [Function: errorReply] }
