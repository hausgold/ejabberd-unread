// Here are the XMPP specifications for our custom read markers module.
// Require this file and pass in a +stanza.io+ client instance. The code
// below takes care to register the new stanzas.
module.exports = (client) => {
  const jxt = client.stanzas;
  const NS = 'urn:xmpp:unread';

  const AckUnread = jxt.define({
    name: 'ack',
    element: 'ack',
    namespace: NS,
    fields: {
      id: jxt.utils.attribute('id'),
      jid: jxt.utils.attribute('jid')
    }
  });

  const QueryUnread = jxt.define({
    name: 'query',
    element: 'query',
    namespace: NS,
    fields: {
      jid: jxt.utils.attribute('jid')
    }
  });

  const QueryResultOwn = jxt.define({
    name: 'unreadMessages',
    element: 'unread-messages',
    namespace: NS,
    fields: {
      jid: jxt.utils.attribute('jid'),
      amount: jxt.utils.attribute('amount')
    }
  });

  const QueryResultPeer = jxt.define({
    name: 'firstUnread',
    element: 'unread-message',
    namespace: NS,
    fields: {
      jid: jxt.utils.attribute('jid'),
      id: jxt.utils.attribute('id')
    }
  });

  // Add the unread custom stanza definitions
  jxt.withIq((Iq) => {
    jxt.extend(Iq, AckUnread);
    jxt.extend(Iq, QueryUnread);
    jxt.add(Iq, 'unreadMessages', jxt.utils.multiExtension(QueryResultOwn));
    jxt.add(Iq, 'firstUnread', jxt.utils.multiExtension(QueryResultPeer));
  });

  jxt.withMessage((Message) => {
    // There is a nasty typo in our current stanza.io/jxt version combination.
    // So we monkey patch this to get the bool sub-attribute working.
    const getBoolSubAttribute = (xml, NS, sub, attr, defaultVal) => {
      let val = jxt.utils.getSubAttribute(xml, NS, sub, attr)
        || defaultVal || '';
      return val === 'true' || val === '1';
    };
    jxt.utils.boolSubAttribute = jxt.utils.field(
      getBoolSubAttribute, jxt.utils.setBoolSubAttribute
    );

    // Extend the default message stanza to check for the unread extension
    jxt.add(
      Message, 'unread', jxt.utils.boolSubAttribute(NS, 'unread', 'state')
    );

    // In order to use the unread module in practise each message from the
    // archive should parse the stanza/archived-id properly as
    // +message.messageId::int+"
    jxt.add(
      Message, 'messageId', jxt.utils.numberSubAttribute(
        'urn:xmpp:sid:0', 'stanza-id', 'id'
      )
    );
  });
};
