const express = require('express');
const db = require('../config/db');

const generateHash =
    require('../utils/hashGenerator');

const router = express.Router();


// Verification Page
router.get('/verify', (req, res) => {

    res.render('verifyCertificate', {
        result: null
    });

});


// Verification Process
router.post('/verify', (req, res) => {

    const { certificate_id } = req.body;

    const query = `
        SELECT
            *,
            DATE_FORMAT(issue_date,'%Y-%m-%d') AS hash_date
        FROM certificates
        WHERE certificate_id = ?
    `;

    db.query(query, [certificate_id], (err, results) => {

        if (err) {
            console.error(err);
            return res.send('Database Error');
        }

        // Certificate Not Found
        if (results.length === 0) {

            return res.render(
                'verifyCertificate',
                {
                    result: {
                        status: 'NOT_FOUND'
                    }
                }
            );

        }

        const certificate = results[0];

        // Check Revocation Status
        if (certificate.status === 'REVOKED') {

            return res.render(
                'verifyCertificate',
                {
                    result: {
                        status: 'REVOKED',
                        certificate
                    }
                }
            );

        }

        // Recalculate Current Hash
        const recalculatedHash =
            generateHash(
                certificate.certificate_id,
                certificate.student_name,
                certificate.course_name,
                certificate.hash_date,
                certificate.previous_hash
            );

        // Check Certificate Integrity
        if (
            recalculatedHash !==
            certificate.current_hash
        ) {

            return res.render(
                'verifyCertificate',
                {
                    result: {
                        status: 'TAMPERED'
                    }
                }
            );

        }

        // Verify Blockchain Chain Integrity
        const previousBlockQuery = `
            SELECT current_hash
            FROM certificates
            WHERE block_number = ?
        `;

        const previousBlockNumber =
            certificate.block_number - 1;

        // Genesis Block
        if (previousBlockNumber <= 0) {

            return res.render(
                'verifyCertificate',
                {
                    result: {
                        status: 'VALID',
                        certificate
                    }
                }
            );

        }

        db.query(
            previousBlockQuery,
            [previousBlockNumber],
            (err, previousResults) => {

                if (err) {
                    console.error(err);
                    return res.send('Database Error');
                }

                if (previousResults.length === 0) {

                    return res.render(
                        'verifyCertificate',
                        {
                            result: {
                                status: 'CHAIN_BROKEN'
                            }
                        }
                    );

                }

                const previousHash =
                    previousResults[0].current_hash;

                if (
                    previousHash !==
                    certificate.previous_hash
                ) {

                    return res.render(
                        'verifyCertificate',
                        {
                            result: {
                                status: 'CHAIN_BROKEN'
                            }
                        }
                    );

                }

                return res.render(
                    'verifyCertificate',
                    {
                        result: {
                            status: 'VALID',
                            certificate
                        }
                    }
                );

            }
        );

    });

});

module.exports = router;