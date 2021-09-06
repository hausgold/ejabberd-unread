![ejabberd-unread](doc/assets/project.svg)

[![Test](https://github.com/hausgold/ejabberd-unread/actions/workflows/test.yml/badge.svg)](https://github.com/hausgold/ejabberd-unread/actions/workflows/test.yml)

This is a custom [ejabberd](https://www.ejabberd.im/) module which allows users
to acknowledge/retrieve their unread messages from direct chats and multi user
conferences. You can implement things like the WhatsApp read message markers,
notification streams with the ability to mark a single notification as read,
etc., with this module. You can find [further details of the
concept](./doc/concept.md) to learn more about the client usage. This project
comes with a self-contained test setup with all required parts of the stack.

**Heads up!** ejabberd-unread is the successor of the [ejabberd-read-markers
module](https://github.com/hausgold/ejabberd-read-markers), which differs in
support for direct chats and per-message acknowledgements.

- [Requirements](#requirements)
  - [Runtime](#runtime)
  - [Build and development](#build-and-development)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Database](#database)
- [Development](#development)
  - [Getting started](#getting-started)
    - [mDNS host configuration](#mdns-host-configuration)
  - [Test suite](#test-suite)

## Requirements

### Runtime

* [ejabberd](https://www.ejabberd.im/) (=18.01)
* [PostgreSQL](https://www.postgresql.org/) (>=9.6)

### Build and development

* [GNU Make](https://www.gnu.org/software/make/) (>=4.2.1)
* [Docker](https://www.docker.com/get-docker) (>=17.09.0-ce)
* [Docker Compose](https://docs.docker.com/compose/install/) (>=1.22.0)

## Installation

See the [detailed installation instructions](./INSTALL.md) to get the ejabberd
module up and running. When you are using Debian/Ubuntu, you can use an
automatic curl pipe script which simplifies the installation process for you.

## Configuration

We make use of the global database settings of ejabberd, but you can also
specify a different database type by setting it explicitly.

```yaml
modules:
  mod_unread:
    db_type: sql
```

Keep in mind that this implementation just features the `sql` database type,
and only this.

### Database

The concept outlined the `unread_messages` table definition which is required to
store the unread messages per user per conversation. The [actual SQL
schema](./config/postgres/99-pg-unread.sql) MUST be executed on
the Jabber service database (PostgreSQL).

## Development

### Getting started

The project bootstrapping is straightforward. We just assume you took already
care of the requirements and you have your favorite terminal emulator pointed
on the project directory.  Follow the instructions below and then relaxen and
watchen das blinkenlichten.

```bash
# Installs and starts the ejabberd server and it's database
$ make start

# (The jabber server should already running now on its Docker container)

# Open a new terminal on the project path,
# install the custom module and run the test suite
$ make reload test
```

When your host mDNS Stack is fine, you can also inspect the [ejabberd admin
webconsole](http://jabber.local/admin) with
`admin@jabber.local` as username and `defaultpw` as password. In the
case you want to shut this thing down use `make stop`.

#### mDNS host configuration

If you running Ubuntu/Debian, all required packages should be in place out of
the box. On older versions (Ubuntu < 18.10, Debian < 10) the configuration is
also fine out of the box. When you however find yourself unable to resolve the
domains or if you are a lucky user of newer Ubuntu/Debian versions, read on.

**Heads up:** This is the Arch Linux way. (package and service names may
differ, config is the same) Install the `nss-mdns` and `avahi` packages, enable
and start the `avahi-daemon.service`. Then, edit the file `/etc/nsswitch.conf`
and change the hosts line like this:

```bash
hosts: ... mdns4 [NOTFOUND=return] resolve [!UNAVAIL=return] dns ...
```

Afterwards create (or overwrite) the `/etc/mdns.allow` file when not yet
present with the following content:

```bash
.local.
.local
```

This is the regular way for nss-mdns > 0.10 package versions (the
default now). If you use a system with 0.10 or lower take care of using
`mdns4_minimal` instead of `mdns4` on the `/etc/nsswitch.conf` file and skip
the creation of the `/etc/mdns.allow` file.

**Further readings**
* Archlinux howto: https://wiki.archlinux.org/index.php/avahi
* Ubuntu/Debian howto: https://wiki.ubuntuusers.de/Avahi/
* Further detail on nss-mdns: https://github.com/lathiat/nss-mdns

### Test suite

The test suite sets up a simple environment with 5 independent users. (admin,
alice, amy, emma and bob). Multiple (9) scenario seeds gets created to test all
features of the module. We create multiple MUCs, send messages to these MUCs
and also send direct messages to configured conversations between two users.
The MUCs are owned by the admin user, the message sender on all MUC messages is
alice. The sender of direct message varies. The suite performs then all tasks
defined by the concept on the service, which includes marking a message as
read, fetching all unread message counts of all user conversations, etc. The
test suite was written in JavaScript and is executed by Node.js inside a Docker
container. We picked JavaScript here due to the easy and good featured
[stanza.io](http://stanza.io) client library for XMPP. It got all the things
which were needed to fulfil the job.
