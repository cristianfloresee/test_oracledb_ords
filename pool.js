var oracledb = require('oracledb');
var connectionPool;

//createPool is invoked in a separate test file (not shown)
function createPool(callback) {
    oracledb.createPool(
        {
            user: "hr",
            password: "hr",
            connectString: "localhost:1522/orcl12c",
            poolMin: 2,
            poolMax: 20,
            poolIncrement: 2,
            poolTimeout: 120
        },
        function (err, pool) {
            if (err) throw err;

            connectionPool = pool;
            console.log("\npool created...");

            callback();
        }
    );
}

module.exports.createPool = createPool;

function getPool() {
    return connectionPool;
}

module.exports.getPool = getPool;