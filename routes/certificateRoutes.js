const express = require('express');
const path = require('path');

const auth = require('../middleware/auth');
const db = require('../config/db');

const generateCertificateId =
    require('../utils/certificateIdGenerator');

const generateHash =
    require('../utils/hashGenerator');

const generatePDF =
    require('../utils/pdfGenerator');

const router = express.Router();


// Create Certificate Page
router.get('/create-certificate', auth, (req, res) => {

    res.render('createCertificate');

});


// Save Certificate
router.post('/create-certificate', auth, (req, res) => {

    const {
        student_name,
        course_name,
        issue_date
    } = req.body;

    const getLastBlock =
        `SELECT *
         FROM certificates
         ORDER BY block_number DESC
         LIMIT 1`;

    db.query(getLastBlock, (err, results) => {

        if (err) {
            return res.send('Database Error');
        }

        let blockNumber = 1;
        let previousHash = '0000';

        if (results.length > 0) {

            blockNumber =
                results[0].block_number + 1;

            previousHash =
                results[0].current_hash;
        }

        const certificateId =
            generateCertificateId(blockNumber);

        const currentHash =
            generateHash(
                certificateId,
                student_name,
                course_name,
                issue_date,
                previousHash
            );

        const insertQuery =
    `INSERT INTO certificates
    (
        block_number,
        certificate_id,
        student_name,
        course_name,
        issue_date,
        current_hash,
        previous_hash,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(
            insertQuery,
           [
    blockNumber,
    certificateId,
    student_name,
    course_name,
    issue_date,
    currentHash,
    previousHash,
    'VALID'
],
            (err, result) => {

                if (err) {
                    return res.send(err);
                }

                generatePDF({
                    certificate_id: certificateId,
                    student_name,
                    course_name,
                    issue_date
                });

                res.redirect('/certificates');

            }
        );

    });

});


// Certificate List + Search
router.get('/certificates', auth, (req, res) => {

    const search = req.query.search || '';

    let query;
    let values = [];

    if (search) {

        query =
            `SELECT *
             FROM certificates
             WHERE certificate_id LIKE ?
             OR student_name LIKE ?
             ORDER BY block_number DESC`;

        values = [
            `%${search}%`,
            `%${search}%`
        ];

    } else {

        query =
            `SELECT *
             FROM certificates
             ORDER BY block_number DESC`;

    }

    db.query(query, values, (err, results) => {

        if (err) {
            return res.send('Database Error');
        }

        res.render(
            'certificateList',
            {
                certificates: results,
                search: search
            }
        );

    });

});


// Certificate Details
router.get('/certificate/:id', auth, (req, res) => {

    const id = req.params.id;

    const query =
        `SELECT *
         FROM certificates
         WHERE id = ?`;

    db.query(query, [id], (err, results) => {

        if (err) {
            return res.send('Database Error');
        }

        if (results.length === 0) {
            return res.send('Certificate Not Found');
        }

        res.render(
            'certificateDetails',
            {
                certificate: results[0]
            }
        );

    });

});


// Download PDF
router.get('/download/:certificateId', auth, (req, res) => {

    const filePath = path.join(
        __dirname,
        '../certificates/generated_pdfs',
        `${req.params.certificateId}.pdf`
    );

    res.download(filePath);

});

// Blockchain Visualization
router.get('/blockchain', auth, (req, res) => {

    const query =
        `SELECT *
         FROM certificates
         ORDER BY block_number DESC`;

    db.query(query, (err, results) => {

        if (err) {
            return res.send('Database Error');
        }

        res.render(
            'blockchain',
            {
                blocks: results
            }
        );

    });

});

// Validate Blockchain
router.get('/validate-blockchain', auth, (req, res) => {

    const query =
        `SELECT
            *,
            DATE_FORMAT(issue_date,'%Y-%m-%d') AS hash_date
         FROM certificates
         ORDER BY block_number ASC`;

    db.query(query, (err, blocks) => {

        if (err) {
            return res.send('Database Error');
        }

        let valid = true;
        let errorMessage = '';

        for (let i = 0; i < blocks.length; i++) {

            const block = blocks[i];

            // Recalculate current hash
            const recalculatedHash =
                generateHash(
                    block.certificate_id,
                    block.student_name,
                    block.course_name,
                    block.hash_date,
                    block.previous_hash
                );

            // Check stored hash
            if (
                recalculatedHash !==
                block.current_hash
            ) {

                valid = false;

                errorMessage =
                    `Hash mismatch in Block ${block.block_number}`;

                break;
            }

            // Check blockchain links
            if (i > 0) {

                if (
                    block.previous_hash !==
                    blocks[i - 1].current_hash
                ) {

                    valid = false;

                    errorMessage =
                        `Broken chain at Block ${block.block_number}`;

                    break;
                }

            }

        }

        res.render(
            'validateBlockchain',
            {
                valid,
                totalBlocks: blocks.length,
                errorMessage
            }
        );

    });

});


router.get('/revoke-certificate/:id', auth, (req, res) => {

    const id = req.params.id;

    const query =
        `UPDATE certificates
         SET status = 'REVOKED'
         WHERE id = ?`;

    db.query(query, [id], (err) => {

        if (err) {
            return res.send('Database Error');
        }

        res.redirect('/certificates');

    });

});

module.exports = router;