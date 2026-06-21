// Application State
const state = {
    releaseNotes: [],
    filteredNotes: [],
    activeFilter: 'all',
    searchQuery: '',
    selectedNote: null,
    activeTemplate: 'default',
    selectedHashtags: ['#BigQuery', '#GCP'],
    isManualEdit: false
};

// DOM Elements
const elements = {
    exportCsvBtn: document.getElementById('export-csv-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search'),
    filterChips: document.querySelectorAll('.chip'),
    feedStatus: document.getElementById('feed-status'),
    errorCard: document.getElementById('error-card'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    skeletonLoader: document.getElementById('skeleton-loader'),
    feedEntries: document.getElementById('feed-entries'),
    emptyState: document.getElementById('empty-state'),
    
    // Composer elements
    composerActiveState: document.getElementById('composer-active-state'),
    composerEmptyState: document.getElementById('composer-empty-state'),
    selectedItemDate: document.getElementById('selected-item-date'),
    selectedItemType: document.getElementById('selected-item-type'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    hashtagCheckboxes: document.querySelectorAll('.tag-checkbox'),
    templateBtns: document.querySelectorAll('.template-btn'),
    tweetPreviewText: document.getElementById('tweet-preview-text'),
    charCount: document.getElementById('char-count'),
    progressCircle: document.getElementById('progress-circle'),
    copyTweetBtn: document.getElementById('copy-tweet-btn'),
    tweetBtn: document.getElementById('tweet-btn'),
    toastContainer: document.getElementById('toast-container')
};

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Refresh, Export and Retry
    elements.exportCsvBtn.addEventListener('click', exportToCSV);
    elements.refreshBtn.addEventListener('click', fetchReleaseNotes);
    elements.retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        handleSearchInput();
    });
    
    // Filter Chips
    elements.filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            elements.filterChips.forEach(c => c.classList.remove('active'));
            const clickedChip = e.currentTarget;
            clickedChip.classList.add('active');
            state.activeFilter = clickedChip.getAttribute('data-type');
            applyFilters();
        });
    });
    
    // Hashtag Toggles
    elements.hashtagCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            state.selectedHashtags = Array.from(elements.hashtagCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            state.isManualEdit = false; // Reset manual edit so template updates
            updateComposer();
        });
    });
    
    // Template Buttons
    elements.templateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.templateBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.activeTemplate = e.currentTarget.getAttribute('data-template');
            state.isManualEdit = false; // Reset manual edit to apply template
            updateComposer();
        });
    });
    
    // Tweet text manual input
    elements.tweetTextarea.addEventListener('input', () => {
        state.isManualEdit = true;
        updateCharCounter();
        elements.tweetPreviewText.innerText = elements.tweetTextarea.value;
    });
    
    // Share / Action Buttons
    elements.copyTweetBtn.addEventListener('click', copyTweetToClipboard);
    elements.tweetBtn.addEventListener('click', postTweetToX);
}

// Fetch Data from API
async function fetchReleaseNotes() {
    // Show loading state
    elements.refreshBtn.classList.add('loading');
    elements.refreshBtn.disabled = true;
    elements.skeletonLoader.style.display = 'block';
    elements.feedEntries.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.errorCard.style.display = 'none';
    elements.feedStatus.innerText = 'Syncing with BigQuery feed...';
    
    try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            state.releaseNotes = data.entries;
            applyFilters();
            
            // Format updated timestamp
            const updateTime = data.updated ? new Date(data.updated).toLocaleString() : 'Just now';
            elements.feedStatus.innerText = `Last sync: ${updateTime}`;
        } else {
            throw new Error(data.message || 'Failed to fetch release notes from API.');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        elements.errorMessage.innerText = error.message;
        elements.errorCard.style.display = 'block';
        elements.feedStatus.innerText = 'Sync failed';
    } finally {
        elements.refreshBtn.classList.remove('loading');
        elements.refreshBtn.disabled = false;
        elements.skeletonLoader.style.display = 'none';
    }
}

// Search input handler
function handleSearchInput() {
    state.searchQuery = elements.searchInput.value.trim().toLowerCase();
    if (state.searchQuery) {
        elements.clearSearchBtn.style.display = 'block';
    } else {
        elements.clearSearchBtn.style.display = 'none';
    }
    applyFilters();
}

// Apply Filters (Search and Type)
function applyFilters() {
    state.filteredNotes = state.releaseNotes.map(entry => {
        // Filter items inside the entry
        const matchedItems = entry.items.filter(item => {
            const matchesType = state.activeFilter === 'all' || item.type.toLowerCase() === state.activeFilter;
            const matchesSearch = !state.searchQuery || 
                                  item.content_text.toLowerCase().includes(state.searchQuery) ||
                                  item.type.toLowerCase().includes(state.searchQuery);
            return matchesType && matchesSearch;
        });
        
        // Return a copy of entry with only matched items
        return {
            ...entry,
            items: matchedItems
        };
    }).filter(entry => entry.items.length > 0); // Keep only entries that have matched items
    
    renderNotes();
}

// Render filtered notes in the list
function renderNotes() {
    elements.feedEntries.innerHTML = '';
    
    if (state.filteredNotes.length === 0) {
        elements.feedEntries.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.feedEntries.style.display = 'block';
    
    state.filteredNotes.forEach(entry => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        const dateTitle = document.createElement('div');
        dateTitle.className = 'date-title';
        dateTitle.innerText = entry.title;
        dateGroup.appendChild(dateTitle);
        
        const cardList = document.createElement('div');
        cardList.className = 'update-card-list';
        
        entry.items.forEach((item, index) => {
            const cardId = `${entry.id}-${index}`;
            const card = document.createElement('div');
            card.className = 'update-card';
            
            // Set CSS custom property for color border
            const typeLower = item.type.toLowerCase();
            let accentColor = 'var(--color-update)';
            if (typeLower === 'feature') accentColor = 'var(--color-feature)';
            else if (typeLower === 'issue') accentColor = 'var(--color-issue)';
            else if (typeLower === 'fixed') accentColor = 'var(--color-fixed)';
            else if (typeLower === 'deprecation') accentColor = 'var(--color-deprecation)';
            else if (typeLower === 'changed') accentColor = 'var(--color-changed)';
            
            card.style.setProperty('--card-accent', accentColor);
            
            if (state.selectedNote && state.selectedNote.id === cardId) {
                card.classList.add('selected');
            }
            
            // Setup HTML
            card.innerHTML = `
                <div class="update-header">
                    <span class="badge-tag ${typeLower}">${item.type}</span>
                    <div class="update-meta-right">
                        <span>BigQuery</span>
                    </div>
                </div>
                <div class="update-content">${item.content_html}</div>
                <div class="card-actions">
                    <button class="action-icon-btn copy-btn" title="Copy Raw Text">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                    <button class="action-icon-btn tweet-draft-btn ${state.selectedNote && state.selectedNote.id === cardId ? 'active-tweet' : ''}" title="Draft X Post">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Click to select note
            card.addEventListener('click', (e) => {
                // If they clicked a link or button, don't trigger select
                if (e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('.action-icon-btn')) {
                    return;
                }
                selectNote(cardId, entry.title, item, entry.link);
            });
            
            // Bind inner actions
            card.querySelector('.copy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(item.content_text);
                showToast('Description copied to clipboard!', 'success');
            });
            
            card.querySelector('.tweet-draft-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                selectNote(cardId, entry.title, item, entry.link);
            });
            
            cardList.appendChild(card);
        });
        
        dateGroup.appendChild(cardList);
        elements.feedEntries.appendChild(dateGroup);
    });
}

// Select a Release Note
function selectNote(id, date, item, link) {
    state.selectedNote = {
        id: id,
        date: date,
        type: item.type,
        text: item.content_text,
        link: link
    };
    
    state.isManualEdit = false;
    
    // Highlight in the UI list
    const cards = document.querySelectorAll('.update-card');
    cards.forEach(card => card.classList.remove('selected'));
    
    // Find all active-tweet buttons and reset
    const tweetBtns = document.querySelectorAll('.tweet-draft-btn');
    tweetBtns.forEach(btn => btn.classList.remove('active-tweet'));
    
    // Re-render will handle class assigning, or we can do it directly to elements
    renderNotes();
    
    // Open composer details
    elements.composerEmptyState.style.display = 'none';
    elements.composerActiveState.style.display = 'block';
    
    elements.selectedItemDate.innerText = date;
    elements.selectedItemType.innerText = item.type;
    
    // Re-apply type badge style
    elements.selectedItemType.className = `meta-type badge-tag ${item.type.toLowerCase()}`;
    
    updateComposer();
    showToast('Draft updated in X composer!', 'success');
}

// Update Composer Text and Preview based on templates and hashtags
function updateComposer() {
    if (!state.selectedNote) return;
    
    if (!state.isManualEdit) {
        const text = state.selectedNote.text;
        const type = state.selectedNote.type;
        const date = state.selectedNote.date;
        const hashtagsStr = state.selectedHashtags.join(' ');
        const rawLink = state.selectedNote.link || "";
        
        let draftText = '';
        
        if (state.activeTemplate === 'bullet') {
            draftText = `🔥 New BigQuery ${type} (${date}):\n\n⚡ ${text}\n\n${rawLink}\n\n${hashtagsStr}`;
        } else if (state.activeTemplate === 'short') {
            draftText = `BQ Release (${date}) | ${type}:\n${text}\n\n${hashtagsStr}`;
        } else {
            // default
            draftText = `🚀 BigQuery Release Update (${date}) - ${type}:\n\n${text}\n\n${hashtagsStr}`;
        }
        
        // Smart limit & truncate if exceeded 280
        if (draftText.length > 280) {
            // Let's recalculate with truncated text
            const baseStr = draftText.replace(text, '');
            const allowedLen = 280 - baseStr.length - 5; // safety margin
            if (allowedLen > 20) {
                const truncatedText = text.substring(0, allowedLen) + '...';
                
                if (state.activeTemplate === 'bullet') {
                    draftText = `🔥 New BigQuery ${type} (${date}):\n\n⚡ ${truncatedText}\n\n${rawLink}\n\n${hashtagsStr}`;
                } else if (state.activeTemplate === 'short') {
                    draftText = `BQ Release (${date}) | ${type}:\n${truncatedText}\n\n${hashtagsStr}`;
                } else {
                    draftText = `🚀 BigQuery Release Update (${date}) - ${type}:\n\n${truncatedText}\n\n${hashtagsStr}`;
                }
            }
        }
        
        elements.tweetTextarea.value = draftText;
    }
    
    // Update live preview HTML
    elements.tweetPreviewText.innerText = elements.tweetTextarea.value;
    updateCharCounter();
}

// Update character counters and progress rings
function updateCharCounter() {
    const currentLength = elements.tweetTextarea.value.length;
    const remaining = 280 - currentLength;
    
    elements.charCount.innerText = remaining;
    
    // Progress Circle Calculation
    // Total stroke-dasharray is 88 (configured in CSS)
    const radius = 14;
    const circumference = 2 * Math.PI * radius; // 87.96
    
    let percentage = Math.min(currentLength / 280, 1.0);
    const strokeOffset = circumference - (percentage * circumference);
    
    elements.progressCircle.style.strokeDashoffset = strokeOffset;
    
    // Warning styling
    elements.charCount.className = 'char-count-number';
    if (remaining < 0) {
        elements.charCount.classList.add('danger');
        elements.progressCircle.style.stroke = 'var(--color-issue)';
    } else if (remaining <= 40) {
        elements.charCount.classList.add('warning');
        elements.progressCircle.style.stroke = 'var(--color-deprecation)';
    } else {
        elements.progressCircle.style.stroke = 'var(--accent-x-blue)';
    }
}

// Copy Tweet Text
function copyTweetToClipboard() {
    const text = elements.tweetTextarea.value;
    navigator.clipboard.writeText(text);
    showToast('Tweet copied to clipboard!', 'success');
}

// Share to Twitter/X (open intent web url)
function postTweetToX() {
    const text = elements.tweetTextarea.value;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank');
    showToast('Opening X (Twitter)...', 'success');
}

// Export Filtered Updates to CSV
function exportToCSV() {
    if (!state.filteredNotes || state.filteredNotes.length === 0) {
        showToast('No updates to export.', 'error');
        return;
    }
    
    const csvRows = [];
    // Header Row
    csvRows.push(['Date', 'Type', 'Description', 'Link'].map(val => `"${val.replace(/"/g, '""')}"`).join(','));
    
    state.filteredNotes.forEach(entry => {
        const date = entry.title;
        const link = entry.link || '';
        
        entry.items.forEach(item => {
            const type = item.type;
            const text = item.content_text;
            
            const row = [date, type, text, link].map(val => `"${val.replace(/"/g, '""')}"`).join(',');
            csvRows.push(row);
        });
    });
    
    // Create Blob for CSV download to handle any data length safely
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', url);
    downloadLink.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showToast('CSV export successful!', 'success');
}

// Toast notification helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-content">${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
