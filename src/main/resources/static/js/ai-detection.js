document.addEventListener("DOMContentLoaded", () => {
    // Element References
    const inputText = document.getElementById("inputText");
    const charCount = document.getElementById("charCount");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const resultsSection = document.getElementById("resultsSection");
    const historyTable = document.getElementById("historyTable").querySelector("tbody");
    const viewAllHistoryBtn = document.getElementById("viewAllHistoryBtn");
    const modal = document.createElement("div");
    modal.className = "modal";
    document.body.appendChild(modal);

    // Character Count Update
    inputText.addEventListener("input", () => {
        const max = 10000;
        const remaining = max - inputText.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    // Analyze Button Click
    analyzeBtn.addEventListener("click", async () => {
        const content = inputText.value.trim();

        if (!content) {
            alert("Please paste some content!");
            return;
        }
        if (content.length < 500) {
            alert("Minimum 500 characters required for analysis");
            return;
        }

        resultsSection.innerHTML = `
            <div class="result-scroll-container">
                <div class="loader"></div>
                <p>Analyzing content...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/detect/bulk-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                showError(data.error);
                return;
            }

            displayResults(data);
            addHistoryItem(content, data);

        } catch (error) {
            showError(error.message);
        }
    });

    // Display Results in Results Section
    function displayResults(data) {
        resultsSection.innerHTML = `
            <div class="result-scroll-container">
                <div class="result-card ui-card animate-slide-in">
                    <h3 class="result-title">AI Detection Report</h3>
                    <div class="confidence-circle">
                        <div class="circle-progress" style="--progress: ${data.probability}">
                            <span class="confidence-score">${data.probability}%</span>
                        </div>
                        <p class="confidence-label">AI Content Probability</p>
                    </div>
                    
                    <div class="metrics-grid">
                        <div class="metric">
                            <label>Perplexity</label>
                            <div class="progress-bar">
                                <div class="progress-fill animate-progress" style="width: ${data.metrics.perplexity}%"></div>
                            </div>
                            <span>${data.metrics.perplexity}%</span>
                        </div>
                        <div class="metric">
                            <label>Burstiness</label>
                            <div class="progress-bar">
                                <div class="progress-fill animate-progress" style="width: ${data.metrics.burstiness}%"></div>
                            </div>
                            <span>${data.metrics.burstiness}%</span>
                        </div>
                        <div class="metric">
                            <label>Consistency</label>
                            <div class="progress-bar">
                                <div class="progress-fill animate-progress" style="width: ${data.metrics.consistency}%"></div>
                            </div>
                            <span>${data.metrics.consistency}%</span>
                        </div>
                    </div>

                    <div class="analysis-block">
                        <h4>Detected Patterns</h4>
                        <ul class="pattern-list">
                            ${data.patterns.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="analysis-block">
                        <h4>Detailed Analysis</h4>
                        <p>${data.analysis}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Show Error Message
    function showError(message) {
        resultsSection.innerHTML = `
            <div class="result-scroll-container">
                <div class="error-message ui-card animate-slide-in">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    // Show Modal with Analysis Details
    function showAnalysisModal(data) {
        modal.innerHTML = `
            <div class="modal-content ui-card">
                <div class="modal-header">
                    <h3>Analysis Details</h3>
                    <button class="modal-close btn-icon"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="confidence-circle">
                        <div class="circle-progress" style="--progress: ${data.confidence}">
                            <span class="confidence-score">${data.confidence}%</span>
                        </div>
                        <p class="confidence-label">AI Content Probability</p>
                    </div>
                    <div class="metrics-grid">
                        <div class="metric">
                            <label>Perplexity</label>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${data.metrics.perplexity}%"></div>
                            </div>
                            <span>${data.metrics.perplexity}%</span>
                        </div>
                        <div class="metric">
                            <label>Burstiness</label>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${data.metrics.burstiness}%"></div>
                            </div>
                            <span>${data.metrics.burstiness}%</span>
                        </div>
                        <div class="metric">
                            <label>Consistency</label>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${data.metrics.consistency}%"></div>
                            </div>
                            <span>${data.metrics.consistency}%</span>
                        </div>
                    </div>
                    <div class="analysis-block">
                        <h4>Detected Patterns</h4>
                        <ul class="pattern-list">
                            ${data.patterns.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="analysis-block">
                        <h4>Detailed Analysis</h4>
                        <p>${data.analysis}</p>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = "flex";
        modal.querySelector(".modal-close").addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Show Full History Modal
    async function showFullHistoryModal() {
        try {
            const res = await fetch('/api/detections/all');
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const items = await res.json();
            modal.innerHTML = `
                <div class="modal-content ui-card">
                    <div class="modal-header">
                        <h3>Full Detection History</h3>
                        <button class="modal-close btn-icon"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-container">
                            <table class="checks-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Content Preview</th>
                                        <th>Result</th>
                                        <th>Confidence</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(item => `
                                        <tr data-id="${item.id}">
                                            <td>${new Date(item.createdAt).toLocaleString()}</td>
                                            <td>${item.contentPreview || ''}</td>
                                            <td><span class="status-badge ${item.result === 'AI' ? 'ai' : 'human'}">${item.result || ''}</span></td>
                                            <td>${item.confidence != null ? item.confidence + '%' : ''}</td>
                                            <td>
                                                <button class="btn-icon view-analysis-btn">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn-icon delete-btn">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = "flex";
            modal.querySelector(".modal-close").addEventListener("click", () => {
                modal.style.display = "none";
            });
            modal.querySelectorAll(".view-analysis-btn").forEach((btn, index) => {
                btn.addEventListener("click", () => {
                    showAnalysisModal({
                        confidence: items[index].confidence,
                        metrics: items[index].metrics || { perplexity: 0, burstiness: 0, consistency: 0 },
                        patterns: items[index].patterns || [],
                        analysis: items[index].analysis || 'No analysis available'
                    });
                });
            });
            modal.querySelectorAll(".delete-btn").forEach((btn, index) => {
                btn.addEventListener("click", () => {
                    console.log(`Attempting to delete history entry with ID: ${items[index].id}`);
                    deleteHistoryItem(items[index].id, btn.closest('tr'));
                });
            });
        } catch (e) {
            console.warn('Failed to load full detection history:', e);
            modal.innerHTML = `
                <div class="modal-content ui-card">
                    <div class="modal-header">
                        <h3>Full Detection History</h3>
                        <button class="modal-close btn-icon"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Failed to load history: ${e.message}</p>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = "flex";
            modal.querySelector(".modal-close").addEventListener("click", () => {
                modal.style.display = "none";
            });
        }
    }

    // Delete History Item
    async function deleteHistoryItem(id, rowElement) {
        if (!confirm('Are you sure you want to delete this history entry?')) return;
        console.log(`Sending DELETE request for ID: ${id}`);
        try {
            const res = await fetch(`/api/detections/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            rowElement.remove();
            loadRecentHistory();
            if (modal.style.display === "flex" && modal.querySelector(".modal-header h3").textContent === "Full Detection History") {
                showFullHistoryModal();
            }
        } catch (e) {
            console.error('Delete error:', e.message);
            showError(`Failed to delete history entry: ${e.message}`);
        }
    }

    // Add History Entry (persist and update table)
    async function addHistoryItem(content, data) {
        const resultLabel = data.probability >= 50 ? 'AI' : 'Human';
        const preview = content.slice(0, 30) + '...';
        try {
            const response = await fetch('/api/detections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentPreview: preview,
                    result: resultLabel,
                    confidence: Math.round(Number(data.probability) || 0),
                    metrics: data.metrics,
                    patterns: data.patterns,
                    analysis: data.analysis
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const saved = await response.json();
            console.log(`Saved history entry with ID: ${saved.id}`);
            const newRow = historyTable.insertRow(0);
            newRow.dataset.id = saved.id;
            newRow.innerHTML = `
                <td>${new Date().toLocaleString()}</td>
                <td>${preview}</td>
                <td><span class="status-badge ${resultLabel === 'AI' ? 'ai' : 'human'}">${resultLabel}</span></td>
                <td>${Math.round(Number(data.probability) || 0)}%</td>
                <td>
                    <button class="btn-icon view-analysis-btn">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            newRow.querySelector(".view-analysis-btn").addEventListener("click", () => {
                showAnalysisModal({
                    confidence: Math.round(Number(data.probability) || 0),
                    metrics: data.metrics,
                    patterns: data.patterns,
                    analysis: data.analysis
                });
            });
            newRow.querySelector(".delete-btn").addEventListener("click", () => {
                console.log(`Initiating delete for ID: ${saved.id}`);
                deleteHistoryItem(saved.id, newRow);
            });
        } catch (e) {
            console.warn('Failed to save detection history:', e);
        }
    }

    // Load recent history for user
    async function loadRecentHistory() {
        try {
            const res = await fetch('/api/detections/recent');
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const items = await res.json();
            console.log('Recent history items:', items);
            historyTable.innerHTML = '';
            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.dataset.id = item.id;
                const date = new Date(item.createdAt || Date.now()).toLocaleString();
                tr.innerHTML = `
                    <td>${date}</td>
                    <td>${item.contentPreview || ''}</td>
                    <td><span class="status-badge ${item.result === 'AI' ? 'ai' : 'human'}">${item.result || ''}</span></td>
                    <td>${item.confidence != null ? item.confidence + '%' : ''}</td>
                    <td>
                        <button class="btn-icon view-analysis-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tr.querySelector(".view-analysis-btn").addEventListener("click", () => {
                    showAnalysisModal({
                        confidence: item.confidence,
                        metrics: item.metrics || { perplexity: 0, burstiness: 0, consistency: 0 },
                        patterns: item.patterns || [],
                        analysis: item.analysis || 'No analysis available'
                    });
                });
                tr.querySelector(".delete-btn").addEventListener("click", () => {
                    console.log(`Initiating delete for ID: ${item.id}`);
                    deleteHistoryItem(item.id, tr);
                });
                historyTable.appendChild(tr);
            });
        } catch (e) {
            console.warn('Failed to load recent detection history:', e);
        }
    }

    // Initial load of recent history
    loadRecentHistory();

    // View Full History Button
    viewAllHistoryBtn.addEventListener("click", showFullHistoryModal);

    // Toggle Navigation Menu
    document.getElementById("menuToggle").addEventListener("click", () => {
        document.getElementById("mainNav").classList.toggle("active");
    });
});

// Clear Button Functionality
document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('inputText').value = '';
    document.getElementById('charCount').textContent = '10000 characters remaining';
    document.getElementById('resultsSection').innerHTML = `
        <div class="result-scroll-container">
            <div class="result-placeholder ui-card">
                <i class="fas fa-chart-bar"></i>
                <p>Analysis results will appear here</p>
            </div>
        </div>
    `;
});

// Update Character Count on Input
document.getElementById('inputText').addEventListener('input', updateCharCount);

function updateCharCount() {
    const textarea = document.getElementById('inputText');
    const remaining = 10000 - textarea.value.length;
    document.getElementById('charCount').textContent = `${remaining} characters remaining`;
}

// Logout Button Redirect
document.getElementById('logoutBtn').addEventListener('click', function () {
    window.location.href = 'sign-up.html';
});