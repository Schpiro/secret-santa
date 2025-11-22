function createSnowflakes() {
    const snowflakeCount = 50; // Total number of snowflakes
    const snowflakeChars = ['❄', '❅'];
    
    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        
        // Randomly assign size (medium or small only)
        const sizeRandom = Math.random();
        if (sizeRandom < 0.3) {
            snowflake.classList.add('snowflake-medium');
        } else {
            snowflake.classList.add('snowflake-small');
        }
        
        // Random character
        snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
        
        // Random horizontal position (0-100%)
        const left = Math.random() * 100;
        snowflake.style.left = `${left}%`;
        
        // Random animation duration (8-16 seconds for smooth, varied falling)
        const duration = 8 + Math.random() * 8;
        snowflake.style.animationDuration = `${duration}s`;
        
        // Random delay (0 to duration seconds - this ensures continuous falling)
        const delay = Math.random() * duration;
        snowflake.style.animationDelay = `-${delay}s`; // Negative delay starts animation mid-way
        
        document.body.appendChild(snowflake);
    }
}

function decodeData(encoded) {
    try {
        const decoded = atob(encoded);
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

function getDataFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    if (!encodedData) {
        return null;
    }
    
    return decodeData(encodedData);
}

function displaySecretSanta() {
    const data = getDataFromUrl();
    
    if (!data || !data.giver || !data.receiver) {
        // Show error message if no valid data
        document.querySelector('.player-name').textContent = 'Unknown';
        document.querySelector('.recipient-name').textContent = 'Invalid Link';
        document.querySelector('.message-text:last-of-type').textContent = 'This link appears to be invalid. Please contact the organizer.';
        document.querySelector('.closing').style.display = 'none';
        // Hide gift box if invalid
        const giftBox = document.getElementById('giftBox');
        if (giftBox) {
            giftBox.style.display = 'none';
        }
        return;
    }
    
    // Update the card with actual names
    document.querySelector('.player-name').textContent = data.giver;
    document.querySelector('.recipient-name').textContent = data.receiver;
}

function revealRecipient() {
    const giftBox = document.getElementById('giftBox');
    const recipientName = document.querySelector('.recipient-name');
    
    giftBox.classList.add('pop-away');
    
    // Remove the gift box from DOM after animation completes
    setTimeout(() => {
        giftBox.style.display = 'none';
        recipientName.classList.add('revealed');
    }, 600);
}

// Run when page loads
window.addEventListener('DOMContentLoaded', () => {
    createSnowflakes();
    displaySecretSanta();
});

