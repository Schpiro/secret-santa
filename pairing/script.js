let participants = [];
let exclusions = [];

function addParticipant() {
    const input = document.getElementById('participantInput');
    const name = input.value.trim();
    
    if (name === '') {
        alert('Please enter a name');
        return;
    }
    
    if (participants.includes(name)) {
        alert('This participant already exists');
        return;
    }
    
    participants.push(name);
    input.value = '';
    updateParticipantsList();
    updateExclusionOptions();
}

function removeParticipant(name) {
    participants = participants.filter(p => p !== name);
    // Remove related exclusions
    exclusions = exclusions.filter(ex => ex.person1 !== name && ex.person2 !== name);
    updateParticipantsList();
    updateExclusionOptions();
}

function updateParticipantsList() {
    const list = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        list.innerHTML = '<div class="empty-message">No participants yet. Add some names above!</div>';
        document.getElementById('pairBtn').disabled = true;
    } else {
        list.innerHTML = participants.map(p => 
            `<div class="participant-tag">
                ${p}
                <button class="remove-btn" onclick="removeParticipant('${p}')">×</button>
            </div>`
        ).join('');
        document.getElementById('pairBtn').disabled = participants.length < 2;
    }
    
    // Show/hide add exclusion button
    document.getElementById('addExclusionBtn').style.display = 
        participants.length >= 2 ? 'block' : 'none';
}

function addExclusion() {
    exclusions.push({ person1: null, person2: null });
    updateExclusionOptions();
}

function removeExclusion(index) {
    exclusions.splice(index, 1);
    updateExclusionOptions();
}

function updateExclusion(index, field, value) {
    exclusions[index][field] = value;
}

function updateExclusionOptions() {
    const list = document.getElementById('exclusionsList');
    
    if (participants.length < 2) {
        list.innerHTML = '<div class="empty-message">Add at least 2 participants to set exclusions.</div>';
        return;
    }
    
    if (exclusions.length === 0) {
        list.innerHTML = '<div class="empty-message">No exclusions set. Click "Add Exclusion" to add one.</div>';
        return;
    }
    
    list.innerHTML = exclusions.map((ex, index) => {
        const options = participants.map(p => 
            `<option value="${p}" ${ex.person1 === p || ex.person2 === p ? 'selected' : ''}>${p}</option>`
        ).join('');
        
        return `
            <div class="exclusion-row">
                <select onchange="updateExclusion(${index}, 'person1', this.value)">
                    <option value="">Select person...</option>
                    ${options}
                </select>
                <span class="exclusion-arrow">⟷</span>
                <select onchange="updateExclusion(${index}, 'person2', this.value)">
                    <option value="">Select person...</option>
                    ${options}
                </select>
                <button class="btn-danger" onclick="removeExclusion(${index})">Remove</button>
            </div>
        `;
    }).join('');
}

function generatePairings() {
    if (participants.length < 2) {
        alert('You need at least 2 participants');
        return;
    }

    // Build exclusion map (bidirectional)
    const exclusionMap = new Map();
    participants.forEach(p => exclusionMap.set(p, new Set()));
    
    exclusions.forEach(ex => {
        if (ex.person1 && ex.person2 && ex.person1 !== ex.person2) {
            exclusionMap.get(ex.person1).add(ex.person2);
            exclusionMap.get(ex.person2).add(ex.person1);
        }
    });

    // Try to generate valid pairings
    const result = findValidPairing(participants, exclusionMap);
    
    if (result === null) {
        document.getElementById('results').style.display = 'block';
        document.getElementById('pairingsList').innerHTML = 
            '<div class="error-message">❌ Could not generate valid pairings with the current exclusions. Please review your exclusions and try again.</div>';
        return;
    }

    // Log all pairings to console for verification
    /*
    console.log('=== Secret Santa Pairings ===');
    result.forEach(pair => {
        console.log(`${pair.giver} → ${pair.receiver}`);
    });
    console.log('=============================');
    */
    // Display results
    displayResults(result);
}

function findValidPairing(people, exclusionMap, maxAttempts = 1000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const givers = [...people];
        const receivers = [...people];
        const pairings = [];
        const pairingMap = new Map(); // Track who gives to whom
        let valid = true;

        // Shuffle receivers
        for (let i = receivers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
        }

        // Try to create pairings
        for (let i = 0; i < givers.length; i++) {
            const giver = givers[i];
            const receiver = receivers[i];
            
            // Check if pairing is valid
            // 1. Person can't give to themselves
            // 2. Person can't give to someone in their exclusion list
            // 3. No reciprocal pairs (if A gives to B, B can't give to A)
            if (giver === receiver || 
                exclusionMap.get(giver).has(receiver) ||
                pairingMap.get(receiver) === giver) {
                valid = false;
                break;
            }
            
            pairingMap.set(giver, receiver);
            pairings.push({ giver, receiver });
        }

        if (valid) {
            return pairings;
        }
    }

    return null; // Could not find valid pairing
}

function encodeData(giver, receiver) {
    const data = JSON.stringify({ giver, receiver });
    return btoa(data); // Base64 encode
}

function generateLink(giver, receiver) {
    const encoded = encodeData(giver, receiver);
    const baseUrl = window.location.origin + window.location.pathname.replace('pairing/index.html', 'lookup/index.html');
    return `${baseUrl}?data=${encoded}`;
}

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '✓ Copied!';
        buttonElement.style.background = '#28a745';
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy link');
    });
}

function displayResults(pairings) {
    const resultsDiv = document.getElementById('results');
    const pairingsListDiv = document.getElementById('pairingsList');
    
    resultsDiv.style.display = 'block';
    pairingsListDiv.innerHTML = pairings.map((pair, index) => {
        const link = generateLink(pair.giver, pair.receiver);
        const escapedLink = link.replace(/'/g, "\\'");
        return `
            <div class="pairing-item" style="animation-delay: ${index * 0.1}s">
                <div class="pairing-info">
                    <strong>${pair.giver}</strong>
                    <span class="arrow">🎁</span>
                </div>
                <div class="link-container">
                    <input type="text" class="link-input" value="${link}" readonly onclick="this.select()">
                    <button class="copy-btn" onclick="copyToClipboard('${escapedLink}', this)">📋 Copy Link</button>
                </div>
            </div>
        `;
    }).join('');
}

