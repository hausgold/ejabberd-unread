# ejabberd-unread Installation

- [Common notes](#common-notes)
- [Manual installation](#manual-installation)
- [Manual uninstall](#manual-uninstall)
- [Automatic install on Ubuntu/Debian](#automatic-install-on-ubuntudebian)

## Common notes

Take care of the mod_unread module configuration on you ejabberd config,
otherwise the module won't be started on your instance and you cannot use the
features. The second important note is the database migration. Execute the SQL
statement on your database which was bundled on the binary relase package.

## Manual installation

The ejabberd project is able to compile and load contribution modules at
runtime. You just need to download the source of this module into
`~/.ejabberd-modules` directory or the one defined by the
`CONTRIB_MODULES_PATH` setting in `ejabberdctl.cfg`. There you create a
directory named `mod_unread`.

Then run `ejabberdctl module_install mod_unread` while the ejabberd
server is running and you should see a logged info about the unread
module was started. Then you are able to use it.

## Manual uninstall

Just run `ejabberdctl module_uninstall mod_unread` while the ejabberd
server is running and delete the `mod_unread` directory from your
contribution modules directory (`~/.ejabberd-modules`).

## Automatic install on Ubuntu/Debian

Be sure that the `ejabberd` package is installed correctly via `apt`. Then you
can use the following curl-pipe command to automatically install the module to
the ejabberd server. The server MUST be restarted afterwards.
