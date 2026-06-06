function generateCertificateId(blockNumber) {

    const year = new Date().getFullYear();

    const number = String(blockNumber).padStart(3, '0');

    return `CERT${year}-${number}`;
}

module.exports = generateCertificateId;