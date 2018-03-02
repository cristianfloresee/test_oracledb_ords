/******************************************************************************
 * NAME
 *   dbconfig.js
 *
 * DESCRIPTION
 *   Holds the credentials used by node-oracledb examples to connect
 *   to the database.
 *
 *   The connectString here uses the Easy Connect syntax
 *   "localhost/XE".  This connects to the database service XE on the
 *   the local machine.
 *
 *   Applications can set the connectString value to an Easy Connect
 *   string, or a Connect Name from a tnsnames.ora file, or the name
 *   of a local Oracle database instance.
 *
 *   The full Easy Connect syntax is:
 *     [//]host_name[:port][/service_name][:server_type][/instance_name]
 *   see https://docs.oracle.com/database/121/NETAG/naming.htm#i498306
 *
 *   If a tnsnames.ora file is used, set the TNS_ADMIN environment
 *   variable such that $TNS_ADMIN/tnsnames.ora is read.
 *   Alternatively use $ORACLE_HOME/network/admin/tnsnames.ora or
 *   /etc/tnsnames.ora.
 *
 *   If connectString is not specified, the empty string "" is used
 *   which indicates to connect to the local, default database.
 *
 *   Errors like:
 *     ORA-12541: TNS:no listener
 *   or
 *     ORA-12154: TNS:could not resolve the connect identifier specified
 *   indicate connectString is invalid.
 *
 *   The error:
 *     ORA-12514: TNS:listener does not currently know of requested in connect descriptor
 *   indicates connectString is invalid.  You are reaching a computer
 *   with Oracle installed but the service name isn't known.
 *
 *****************************************************************************/

module.exports = {
  user          : "hr",
  password      : "hr",
  connectString : "localhost:1522/orcl12c"
};
