// AI Content Detection Page JavaScript
// This script handles input analysis, character counting, result display, and interaction logic

document.addEventListener("DOMContentLoaded", () => {
    // Element References
    const inputText = document.getElementById("inputText");
    const charCount = document.getElementById("charCount");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const resultsSection = document.getElementById("resultsSection");
    const historyTable = document.getElementById("historyTable").querySelector("tbody");

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
            <div class="loader"></div>
            <p>Analyzing content...</p>
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
            <div class="result-box">
                <h3>AI Detection Report</h3>
                <div class="confidence-bar">
                    <span>Probability: ${data.probability}%</span>
                    <div class="bar">
                        <div class="fill" style="width: ${data.probability}%;"></div>
                    </div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric">
                        <label>Perplexity</label>
                        <div class="progress-bar">
                            <div class="fill" style="width: ${data.metrics.perplexity}%;"></div>
                        </div>
                        <span>${data.metrics.perplexity}%</span>
                    </div>
                    <div class="metric">
                        <label>Burstiness</label>
                        <div class="progress-bar">
                            <div class="fill" style="width: ${data.metrics.burstiness}%;"></div>
                        </div>
                        <span>${data.metrics.burstiness}%</span>
                    </div>
                    <div class="metric">
                        <label>Consistency</label>
                        <div class="progress-bar">
                            <div class="fill" style="width: ${data.metrics.consistency}%;"></div>
                        </div>
                        <span>${data.metrics.consistency}%</span>
                    </div>
                </div>

                <div class="analysis-block">
                    <h4>Detected Patterns</h4>
                    <ul>
                        ${data.patterns.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>

                <div class="analysis-block">
                    <h4>Detailed Analysis</h4>
                    <p>${data.analysis}</p>
                </div>
            </div>
        `;
    }

    // Show Error Message
    function showError(message) {
        resultsSection.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Add History Entry
    function addHistoryItem(content, data) {
        const newRow = historyTable.insertRow(0);
        newRow.innerHTML = `
            <td>${new Date().toLocaleString()}</td>
            <td>${content.slice(0, 30)}...</td>
            <td>${data.probability >= 50 ? 'Likely AI-Generated' : 'Likely Human'}</td>
            <td>${data.probability}%</td>
            <td>
                <button class="btn-icon" onclick="alert('${data.analysis.replace(/'/g, "\\'")}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    }

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
        <div class="result-placeholder">
            <i class="fas fa-chart-bar"></i>
            <p>Analysis results will appear here</p>
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
    window.location.href = 'sign-up.html'; // update to your actual logout page if needed
});
