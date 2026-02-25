// Initialize storage
let requests = [];

// Load requests from storage on page load
async function loadRequests() {
    try {
        const result = await window.storage.get('dj-szymar-requests', true);
        if (result && result.value) {
            requests = JSON.parse(result.value);
            renderRequests();
        }
    } catch (error) {
        console.log('No existing requests found');
        requests = [];
    }
}

// Save requests to storage
async function saveRequests() {
    try {
        await window.storage.set('dj-szymar-requests', JSON.stringify(requests), true);
    } catch (error) {
        console.error('Error saving requests:', error);
    }
}

// Handle form submission
document.getElementById('songRequestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now(),
        songTitle: document.getElementById('songTitle').value.trim(),
        artist: document.getElementById('artist').value.trim(),
        requesterName: document.getElementById('requesterName').value.trim() || 'Gość',
        notes: document.getElementById('notes').value.trim(),
        timestamp: new Date().toISOString(),
        status: 'pending' // pending, playing, played
    };

    // Add to requests array
    requests.push(formData);
    
    // Save to storage
    await saveRequests();

    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);

    // Reset form
    this.reset();

    // Render updated list
    renderRequests();
});

// Render requests list
function renderRequests() {
    const requestsList = document.getElementById('requestsList');
    const queueCount = document.getElementById('queueCount');
    
    // Filter out played songs older than 1 hour for guests
    const activeRequests = requests.filter(req => {
        if (req.status !== 'played') return true;
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return new Date(req.timestamp) > hourAgo;
    });

    if (activeRequests.length === 0) {
        requestsList.innerHTML = `
            <div class="empty-queue">
                <div class="empty-queue-icon">♪</div>
                <p>Kolejka jest pusta. Bądź pierwszy!</p>
            </div>
        `;
        queueCount.textContent = '0';
        return;
    }

    // Sort: playing first, then pending by timestamp, then played
    const sortedRequests = [...activeRequests].sort((a, b) => {
        if (a.status === 'playing') return -1;
        if (b.status === 'playing') return 1;
        if (a.status === 'pending' && b.status === 'played') return -1;
        if (a.status === 'played' && b.status === 'pending') return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const pendingCount = activeRequests.filter(r => r.status === 'pending').length;

    requestsList.innerHTML = sortedRequests.map(request => {
        let statusBadge = '';
        let statusClass = '';
        
        if (request.status === 'playing') {
            statusBadge = '<span class="status-badge status-playing"><span class="playing-icon">♫</span> Teraz Gra</span>';
            statusClass = 'playing';
        } else if (request.status === 'played') {
            statusBadge = '<span class="status-badge status-played">✓ Zagrane</span>';
            statusClass = 'played';
        } else {
            statusBadge = '<span class="status-badge status-pending">⏳ Oczekuje</span>';
        }

        return `
            <div class="request-item ${statusClass}">
                ${statusBadge}
                <div class="request-song">${escapeHtml(request.songTitle)}</div>
                <div class="request-artist">♪ ${escapeHtml(request.artist)}</div>
                <div class="request-name">Zamówił(a): ${escapeHtml(request.requesterName)}</div>
                ${request.notes ? `<div class="request-name" style="margin-top: 6px;">"${escapeHtml(request.notes)}"</div>` : ''}
            </div>
        `;
    }).join('');

    queueCount.textContent = pendingCount;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load requests when page loads
loadRequests();

// Refresh requests every 3 seconds to show updates from DJ
setInterval(loadRequests, 3000);