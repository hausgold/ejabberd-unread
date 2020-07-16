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

    // We like custom stanzas - so we want the server to archive them!
    // Therefore we extend the message definition to send the storage hint for
    // MAM.
    const StoreHint = jxt.define({
      name: 'store',
      element: 'store',
      namespace: 'urn:xmpp:hints'
    });
    jxt.extend(Message, StoreHint);

    // A deep custom stanza for validation
    const Owner = jxt.define({
      name: 'owner',
      element: 'owner',
      namespace: 'custom:stanza:ns7',
      fields: {
        id: jxt.utils.attribute('id'),
        name: jxt.utils.text()
      }
    });

    const CustomStanza = jxt.define({
      name: 'customStanza',
      element: 'very-custom-stanza',
      namespace: 'custom:stanza:ns4',
      fields: {
        id: jxt.utils.attribute('id'),
        message: jxt.utils.text(),
        owner: jxt.utils.extension(Owner),
      }
    });

    jxt.extend(Message, CustomStanza);
  });
};
