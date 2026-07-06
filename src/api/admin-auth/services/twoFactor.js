"use strict";

const speakeasy = require("speakeasy");
const { encrypt, decrypt } = require("./crypto");

function generateSecret(email) {

    return speakeasy.generateSecret({

        name: `Keyzoo Admin (${email})`,

        issuer: "Keyzoo",

        length: 20,

    });

}

function verifyToken(secret, token) {

    return speakeasy.totp.verify({

        secret,

        encoding: "base32",

        token,

        window: 1,

    });

}

function encryptSecret(secret) {

    return encrypt(secret);

}

function decryptSecret(secret) {

    return decrypt(secret);

}

module.exports = {

    generateSecret,

    verifyToken,

    encryptSecret,

    decryptSecret,

};