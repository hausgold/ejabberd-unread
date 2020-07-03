const moment = require('moment');
const colors = require('colors');
const format = require('./xml-format');
const startAt = new moment();

module.exports = (config) => {
  // Presave some defaults
  const origMatch = `${config.match}`;
  var stanzas = {};

  // Setup some defaults
  if (!config.errors) { config.errors = []; }
  if (config.matchCallback == undefined) { config.matchCallback = null; }

  let utils = {
    matchers: 0,
    config: config,

    switchUser: (name, callback) => {
      config = require('../config');
      config.jid = `${name}@${config.hostname}`;
      require('../src/client')(config, callback);
    },

    isRelevant: (xml, direction) => {
      // Stop further stanzas when we already had this one before
      if (stanzas[config.match]) { return false; }

      // Try multiple matches based on the given data type
      match = false;
      if (typeof config.match == 'string' && ~xml.indexOf(config.match)) {
        match = true;
      }
      if (config.match instanceof RegExp && config.match.test(xml)) {
        match = true;
      }

      // We have a match, so we save it
      if (match) {
        // Except we are on the default matcher again
        if (config.match !== origMatch) {
          stanzas[config.match] = true;
        }

        // In case we have a matching stanza, save it's id
        utils.saveId(xml);

        // Run hooks if there are any
        if (config.matchCallback) {
          config.matchCallback(xml, direction);
        }

        return true;
      }

      // In case config says log all, everything is related
      if (!config.skipUnrelated) { return true; }

      return false;
    },

    saveId: (xml) => {
      let match = xml.match(/<stanza-id .* id=['"]([^'"]+)/);
      if (match && match[1]) {
        config.match = match[1];
        config.lastStanzaId = match[1];
      }
    },

    restoreMatcher: () => {
      config.match = origMatch;
      config.matchCallback = null;
      utils.matchers++;
    },

    setMatcher: (match, callback = null) => {
      stanzas = {};
      config.match = match;
      config.matchCallback = callback;
      utils.matchers++;
    },

    setMatcherFake: () => {
      utils.matchers++;
    },

    setMatcherCallback: (callback) => {
      config.matchCallback = callback;
    },

    log: (str, multiple = true, level = 1) => {
      if (!config.debug) {
        multiple = false;
      }

      if (config.testLevel) {
        level = config.testLevel;
      }

      let pre = Array(level + 1).join(' ');

      if (multiple === true) {
        console.log(`# ${pre}\n# ${pre} ${str}\n# ${pre}`);
      } else {
        console.log(`# ${pre} ${str}`);
      }
    },

    logError: (message, xml, meta = null) => {
      if (!config.errors) { config.errors = []; }
      config.errors.push({
        message: message,
        xml: xml,
        meta: meta
      });
      utils.log('> ' + `${message} (#${config.errors.length})`.red);
    },

    errors: () => {
      if (!config.errors || !config.errors.length) { return; }

      console.log('#');
      utils.log('Error details'.red);
      config.errors.forEach((err, idx) => {
        console.log('#');
        utils.log(`#${++idx} ${err.message}`.red);
        if (err.xml) {
          console.log('#');
          console.log(format(err.xml, '#   '));
          console.log('#');
        }
        if (err.meta) {
          utils.log(`  ${err.meta}`);
          console.log('#');
        }
      });
    },

    stats: () => {
      let errors = 0
      if (config.errors && config.errors.length) {
        errors = config.errors.length;
      }

      const endAt = new moment();
      const duration = moment.duration(endAt.diff(startAt));
      const seconds = new String(duration.as('seconds'));
      const bad = errors;
      let good = utils.matchers - errors;
      let failed = `${bad} failed`;

      if (good < 0) { good = 0; }

      utils.log([
        'Statistics: ' +
        `${utils.matchers} test cases`.magenta,
        `${good} successful`.green,
        (bad > 0) ? failed.red : failed.green
      ].join(', '));
      utils.log('Finished in ' + `${seconds}s`.green);
    },

    isoMinute: () => {
      return moment().toISOString().split(':').slice(0, 2).join(':');
    },

    isoHour: () => {
      return moment().toISOString().split(':').slice(0, 1).join(':');
    },

    exit: () => {
      utils.errors();
      utils.stats();
      setTimeout(() => {
        let code = (!config.errors || !config.errors.length) ? 0 : 1;
        process.exit(code);
      }, 200);
    },

    escapeXml: (xml) => {
      let entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      };

      return String(xml).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
      });
    }
  };

  return utils;
};
