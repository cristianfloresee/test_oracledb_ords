

'use strict'

//var performance  = require('perf_hooks');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');
var oracledb = require('oracledb');

var app;
var httpServer;

var pool = require('./pool');
var async = require('async');
var dateFormat = 'DD-MON-YYYY';

initWebServer();

function initWebServer() {
    app = express();
    httpServer = http.Server(app);

    app.use(bodyParser.urlencoded({ extended: false }));

    //Create 2 static file end points, 1 for public and 1 for bower_components
    app.use('/', serveStatic(__dirname + '/public'));
    app.use('/vendor', serveStatic(__dirname + '/bower_components'));

    //CREATE ENDPOINTS FOR THE APPLICATION
    app.get('/api/oracledb', throwRequests);


    httpServer.listen(3000, ()=> {
        console.log('Webserver listening on localhost:3000');
    });
}

//FUNCTIONS
function throwRequests(req, res){
    console.time('throwRequests');
    pool.createPool(()=>{
        console.log("\npool created...");
        let num_queries = 0;
        for(let i=0;i<10;i++){ //REPEAT
            for(let j=10;j<50;j+=10){ //DEPARTMENTS
                getDepartmentORCL(j, ()=>{ 
                    num_queries++;
                    console.log(`query: ${num_queries}\ndepartment_id: ${j} -> round: ${i}`);
                    if(num_queries === 40)console.timeEnd('throwRequests');
                });
            }
        }
    });
}
    



function getDepartmentORDS(departmentId, callback) {
    var department = {};
    var employees = [];
    var empMap = {};
    var jobHistory = [];


    //CREO LA CONEXIÓN
    pool.getPool().getConnection(
        function (err, connection) {
            if (err) {
                throw err;
            }

            async.parallel(
                [
                    //FUNCION
                    function (callback) {
                        connection.execute(
                            'select dept.department_id, \n' +
                            '    dept.department_name, \n' +
                            '    loc.location_id, \n' +
                            '    loc.street_address, \n' +
                            '    loc.postal_code, \n' +
                            '    ctry.country_id, \n' +
                            '    ctry.country_name, \n' +
                            '    ctry.region_id, \n' +
                            '    mgr.employee_id, \n' +
                            '    mgr.first_name || \' \' || mgr.last_name, \n' +
                            '    mgr.salary, \n' +
                            '    mgr_job.job_id, \n' +
                            '    mgr_job.job_title, \n' +
                            '    mgr_job.min_salary, \n' +
                            '    mgr_job.max_salary \n' +
                            'from departments dept \n' +
                            'join locations loc \n' +
                            '    on dept.location_id = loc.location_id \n' +
                            'join countries ctry \n' +
                            '    on loc.country_id = ctry.country_id \n' +
                            'left join employees mgr \n' +
                            '    on dept.manager_id = mgr.employee_id \n' +
                            'left join jobs mgr_job \n ' +
                            '    on mgr.job_id = mgr_job.job_id \n' +
                            'where dept.department_id = :department_id',
                            {
                                department_id: departmentId
                            },
                            function (err, results) {
                                var deptRow;

                                if (err) {
                                    callback(err);
                                    return;
                                }

                                deptRow = results.rows[0];

                                department.id = deptRow[0];
                                department.name = deptRow[1];

                                department.location = {};
                                department.location.id = deptRow[2];
                                department.location.streetAddress = deptRow[3];
                                department.location.postalCode = deptRow[4];

                                department.location.country = {};
                                department.location.country.id = deptRow[5];
                                department.location.country.name = deptRow[6];
                                department.location.country.regionId = deptRow[7];

                                department.manager = {};

                                if (deptRow[8]) {
                                    department.manager.id = deptRow[8];
                                    department.manager.name = deptRow[9];
                                    department.manager.salary = deptRow[10];

                                    department.manager.job = {};
                                    department.manager.job.id = deptRow[11];
                                    department.manager.job.title = deptRow[12];
                                    department.manager.job.minSalary = deptRow[13];
                                    department.manager.job.maxSalary = deptRow[14];
                                }

                                callback(null);
                            }
                        );
                    },
                    //FUNCION QUERY
                    function (callback) {
                        connection.execute(
                            'select employee_id, \n' +
                            '   first_name || \' \' || last_name, \n' +
                            '   case when hire_date < to_date(\'01-01-2005\', \'DD-MM-YYYY\') then 1 else 0 end is_senior, ' +
                            '   commission_pct \n' +
                            'from employees \n' +
                            'where department_id = :department_id',
                            {
                                department_id: departmentId
                            },
                            function (err, results) {
                                var empRows;

                                if (err) {
                                    callback(err);
                                    return;
                                }

                                empRows = results.rows;

                                empRows.forEach(function (empRow) {
                                    var emp = {};

                                    emp.id = empRow[0];
                                    emp.name = empRow[1];
                                    emp.isSenior = empRow[2] === 1; //conversion of 1 or 0 to Boolean
                                    emp.commissionPct = empRow[3];
                                    emp.jobHistory = [];

                                    employees.push(emp);

                                    empMap[emp.id] = emp;
                                });

                                callback(null);
                            }
                        );
                    },
                    //FUNCION QUERY
                    function (callback) {
                        connection.execute(
                            'select employee_id, \n' +
                            '    job_id, \n' +
                            '    department_id, \n' +
                            '    to_char(start_date, \'' + dateFormat + '\'), \n' +
                            '    to_char(end_date, \'' + dateFormat + '\') \n' +
                            'from job_history \n' +
                            'where employee_id in ( \n' +
                            '    select employee_id \n ' +
                            '    from employees \n' +
                            '    where department_id = :department_id \n' +
                            ')',
                            {
                                department_id: departmentId
                            },
                            function (err, results) {
                                var jobRows;

                                if (err) {
                                    callback(err);
                                    return;
                                }

                                jobRows = results.rows;

                                jobRows.forEach(function (jobRow) {
                                    var job = {};

                                    job.employeeId = jobRow[0];
                                    job.id = jobRow[1];
                                    job.departmentId = jobRow[2];
                                    job.startDate = jobRow[3];
                                    job.endDate = jobRow[4];

                                    jobHistory.push(job);
                                });

                                callback(null);
                            }
                        );
                    }
                ],

                function (err, results) {
                    if (err) throw err;

                    department.employees = employees;

                    jobHistory.forEach(function (job) {
                        empMap[job.employeeId].jobHistory.push(job);
                        delete job.employeeId;
                    });

                    connection.release(function (err) {
                        if (err) {
                            console.error(err);
                        }

                        callback(null, department);
                    });
                }
            );
        }
    );

    //FIN DE CONNECION POOL
}




function getDepartmentORCL(departmentId, callback) {
    var department = {};
    var employees = [];
    var empMap = {};
    var jobHistory = [];
    //console.log("init")

    //CREO LA CONEXIÓN
    pool.getPool().getConnection(
        function (err, connection) {
            if (err) throw err;
            
            async.parallel(
                [
                    //FUNCION
                    function (callback) {
                        connection.execute(
                            'select dept.department_id, \n' +
                            '    dept.department_name, \n' +
                            '    loc.location_id, \n' +
                            '    loc.street_address, \n' +
                            '    loc.postal_code, \n' +
                            '    ctry.country_id, \n' +
                            '    ctry.country_name, \n' +
                            '    ctry.region_id, \n' +
                            '    mgr.employee_id, \n' +
                            '    mgr.first_name || \' \' || mgr.last_name, \n' +
                            '    mgr.salary, \n' +
                            '    mgr_job.job_id, \n' +
                            '    mgr_job.job_title, \n' +
                            '    mgr_job.min_salary, \n' +
                            '    mgr_job.max_salary \n' +
                            'from departments dept \n' +
                            'join locations loc \n' +
                            '    on dept.location_id = loc.location_id \n' +
                            'join countries ctry \n' +
                            '    on loc.country_id = ctry.country_id \n' +
                            'left join employees mgr \n' +
                            '    on dept.manager_id = mgr.employee_id \n' +
                            'left join jobs mgr_job \n ' +
                            '    on mgr.job_id = mgr_job.job_id \n' +
                            'where dept.department_id = :department_id',
                            {
                                department_id: departmentId
                            },
                            function (err, results) {
                                var deptRow;
                                //console.log("\n\nquery 1:\n", results);
                                if (err) {
                                    callback(err);
                                    return;
                                }

                                deptRow = results.rows[0];

                                department.id = deptRow[0];
                                department.name = deptRow[1];

                                department.location = {};
                                department.location.id = deptRow[2];
                                department.location.streetAddress = deptRow[3];
                                department.location.postalCode = deptRow[4];

                                department.location.country = {};
                                department.location.country.id = deptRow[5];
                                department.location.country.name = deptRow[6];
                                department.location.country.regionId = deptRow[7];

                                department.manager = {};

                                if (deptRow[8]) {
                                    department.manager.id = deptRow[8];
                                    department.manager.name = deptRow[9];
                                    department.manager.salary = deptRow[10];

                                    department.manager.job = {};
                                    department.manager.job.id = deptRow[11];
                                    department.manager.job.title = deptRow[12];
                                    department.manager.job.minSalary = deptRow[13];
                                    department.manager.job.maxSalary = deptRow[14];
                                }

                                callback(null);
                            }
                        );
                    },
                    //FUNCION QUERY
                    function (callback) {
                        connection.execute(
                            'select employee_id, \n' +
                            '   first_name || \' \' || last_name, \n' +
                            '   case when hire_date < to_date(\'01-01-2005\', \'DD-MM-YYYY\') then 1 else 0 end is_senior, ' +
                            '   commission_pct \n' +
                            'from employees \n' +
                            'where department_id = :department_id',
                            {
                                department_id: departmentId
                            },
                            function (err, results) {
                                var empRows;
                                //console.log("\n\nquery 2:\n", results);
                                if (err) {
                                    callback(err);
                                    return;
                                }

                                empRows = results.rows;

                                empRows.forEach(function (empRow) {
                                    var emp = {};

                                    emp.id = empRow[0];
                                    emp.name = empRow[1];
                                    emp.isSenior = empRow[2] === 1; //conversion of 1 or 0 to Boolean
                                    emp.commissionPct = empRow[3];
                                    emp.jobHistory = [];

                                    employees.push(emp);

                                    empMap[emp.id] = emp;
                                });

                                callback(null);
                            }
                        );
                    },
                    //FUNCION QUERY
                    function (callback) {
                        connection.execute(
                            'select employee_id, \n' +
                            '    job_id, \n' +
                            '    department_id, \n' +
                            '    to_char(start_date, \'' + dateFormat + '\'), \n' +
                            '    to_char(end_date, \'' + dateFormat + '\') \n' +
                            'from job_history \n' +
                            'where employee_id in ( \n' +
                            '    select employee_id \n ' +
                            '    from employees \n' +
                            '    where department_id = :department_id \n' +
                            ')',
                            {
                                department_id: departmentId
                            },
                            function (err, results) {
                                var jobRows;
                                //console.log("\n\nquery 3:\n", results);
                                if (err) {
                                    callback(err);
                                    return;
                                }

                                jobRows = results.rows;

                                jobRows.forEach(function (jobRow) {
                                    var job = {};

                                    job.employeeId = jobRow[0];
                                    job.id = jobRow[1];
                                    job.departmentId = jobRow[2];
                                    job.startDate = jobRow[3];
                                    job.endDate = jobRow[4];

                                    jobHistory.push(job);
                                });

                                callback(null);
                            }
                        );
                    }
                ],

                function (err, results) {

                    //console.log("\n\nfinal: ", results);
                    if (err) throw err;

                    department.employees = employees;

                    jobHistory.forEach(function (job) {
                        empMap[job.employeeId].jobHistory.push(job);
                        delete job.employeeId;
                    });

                    connection.release(function (err) {
                        if (err) console.error(err);
                        //console.log("reds");
                        callback(department); //AQUI
                    });
                }
            );
        }
    );

    //FIN DE CONNECION POOL
}
