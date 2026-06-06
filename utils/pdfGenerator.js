const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF(certificate) {

    const filePath = path.join(
        __dirname,
        '../certificates/generated_pdfs',
        `${certificate.certificate_id}.pdf`
    );

    const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 0
    });

    doc.pipe(fs.createWriteStream(filePath));

    // Certificate Template Background
    const templatePath = path.join(
        __dirname,
        '../certificates/templates/certificate-template.png'
    );

    doc.image(
        templatePath,
        0,
        0,
        {
            width: 842,
            height: 595
        }
    );

    // Student Name
doc
    .font('Helvetica-Bold')
    .fontSize(30)
    .text(
        certificate.student_name.toUpperCase(),
        140,
        270,
        {
            width: 400,
            align: 'center'
        }
    );

    // Course Name
 doc
    .font('Helvetica')
    .fontSize(26)
    .text(
        certificate.course_name,
        140,
        353,
        {
            width: 400,
            align: 'center'
        }
    );

    // Issue Date
  doc
    .fontSize(12)
    .text(
        certificate.issue_date,
        80,
        485,
        {
            width: 120,
            align: 'center'
        }
    );

    // Certificate ID
    doc
        .fontSize(12)
        .text(
            certificate.certificate_id,
            500,
            485,
            {
                width: 120,
                align: 'center'
            }
        );

    doc.end();
}

module.exports = generatePDF;