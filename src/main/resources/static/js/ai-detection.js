document.addEventListener("DOMContentLoaded", () => {
    // --- Element References ---
    const inputText = document.getElementById("inputText");
    const charCount = document.getElementById("charCount");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const clearBtn = document.getElementById("clearBtn");
    const resultsSection = document.getElementById("resultsSection");
    const historyTableBody = document.getElementById("historyTableBody");
    const viewAllHistoryBtn = document.getElementById("viewAllHistoryBtn");
    const modalContainer = document.getElementById("modalContainer");
    const logoutBtn = document.getElementById("logoutBtn");
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");
    const navHistoryLink = document.querySelector(".nav-history-link");


    const MAX_CHARS = 10000;
    const COOLDOWN_SECONDS = 5; // Reduced for easier testing

    // --- Cooldown Management ---
    const updateCooldownState = () => {
        const lastRequestTime = localStorage.getItem('lastAiDetectionRequest');
        if (!lastRequestTime) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-magnifying-glass"></i> Analyze';
            return;
        }

        const timePassed = (Date.now() - parseInt(lastRequestTime, 10)) / 1000;
        const remainingTime = Math.ceil(COOLDOWN_SECONDS - timePassed);

        if (remainingTime > 0) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = `<i class="fas fa-hourglass-start"></i> Cooldown (${remainingTime}s)`;
        } else {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-magnifying-glass"></i> Analyze';
            localStorage.removeItem('lastAiDetectionRequest');
        }
    };

    // Start the cooldown timer check
    setInterval(updateCooldownState, 1000);
    updateCooldownState();

    // --- Event Listeners ---
    inputText.addEventListener("input", () => {
        const remaining = MAX_CHARS - inputText.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    clearBtn.addEventListener("click", () => {
        inputText.value = "";
        charCount.textContent = `${MAX_CHARS} characters remaining`;
        resultsSection.innerHTML = `<div class="result-placeholder"><i class="fas fa-chart-pie"></i><h3>Analysis Results</h3><p>Your content analysis will appear here.</p></div>`;
    });

    logoutBtn.addEventListener("click", () => {
        window.location.href = '/logout';
    });

    menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("active");
    });

    navHistoryLink.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("history").scrollIntoView({ behavior: 'smooth' });
    });

    analyzeBtn.addEventListener("click", async () => {
        const content = inputText.value.trim();

        if (!content) {
            alert("Please paste some content!");
            return;
        }
        if (content.length < 100) {
            alert("Minimum 100 characters required for analysis.");
            return;
        }

        localStorage.setItem('lastAiDetectionRequest', Date.now().toString());
        updateCooldownState();
        resultsSection.innerHTML = `<div class="loader-container"><div class="loader"></div><p>Analyzing content...</p></div>`;

        try {
            const response = await fetch('/api/detect/bulk-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content })
            });

            // *** FIX: The 'data' variable IS the parsed JavaScript OBJECT. Do NOT parse it again. ***
            const data = await response.json();

            if (!response.ok) {
                // If the server returns an error response, use its message
                throw new Error(data.message || 'An unknown error occurred during analysis.');
            }

            displayResults(data);
            await addHistoryItem(content, data);
            await loadRecentHistory(); // Refresh history list

        } catch (error) {
            console.error("Analysis failed:", error);
            showError(error.message);
        }
    });

    // --- Display & Data Functions ---
    function displayResults(data) {
        // Directly use the properties of the 'data' object
        const resultHTML = `
            <div class="result-card ui-card animate-slide-in">
                <h3 class="result-title">AI Detection Report</h3>
                <div class="confidence-circle" style="--progress: ${data.probability || 0}">
                    <span class="confidence-score">${data.probability || 0}%</span>
                    <p class="confidence-label">AI Probability</p>
                </div>
                <div class="metrics-grid">
                    <div class="metric"><label>Perplexity</label><span>${data.metrics?.perplexity || 'N/A'}</span></div>
                    <div class="metric"><label>Burstiness</label><span>${data.metrics?.burstiness || 'N/A'}</span></div>
                    <div class="metric"><label>Consistency</label><span>${data.metrics?.consistency || 'N/A'}</span></div>
                </div>
                <div class="analysis-block">
                    <h4>Detected Patterns</h4>
                    <p>${data.patterns?.join(', ') || 'No specific patterns detected.'}</p>
                </div>
                <div class="analysis-block">
                    <h4>Detailed Analysis</h4>
                    <div class="content-scroll-container">
                       ${data.analysis ? data.analysis.replace(/\n/g, '<br>') : 'No detailed analysis available.'}
                    </div>
                </div>
            </div>
        `;
        resultsSection.innerHTML = resultHTML;
    }

    function showError(message) {
        resultsSection.innerHTML = `<div class="error-message ui-card animate-slide-in"><i class="fas fa-exclamation-triangle"></i><p>${message}</p></div>`;
    }

    async function addHistoryItem(content, data) {
        const resultLabel = (data.probability || 0) >= 50 ? 'AI' : 'Human';
        const preview = content.slice(0, 50) + (content.length > 50 ? '...' : '');

        try {
            const response = await fetch('/api/detections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content,
                    contentPreview: preview,
                    result: resultLabel,
                    confidence: Math.round(Number(data.probability) || 0),
                    fullResultJson: JSON.stringify(data)
                })
            });

            if (!response.ok) {
                console.error('Failed to save detection history.');
            }
        } catch (e) {
            console.error('Error saving detection history:', e);
        }
    }

    async function loadRecentHistory() {
        try {
            // Your backend uses the user's session to filter this query
            const res = await fetch('/api/detections/recent');
            if (!res.ok) return;
            const items = await res.json();

            historyTableBody.innerHTML = ''; // Clear existing rows
            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.dataset.id = item.id;
                // Store the full JSON result to allow re-displaying it without another API call
                tr.dataset.fullResultJson = item.fullResultJson || JSON.stringify({
                    probability: item.confidence,
                    metrics: { perplexity: 'N/A', burstiness: 'N/A', consistency: 'N/A' },
                    patterns: ['N/A'],
                    analysis: 'Detailed analysis not available for this entry.'
                });

                tr.innerHTML = `
                    <td>${new Date(item.createdAt).toLocaleString()}</td>
                    <td>${item.contentPreview || ''}</td>
                    <td><span class="status-badge ${item.result === 'AI' ? 'ai' : 'human'}">${item.result || ''}</span></td>
                    <td>${item.confidence != null ? item.confidence + '%' : ''}</td>
                    <td>
                        <button class="btn-icon view-analysis-btn" title="View Analysis"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon delete-btn" title="Delete Entry"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                historyTableBody.appendChild(tr);
            });
        } catch (e) {
            console.warn('Failed to load recent history:', e);
        }
    }

    // --- Modal and History Actions ---
    function showModal(content) {
        modalContainer.innerHTML = `<div class="modal-content">${content}</div>`;
        modalContainer.style.display = 'flex';
        modalContainer.querySelector('.modal-close')?.addEventListener('click', () => {
            modalContainer.style.display = 'none';
        });
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.style.display = 'none';
            }
        });
    }

    async function showFullHistory() {
        try {
            const res = await fetch('/api/detections/recent?limit=50'); // Fetch more for "full" view
            if (!res.ok) throw new Error('Failed to load history.');
            const items = await res.json();

            const modalContent = `
                <div class="modal-header">
                    <h3>Full History</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="table-container">
                        <table class="checks-table">
                            <thead><tr><th>Date</th><th>Preview</th><th>Result</th><th>Confidence</th></tr></thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td>${new Date(item.createdAt).toLocaleString()}</td>
                                        <td>${item.contentPreview || ''}</td>
                                        <td><span class="status-badge ${item.result === 'AI' ? 'ai' : 'human'}">${item.result || ''}</span></td>
                                        <td>${item.confidence != null ? item.confidence + '%' : ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            showModal(modalContent);
        } catch (e) {
            console.error('Error loading full history:', e);
            alert(e.message);
        }
    }

    historyTableBody.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-analysis-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (viewBtn) {
            const row = viewBtn.closest('tr');
            try {
                const analysisData = JSON.parse(row.dataset.fullResultJson);
                resultsSection.innerHTML = ''; // Clear current results
                displayResults(analysisData);
                // Scroll to results
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (err) {
                alert('Could not display analysis for this historical item. The data may be malformed.');
                console.error('Failed to parse history analysis JSON:', err);
            }
        }

        if (deleteBtn) {
            const row = deleteBtn.closest('tr');
            const id = row.dataset.id;
            deleteHistoryItem(id, row);
        }
    });

    async function deleteHistoryItem(id, rowElement) {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            // Ensure your backend controller supports DELETE requests on /api/detections/{id}
            const res = await fetch(`/api/detections/${id}`, { method: 'DELETE' });
            if (res.ok) {
                rowElement.remove();
            } else {
                alert('Failed to delete history item. Check server logs.');
            }
        } catch (e) {
            console.error('Error deleting history item:', e);
            alert('An error occurred while trying to delete the item.');
        }
    }

    // --- Initial Load ---
    viewAllHistoryBtn.addEventListener('click', showFullHistory);
    loadRecentHistory();
});