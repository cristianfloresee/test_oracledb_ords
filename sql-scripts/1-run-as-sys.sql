/******************************************************************************
 * NAME
 *   1-run-as-sys.sql
 *
 * DESCRIPTION
 *  Este archivo establece las concesiones y los privilegios necesarios para que el esquema HR 
 *  realice registros CQN. La red ACL permite que HR se conecte a cualquier parte. 
 *  Para una ACL menos privilegiada, consulte el siguiente código de ejemplo de la 
 *  documentación de Oracle Application Express:
 *  https://docs.oracle.com/cd/E37097_01/install.42/e35123/otn_install.htm#HTMIG400
 *
 *****************************************************************************/

GRANT EXECUTE ON UTL_HTTP to HR;
GRANT EXECUTE ON DBMS_CQ_NOTIFICATION TO HR; 
GRANT CHANGE NOTIFICATION TO HR;

ALTER SYSTEM SET "JOB_QUEUE_PROCESSES"=4;


DECLARE

    acl_path VARCHAR2(4000);
  
BEGIN

    SELECT acl 
    INTO acl_path 
    FROM dba_network_acls
    WHERE host = '*' 
        AND lower_port IS NULL 
        AND upper_port IS NULL;
    
    IF dbms_network_acl_admin.check_privilege(acl_path, 'HR', 'connect') IS NULL 
    THEN
        dbms_network_acl_admin.add_privilege(acl_path, 'HR', TRUE, 'connect');
    END IF;
 
EXCEPTION

    WHEN NO_DATA_FOUND 
    THEN
        dbms_network_acl_admin.create_acl(
            'power_users.xml',
            'ACL that lets power users to connect to everywhere',
            'HR', 
            TRUE, 
            'connect'
        );
        
        dbms_network_acl_admin.assign_acl('power_users.xml','*');
  
END;
/

COMMIT;