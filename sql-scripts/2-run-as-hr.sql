

/******************************************************************************
 * NAME
 *   2-run-as-hr.sql
 *
 * DESCRIPTION
 *  Este archivo crea e inserta algunos ejemplos de datos que son usados por la aplicación. 
 *  También se crea un registro de consulta. Finalmente, se crea el procedimiento que se ejecutará 
 *  cuando se modifiquen los datos. Recuerde cambiar la dirección IP en el procedimiento de 127.0.0.1 
 *  a la dirección IP correcta para el servidor Node.js.
 *
 *****************************************************************************/

DROP TABLE jsao_super_cities;

CREATE TABLE jsao_super_cities (
   id           NUMBER,
   city_name    VARCHAR2(30 BYTE),
   country_name VARCHAR2(20 BYTE),
   votes        NUMBER
);

INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (1, 'New York City', 'USA', 100);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (2, 'Tokyo', 'Japan', 98);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (3, 'Paris', 'France', 99);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (4, 'Barranquilla', 'Colombia', 99);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (5, 'Mexico City', 'Mexico', 95);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (6, 'New Delhi', 'India', 96);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (7, 'Shanghai', 'China', 95);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (8, 'Buenos Aires', 'Argentina', 96);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (9, 'Amsterdam', 'Netherlands', 98);
INSERT INTO jsao_super_cities (id, city_name, country_name, votes) VALUES (10, 'Sao Paulo', 'Brazil', 97);

COMMIT;

DECLARE

   l_reginfo CQ_NOTIFICATION$_REG_INFO;
   l_cursor  SYS_REFCURSOR;
   l_regid   NUMBER;

BEGIN

    l_reginfo := cq_notification$_reg_info (
        'query_callback',
        dbms_cq_notification.qos_query,
        0, 0, 0
    );

    l_regid := dbms_cq_notification.new_reg_start(l_reginfo);

    OPEN l_cursor FOR
        SELECT dbms_cq_notification.cq_notification_queryid,
            id,
            city_name,
            country_name,
            votes
        FROM hr.jsao_super_cities;
    CLOSE l_cursor;

    dbms_cq_notification.reg_end;

END;
/

--The following procedure will be executed when the query results are changed
--Set the IP address in the url param to the IP address where where Node.js is listening
CREATE OR REPLACE PROCEDURE query_callback(
    ntfnds IN CQ_NOTIFICATION$_DESCRIPTOR
)

AS

    l_req  UTL_HTTP.REQ;
    l_resp UTL_HTTP.RESP;

BEGIN

    l_req := utl_http.begin_request(
        url    => '127.0.0.1:3000/orcl12c',
        method => 'GET'
    );

    l_resp := utl_http.get_response(r => l_req);

    utl_http.end_response(r => l_resp);

END;
/