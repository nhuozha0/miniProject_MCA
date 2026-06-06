const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {

    const { username, password } = req.body;

    const sql = 'SELECT * FROM admins WHERE username = ?';

    db.query(sql, [username], (err, results) => {

        if (err) {
            return res.send('Database Error');
        }

        if (results.length === 0) {
            return res.send('Invalid Username');
        }

        const admin = results[0];

        bcrypt.compare(
            password,
            admin.password_hash,
            (err, match) => {

                if (!match) {
                    return res.send('Invalid Password');
                }

                req.session.adminId = admin.id;

                res.redirect('/dashboard');
            }
        );

    });

});

// Logout Route
router.get('/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/login');
    });

});

module.exports = router;