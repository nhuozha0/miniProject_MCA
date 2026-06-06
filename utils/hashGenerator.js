const crypto = require('crypto');

function generateHash(
    certificateId,
    studentName,
    courseName,
    issueDate,
    previousHash
) {

    const data =
        certificateId +
        studentName +
        courseName +
        issueDate +
        previousHash;

    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
}

module.exports = generateHash;