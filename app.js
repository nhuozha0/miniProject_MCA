const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./config/db');
const auth = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
    secret: 'certificate_secret_key',
    resave: false,
    saveUninitialized: false
}));

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static('public'));

// Routes
app.use('/', authRoutes);
app.use('/', certificateRoutes);
app.use('/', verifyRoutes);

// Home Route
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Dashboard
app.get('/dashboard', auth, (req, res) => {

    const statsQuery = `
        SELECT
            COUNT(*) AS totalCertificates,
            SUM(CASE WHEN status='VALID' THEN 1 ELSE 0 END) AS validCertificates,
            SUM(CASE WHEN status='REVOKED' THEN 1 ELSE 0 END) AS revokedCertificates,
            MAX(block_number) AS latestBlock
        FROM certificates
    `;

    db.query(statsQuery, (err, results) => {

        if (err) {
            return res.send('Database Error');
        }

        const stats = results[0];

        res.render('dashboard', {

            totalCertificates:
                stats.totalCertificates || 0,

            validCertificates:
                stats.validCertificates || 0,

            revokedCertificates:
                stats.revokedCertificates || 0,

            latestBlock:
                stats.latestBlock || 0,

            blockchainHealthy: true

        });

    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});