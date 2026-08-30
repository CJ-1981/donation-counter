const fs = require('fs');

const OPENING_QUOTES = new Set(['"', "'", '“', '„', '‟', '‘', '‚', '‛']);
const CLOSING_QUOTES = new Set(['"', "'", '”', '„', '‟', '’', '‚', '‛']);
const ALL_QUOTES = new Set([...OPENING_QUOTES, ...CLOSING_QUOTES]);

function isQuotePair(open, close) {
    if (open === '"' && (close === '"' || close === '”')) return true;
    if (open === "'" && (close === "'" || close === '’')) return true;
    if (open === '“' && (close === '”' || close === '“' || close === '"')) return true;
    if (open === '‘' && (close === '’' || close === '‘' || close === "'")) return true;
    return open === close;
}

function parseNamesInput(input) {
    if (!input || !input.trim()) return [];
    const names = [];
    let current = '';
    let activeQuote = null;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (!activeQuote) {
            if (OPENING_QUOTES.has(char) && (current.trim().length === 0 || i === 0 || input[i - 1] === ',' || input[i - 1] === ' ')) {
                activeQuote = char;
                current += char;
            } else if (char === ',') {
                names.push(current);
                current = '';
            } else {
                current += char;
            }
        } else {
            current += char;
            if (isQuotePair(activeQuote, char)) {
                activeQuote = null;
            }
        }
    }

    if (current.length > 0) {
        names.push(current);
    }

    return names
        .map(n => {
            let s = n.trim();
            while (s.length >= 2) {
                const first = s[0];
                const last = s[s.length - 1];
                if (OPENING_QUOTES.has(first) && CLOSING_QUOTES.has(last) && isQuotePair(first, last)) {
                    s = s.slice(1, -1).trim();
                } else if (ALL_QUOTES.has(first) && ALL_QUOTES.has(last)) {
                    s = s.slice(1, -1).trim();
                } else {
                    break;
                }
            }
            while (s.length > 0 && ALL_QUOTES.has(s[0])) {
                s = s.slice(1).trim();
            }
            while (s.length > 0 && ALL_QUOTES.has(s[s.length - 1])) {
                s = s.slice(0, -1).trim();
            }
            return s;
        })
        .filter(n => n.length > 0);
}

function processMembers(existingJson, namesInput) {
    let existing = [];
    if (existingJson && existingJson.trim()) {
        try {
            const parsed = JSON.parse(existingJson);
            if (Array.isArray(parsed)) {
                existing = parsed;
            }
        } catch (e) {
            console.warn('Warning: existing MEMBERS secret is not a valid JSON array. Starting with an empty list.');
        }
    }

    const newNames = parseNamesInput(namesInput);

    const existingSet = new Set(existing);
    const addedNames = [];

    for (const name of newNames) {
        if (!existingSet.has(name)) {
            existingSet.add(name);
            existing.push(name);
            addedNames.push(name);
        }
    }

    return {
        updatedMembers: existing,
        updatedJson: JSON.stringify(existing),
        addedNames,
        addedCount: addedNames.length
    };
}

if (require.main === module) {
    const existingJson = process.env.EXISTING_MEMBERS || '[]';
    const namesInput = process.env.NEW_NAMES || '';

    const result = processMembers(existingJson, namesInput);

    console.log(`[add-members] Added ${result.addedCount} new member(s): ${result.addedNames.join(', ')}`);
    console.log(`[add-members] Total member count is now ${result.updatedMembers.length}`);

    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput) {
        fs.appendFileSync(githubOutput, `updated_json=${result.updatedJson}\n`);
        fs.appendFileSync(githubOutput, `added_count=${result.addedCount}\n`);
    } else {
        console.log('Updated JSON:', result.updatedJson);
    }
}

module.exports = { processMembers, parseNamesInput };
