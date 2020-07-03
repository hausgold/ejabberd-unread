const xmpp = require('stanza.io');
const colors = require('colors');

const installSpecs = require('./xmpp-specs');
const installMiddleware = require('./stanza-middleware');
const setupUtils = require('../lib/utils');

module.exports = (config, callback) => {
  // Setup a new XMPP client
  let client = xmpp.createClient(config);

  // Call the user given function when we have a connection
  client.on('session:started', () => {

    // Install all the nifty handlers to that thing
    installSpecs(client);
    installMiddleware(client);
    client.utils = setupUtils(client.config);

    // Enable session features
    client.sendPresence();
    client.enableCarbons();

    // The features above are implemented in fire and forget fashion, so we
    // must synchronize them here manually
    setTimeout(() => { callback && callback(client); }, 500);
  });

  // Connect the new client
  client.connect();
};
