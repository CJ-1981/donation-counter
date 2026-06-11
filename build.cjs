#!/usr/bin/env node
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

const PLACEHOLDER = '__ENCRYPTED_MEMBERS_PLACEHOLDER__';
const SOURCE_FILE = path.join(__dirname, 'dist', 'index.html');
const DIST_DIR = path.join(__dirname, 'dist');

function main() {
    const membersJson = process.env.MEMBERS;
    const memberKey = process.env.MEMBER_KEY;

    if (!membersJson || !memberKey) {
        console.error('ERROR: MEMBERS and MEMBER_KEY environment variables are required.');
        process.exit(1);
    }

    let members;
    try {
        members = JSON.parse(membersJson);
        if (!Array.isArray(members) || members.length === 0) {
            throw new Error('MEMBERS must be a non-empty JSON array');
        }
    } catch (e) {
        console.error('ERROR: Invalid MEMBERS format. Must be a valid JSON array string.');
        process.exit(1);
    }

    console.log('[build] Found ' + members.length + ' member(s) to encrypt.');

    const jsonString = JSON.stringify(members);
    const encrypted = CryptoJS.AES.encrypt(jsonString, memberKey).toString();

    if (!encrypted) {
        console.error('ERROR: Encryption failed.');
        process.exit(1);
    }

    console.log('[build] Members encrypted successfully.');

    let html = fs.readFileSync(SOURCE_FILE, 'utf8');

    if (!html.includes(PLACEHOLDER)) {
        console.error('ERROR: Placeholder not found in ' + SOURCE_FILE);
        process.exit(1);
    }

    html = html.replace(PLACEHOLDER, encrypted);

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    const outputFile = path.join(DIST_DIR, 'index.html');
    fs.writeFileSync(outputFile, html, 'utf8');

    console.log('[build] Successfully wrote ' + outputFile);
}

main();
