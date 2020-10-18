var parameter = require("../parameter.json")
class Database {
    constructor() {
        var mysql = require("mysql")
        this.conn = mysql.createConnection({
            host: parameter.db.host,
            user: parameter.db.user,
            password: parameter.db.password,
            database: parameter.db.database
        })
        this.hashedId = ""
    }

    checkUsername(req, callback) {
        this.conn.query(`SELECT * FROM user WHERE username = "${req.body.username}"`, (err, result) => {
            if (err) throw err
            return callback(result)
        })
    }

    checkEmail(req, callback) {
        this.conn.query(`SELECT * FROM user WHERE email = "${req.body.email}"`, (err, result) => {
            if (err) throw err
            return callback(result)
        })
    }
    
    registration(req, password) {
        this.generateNewHashedId(`user`)
        var sql = `INSERT INTO user (id, username, email, password, email_verified) VALUES (
            "${this.hashedId}",
            "${req.body.username}",
            "${req.body.email}",
            "${password}",
            "0")`
        this.conn.query(sql)
    }

    generateNewHashedId(table) {
        this.hashedId = require("crypto").randomBytes(10).toString("hex")
        var sql = `SELECT COUNT(*) AS count FROM ${table} WHERE id = "${this.hashedId}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            else if (result[0].count == 1) this.generateNewHashedId(table);
        })
    }

    sendEmailVerification(req, callback) {
        var sql = `SELECT id FROM user WHERE username = "${req.body.usernameEmail}" OR email = "${req.body.usernameEmail}" OR username = "${req.body.username}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            /*this.conn.query(`DELETE FROM email_verification WHERE user_id = "${result[0].id}"`, (err) => {
                if (err) throw err*/
                this.generateNewHashedId(`email_verification`)
                var sql = `INSERT INTO email_verification (id, user_id, expiration) VALUES ("${this.hashedId}", "${result[0].id}", NOW() + INTERVAL 30 day)`
                this.conn.query(sql, (err) => {
                    if (err) throw err
                    return callback(this.hashedId)
                })
            //})
        })
    }

    emailVerification(req, callback) {
        var sql = `SELECT u.id, email_verified FROM user u
        LEFT JOIN email_verification e ON u.id = e.user_id
        WHERE e.id = "${req.body.id}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            else if (result.length == 0) return callback({ message: "This e-mail verification is expired."})
            else {
                var sql = `UPDATE user SET email_verified = "1" WHERE id = "${result.id}"`
                this.conn.query(sql)
                this.conn.query(`DELETE FROM email_verification WHERE user_id = "${result.id}"`)
                return callback({ message: "Successful e-mail verification." })
            }
        })
    }

    sendForgotPassword(req, callback) {
        var sql = `SELECT id FROM user WHERE email = "${req.body.email}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            this.conn.query(`DELETE FROM forgot_password WHERE user_id = "${result[0].id}"`, (err) => {
                if (err) throw err
                this.generateNewHashedId(`forgot_password`)
                var sql = `INSERT INTO forgot_password (id, user_id, expiration) VALUES ("${this.hashedId}", "${result[0].id}", NOW() + INTERVAL 7 day)`
                this.conn.query(sql, (err) => {
                    if (err) throw err
                    return callback(this.hashedId)
                })
            })
        })
    }

    checkForgotPasswordId(req, callback) {
        var sql = `SELECT u.id FROM user u LEFT JOIN forgot_password f ON u.id = f.user_id WHERE f.id = "${req.body.id}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            else
                return callback(result)
        })
    }

    forgotPassword(req, password, callback) {
        var sql = `SELECT u.id AS id FROM user u LEFT JOIN forgot_password f ON u.id = f.user_id WHERE f.id = "${req.body.id}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            else if (result.lenght == 0) return callback("expired")
            else {
                var sql = `UPDATE user SET password = "${password}" WHERE id = "${result[0].id}"`
                this.conn.query(sql, () => {
                    this.conn.query(`DELETE FROM forgot_password WHERE id = "${req.body.id}"`)
                    return callback("success")
                })
            }
        })
    }

    login(req, callback) {
        var sql = `SELECT id, password, email_verified FROM user WHERE username = "${req.body.usernameEmail}" OR email = "${req.body.usernameEmail}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            return callback(result)
        })
    }

    getUser(req, callback) {
        var sql = `SELECT id, username, email FROM user WHERE id = "${req.session.userId}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            return callback(result[0])
        })
    }

    getAll(req, callback) {
        var sql = "SELECT * FROM product"
        if (req.query.search != undefined) {
            sql += ` WHERE name LIKE "${req.query.search}%"`
        }
        sql += " ORDER BY name"
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            return callback(result)
        })
    }

    post(req, callback) {
        this.generateNewHashedId(`product`)
        var sql = `INSERT INTO product (id, name, price, availability) VALUES ("${this.hashedId}", "${req.body.name}",${req.body.price}, ${req.body.availability})`
        this.conn.query(sql, (err, result) => {
            if (err)
                return callback({ error: "Ez már benne van az adatbázisban!" })
            return callback({ success: "Sikeres rögzítés!" })
        })
    }

    getOne(req, callback) {
        var sql = `SELECT * FROM product WHERE id = "${req.params.id}"`
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            return callback(result[0])
        })
    }

    put(req, callback) {
        var sql = `UPDATE product SET name = "${req.body.name}", price = ${req.body.price}, availability = ${req.body.availability} WHERE id = "${req.params.id}"`
        this.conn.query(sql, (err, result) => {
            if (err)
                return callback({ error: "Ez már benne van az adatbázisban!" })
            return callback({ success: "Sikeres rögzítés!" })
        })
    }

    delete(req, callback) {
        var sql = `DELETE FROM product WHERE id = "${req.params.id}"`
        this.conn.query(sql, (err, result) => {
            if (err)
                return callback({ error: "Sikertelen törlés!" })
            return callback({ success: "Sikeres törlés!" })
        })
    }

    addFavorite(req) {
        this.generateNewHashedId(`favorite`)
        this.conn.query(`INSERT INTO favorite (id, product_id, user_id) VALUES ("${this.hashedId}", "${req.body.productId}", "${req.session.userId}")`)
    }

    getFavorite(req, callback) {
        var sql = `SELECT f.id "favoriteId", p.name "name", p.price "price", p.availability "availability" FROM favorite f INNER JOIN product p ON f.product_id = p.id WHERE user_id = "${req.session.userId}"`
        if (req.query.search != undefined) {
            sql += ` AND name LIKE "${req.query.search}%"`
        }
        sql += " ORDER BY name"
        this.conn.query(sql, (err, result) => {
            if (err) throw err
            return callback(result)
        })
    }

    removeFavorite(req) {
        this.conn.query(`DELETE FROM favorite WHERE id = "${req.body.id}"`)
    }

    end() {
        this.conn.end()
    }
}

module.exports = Database