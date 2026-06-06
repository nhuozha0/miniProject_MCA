const bcrypt = require('bcrypt');
const db = require('./config/db');

const username = 'admin';
const password = 'admin123';

bcrypt.hash(password, 10, (err, hash) => {

    if (err) {
        console.log(err);
        return;
    }

    const sql =
        'INSERT INTO admins (username, password_hash) VALUES (?, ?)';

    db.query(sql, [username, hash], (err, result) => {

        if (err) {
            console.log(err);
        } else {
            console.log('Admin Created Successfully');
        }

        process.exit();
    });

});