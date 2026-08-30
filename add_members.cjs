const fs = require('fs');

function parseNamesInput(input) {
    if (!input || !input.trim()) return [];

    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            let item = current.trim();
            if (item.startsWith('"') && item.endsWith('"') && item.length >= 2) {
                item = item.slice(1, -1).trim();
            }
            if (item.length > 0) {
                result.push(item);
            }
            current = '';
        } else {
            current += char;
        }
    }

    let item = current.trim();
    if (item.startsWith('"') && item.endsWith('"') && item.length >= 2) {
        item = item.slice(1, -1).trim();
    }
    if (item.length > 0) {
        result.push(item);
    }

    return result;
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

module.exports = { parseNamesInput, processMembers };
