class DisputeHandler {
    constructor() {
        this.currentUser = null;
        this.cases = [];
        this.currentCase = null;
        this.init();
    }

    init() {
    this.bindEvents();
    this.checkAuth();
    this.initializeChatbot(); // Add this line
}

initializeChatbot() {
    // Add welcome message after a delay
    setTimeout(() => {
        if (document.getElementById('chatbot-messages')) {
            this.addMessage("Welcome! I can help you manage your dispute cases.");
            this.addMessage("Type 'help' to see what I can do, or use the quick replies below.");
        }
    }, 2000);
}

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-case-btn')) {
                const caseId = e.target.dataset.caseId;
                this.openCase(caseId);
            }
            
            if (e.target.classList.contains('close-modal')) {
                this.closeModal(e.target.closest('.modal'));
            }
            
            if (e.target.classList.contains('close-create-modal')) {
                this.closeModal(document.getElementById('create-case-modal'));
            }
        });

        // Create case button
        const createCaseBtn = document.getElementById('create-case-btn');
        if (createCaseBtn) {
            createCaseBtn.addEventListener('click', () => this.showCreateCaseModal());
        }

        // Create case form
        const createCaseForm = document.getElementById('create-case-form');
        if (createCaseForm) {
            createCaseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewCase();
            });
        }

        // View all cases button
        const viewAllCasesBtn = document.getElementById('view-all-cases');
        if (viewAllCasesBtn) {
            viewAllCasesBtn.addEventListener('click', () => this.loadCases());
        }

        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('open');
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    async checkAuth() {
        try {
            const response = await this.apiCall('/api/check-auth', 'GET');
            
            if (response.authenticated) {
                this.currentUser = response.user;
                this.updateUI();
                
                // Only load dashboard if we're on the main page
                if (window.location.pathname === '/') {
                    this.loadDashboard();
                } else if (window.location.pathname === '/login') {
                    // If already authenticated but on login page, redirect to dashboard
                    window.location.href = '/';
                }
            } else {
                // Not authenticated, stay on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.log('Auth check failed:', error);
            // On error, redirect to login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    }

    updateUI() {
        // Update user name in sidebar and header
        const userNameElements = document.querySelectorAll('.user-name, #header-user-name');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser?.full_name || 'Agent';
        });

        // Update welcome message
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && this.currentUser) {
            welcomeMessage.textContent = `Welcome back, ${this.currentUser.full_name}!`;
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        try {
            const response = await this.apiCall('/api/login', 'POST', {
                username,
                password
            });

            this.currentUser = response.user;
            window.location.href = '/'; // Redirect to dashboard after successful login
            
        } catch (error) {
            console.error('Login failed:', error);
            this.showError('Login failed. Please check your credentials.');
        }
    }

    async handleLogout() {
        try {
            await this.apiCall('/api/logout', 'POST');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }

    async loadDashboard() {
        try {
            const response = await this.apiCall('/api/cases');
            this.cases = response.cases || [];
            
            // Update welcome message
            const casesSummary = document.getElementById('cases-summary');
            if (casesSummary) {
                casesSummary.textContent = response.message || 'You have 0 cases open.';
            }
            
            // Update stats
            this.updateStats(this.cases);
            
            // Display recent cases
            this.displayRecentCases(this.cases);
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showError('Failed to load dashboard data.');
            
            // If it's an authentication error, redirect to login
            if (error.message.includes('401')) {
                window.location.href = '/login';
            }
        }
    }

    updateStats(cases) {
        const openCases = cases.filter(c => c.status === 'open').length;
        const reviewCases = cases.filter(c => c.status === 'in_review').length;
        const resolvedCases = cases.filter(c => c.status === 'closed').length;
        const escalatedCases = cases.filter(c => c.status === 'escalated').length;
        const pendingDocsCases = cases.filter(c => c.status === 'pending_docs').length;

        const openCountEl = document.getElementById('open-cases-count');
        const reviewCountEl = document.getElementById('review-cases-count');
        const resolvedCountEl = document.getElementById('resolved-cases-count');
        const escalatedCountEl = document.getElementById('escalated-cases-count');
        const pendingDocsCountEl = document.getElementById('pending-docs-count');

        if (openCountEl) openCountEl.textContent = openCases;
        if (reviewCountEl) reviewCountEl.textContent = reviewCases;
        if (resolvedCountEl) resolvedCountEl.textContent = resolvedCases;
        if (escalatedCountEl) escalatedCountEl.textContent = escalatedCases;
        if (pendingDocsCountEl) pendingDocsCountEl.textContent = pendingDocsCases;
    }

    displayRecentCases(cases) {
        const tbody = document.getElementById('cases-table-body');
        if (!tbody) return;
        
        const recentCases = cases.slice(0, 5); // Show only 5 most recent
        
        if (recentCases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No cases found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentCases.map(caseItem => `
            <tr>
                <td>${caseItem.case_id || 'N/A'}</td>
                <td>${caseItem.classification?.type || 'Unknown'}</td>
                <td>${caseItem.transaction?.customer_id || 'N/A'}</td>
                <td>${caseItem.transaction?.amount || 0} ${caseItem.transaction?.currency || ''}</td>
                <td><span class="status-badge status-${caseItem.status || 'open'}">${caseItem.status || 'open'}</span></td>
                <td>${caseItem.created_date ? new Date(caseItem.created_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn-primary view-case-btn" data-case-id="${caseItem.case_id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async openCase(caseId) {
        try {
            const response = await this.apiCall(`/api/cases/${caseId}/review`, 'POST');
            this.currentCase = response.case;
            this.showCaseModal();
        } catch (error) {
            console.error('Failed to open case:', error);
            this.showError('Failed to open case details.');
        }
    }

    showCaseModal() {
        const modal = document.getElementById('case-modal');
        const modalBody = document.getElementById('case-modal-body');
        
        if (!modal || !modalBody) return;
        
        if (!this.currentCase) {
            modalBody.innerHTML = '<p>No case data available.</p>';
            modal.style.display = 'block';
            return;
        }
        
        modalBody.innerHTML = `
            <div class="case-detail-grid">
                <div class="case-detail-card">
                    <h3>Transaction Information</h3>
                    <div class="case-info-item">
                        <strong>Customer ID</strong>
                        <span>${this.currentCase.transaction?.customer_id || 'N/A'}</span>
                    </div>
                    <div class="case-info-item">
                        <strong>Transaction ID</strong>
                        <span>${this.currentCase.transaction?.transaction_id || 'N/A'}</span>
                    </div>
                    <div class="case-info-item">
                        <strong>Amount</strong>
                        <span>${this.currentCase.transaction?.amount || 0} ${this.currentCase.transaction?.currency || ''}</span>
                    </div>
                    <div class="case-info-item">
                        <strong>Merchant</strong>
                        <span>${this.currentCase.transaction?.merchant || 'N/A'}</span>
                    </div>
                    <div class="case-info-item">
                        <strong>Date</strong>
                        <span>${this.currentCase.transaction?.date ? new Date(this.currentCase.transaction.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="case-info-item">
                        <strong>Customer Statement</strong>
                        <p>"${this.currentCase.transaction?.customer_statement || 'No statement'}"</p>
                    </div>
                </div>

                <div class="case-detail-card-ai">
                    <h3>🤖 AI Analysis</h3>
                    <div class="case-info-item">
                        <strong>Dispute Type</strong>
                        <span>${this.currentCase.classification?.type || 'Unknown'}</span>
                    </div>
                    <div class="case-info-item">
                        <strong style="font-size: 1.2rem; font-weight: 700;">Confidence Score</strong>
                        <span style="font-size: 1.2rem; font-weight: 600; margin-left: 5px;">
                            ${this.currentCase.classification?.confidence ? (this.currentCase.classification.confidence * 100).toFixed(1) + '%' : 'N/A'}
                        </span>
                    </div>
                    ${this.currentCase.media_trust_score ? `
                    <div class="case-info-item">
                        <strong>Media Trust Score</strong>
                        <span class="trust-score ${this.getTrustScoreClass(this.currentCase.media_trust_score)}">
                            ${this.currentCase.media_trust_score}%
                        </span>
                    </div>
                    ` : ''}
                    <div class="case-info-item">
                        <strong>Status</strong>
                        <span class="status-badge status-${this.currentCase.status}">${this.currentCase.status}</span>
                    </div>
                </div>

                <div class="case-detail-card">
                    <h3>Policy References</h3>
                    ${this.currentCase.policies?.clauses?.length > 0 ? 
                        this.currentCase.policies.clauses.map(clause => `
                            <div class="case-info-item">
                                <strong>${clause.id || 'N/A'}</strong>
                                <p>${clause.summary || 'No summary'}</p>
                            </div>
                        `).join('') : 
                        '<p>No policy references available.</p>'
                    }
                </div>

                <div class="case-detail-card">
                    <h3>Resolution Recommendation</h3>
                    <div class="case-info-item">
                        <strong>Action</strong>
                        <span>${this.currentCase.recommendation?.resolution?.join(', ') || 'N/A'}</span>
                    </div>
                    ${this.currentCase.recommendation?.amount ? `
                    <div class="case-info-item">
                        <strong>Amount</strong>
                        <span>${this.currentCase.recommendation.amount} ${this.currentCase.recommendation.currency || ''}</span>
                    </div>
                    ` : ''}
                    <div class="case-info-item">
                        <strong>Rationale</strong>
                        <p>${this.currentCase.recommendation?.rationale || 'No rationale provided'}</p>
                    </div>
                    <div class="case-info-item">
                        <strong>Policy Citations</strong>
                        <p>${this.currentCase.recommendation?.citations?.join(', ') || 'No citations'}</p>
                    </div>
                </div>
            </div>

            <div class="case-actions">
                <button class="btn-success" onclick="app.resolveCase('approve')">
                    <i class="fas fa-check"></i> Approve Resolution
                </button>
                <button class="btn-warning" onclick="app.resolveCase('escalate')">
                    <i class="fas fa-exclamation-triangle"></i> Escalate
                </button>
                <button class="btn-secondary" onclick="app.uploadDocuments()">
                    <i class="fas fa-upload"></i> Upload Documents
                </button>
                ${this.currentCase.supporting_documents?.length > 0 ? `
                <button class="btn-info" onclick="app.showDocumentAnalysis()">
                    <i class="fas fa-file-alt"></i> View Document Analysis
                </button>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'block';
    }

    getTrustScoreClass(score) {
        if (score >= 80) return 'trust-high';
        if (score >= 60) return 'trust-medium';
        return 'trust-low';
    }

    async resolveCase(action) {
        if (!confirm(`Are you sure you want to ${action} this resolution?`)) return;

        try {
            const response = await this.apiCall(
                `/api/cases/${this.currentCase.case_id}/resolve`,
                'POST',
                { action, notes: `Resolution ${action}d by agent` }
            );

            this.showSuccess(`Case ${action}d successfully`);
            this.closeModal(document.getElementById('case-modal'));
            this.loadDashboard();

        } catch (error) {
            console.error(`Failed to ${action} case:`, error);
            this.showError(`Failed to ${action} case.`);
        }
    }

    uploadDocuments() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt';
        
        input.onchange = async (e) => {
            const files = e.target.files;
            if (files.length === 0) return;
            
            try {
                const formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
                
                this.showLoading('Analyzing documents...');
                
                const response = await fetch(`/api/cases/${this.currentCase.case_id}/documents`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Upload failed');
                
                const result = await response.json();
                this.hideLoading();
                
                this.showSuccess(result.message);
                
                if (result.requires_escalation) {
                    this.showWarning('This case has been escalated due to high media trust score.');
                }
                
                // Refresh case details
                await this.openCase(this.currentCase.case_id);
                
            } catch (error) {
                console.error('Upload failed:', error);
                this.hideLoading();
                this.showError('Failed to upload documents.');
            }
        };
        
        input.click();
    }

    // Chatbot methods
toggleChatbot() {
    const chatbot = document.getElementById('chatbot-widget');
    chatbot.classList.toggle('open');
    
    const toggleBtn = document.getElementById('chatbot-toggle');
    const chevron = chatbot.querySelector('.fa-chevron-down');
    
    if (chatbot.classList.contains('open')) {
        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
        toggleBtn.style.opacity = '0.5';
        this.scrollChatToBottom();
    } else {
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
        toggleBtn.style.opacity = '1';
    }
}

addMessage(message, isUser = false) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    this.scrollChatToBottom();
}

scrollChatToBottom() {
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

handleQuickReply(action) {
    switch(action) {
        case 'show_cases':
            this.showOpenCasesInChat();
            break;
        case 'create_case':
            this.promptCreateCase();
            break;
        case 'help':
            this.showHelp();
            break;
        default:
            this.addMessage("I'm not sure how to help with that. Try one of the options above.");
    }
}

showOpenCasesInChat() {
    const openCases = this.cases.filter(c => c.status === 'open');
    
    if (openCases.length === 0) {
        this.addMessage("You don't have any open cases at the moment.");
        return;
    }
    
    this.addMessage(`You have ${openCases.length} open case(s):`);
    
    const casesList = openCases.map(caseItem => `
        <div class="case-item" onclick="app.handleCaseSelection('${caseItem.case_id}')">
            <div class="case-info">
                <span class="case-id">${caseItem.case_id}</span>
                <span class="case-amount">${caseItem.transaction?.amount || 0} ${caseItem.transaction?.currency || ''}</span>
            </div>
            <div>${caseItem.classification?.type || 'Unknown'}</div>
        </div>
    `).join('');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = casesList;
    
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = '<div class="message-content"><div class="case-list">' + casesList + '</div></div>';
    
    messagesContainer.appendChild(messageDiv);
    this.scrollChatToBottom();
}

handleCaseSelection(caseId) {
    const selectedCase = this.cases.find(c => c.case_id === caseId);
    if (!selectedCase) return;
    
    this.addMessage(`Selected case: ${caseId}`);
    this.showCaseActions(selectedCase);
}

showCaseActions(caseItem) {
    this.addMessage(`What would you like to do with case ${caseItem.case_id}?`);
    
    const actionsHtml = `
        <div class="chat-actions">
            <button class="chat-action-btn" onclick="app.viewCaseDetails('${caseItem.case_id}')">View Details</button>
            <button class="chat-action-btn" onclick="app.uploadDocumentsChat('${caseItem.case_id}')">Upload Documents</button>
            <button class="chat-action-btn" onclick="app.resolveCaseChat('${caseItem.case_id}', 'approve')">Approve</button>
            <button class="chat-action-btn" onclick="app.resolveCaseChat('${caseItem.case_id}', 'escalate')">Escalate</button>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = actionsHtml;
    
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = '<div class="message-content">' + actionsHtml + '</div>';
    
    messagesContainer.appendChild(messageDiv);
    this.scrollChatToBottom();
}

viewCaseDetails(caseId) {
    this.addMessage(`Opening case ${caseId} details...`, true);
    this.openCase(caseId);
    this.toggleChatbot(); // Close chatbot when opening case details
}

uploadDocumentsChat(caseId) {
    this.addMessage(`Preparing to upload documents for case ${caseId}...`, true);
    this.openCase(caseId);
    setTimeout(() => {
        this.uploadDocuments();
        this.toggleChatbot(); // Close chatbot when uploading documents
    }, 1000);
}

async resolveCaseChat(caseId, action) {
    this.addMessage(`${action === 'approve' ? 'Approving' : 'Escalating'} case ${caseId}...`, true);
    
    try {
        const response = await this.apiCall(
            `/api/cases/${caseId}/resolve`,
            'POST',
            { action, notes: `Resolution ${action}d via chatbot` }
        );
        
        this.addMessage(`Case ${caseId} has been ${action}d successfully!`);
        this.loadDashboard(); // Refresh dashboard data
        
    } catch (error) {
        console.error(`Failed to ${action} case:`, error);
        this.addMessage(`Failed to ${action} case. Please try again.`);
    }
}

promptCreateCase() {
    this.addMessage("To create a new case, please use the 'Create New Case' button on the dashboard or provide a transaction ID.");
    
    const promptHtml = `
        <div class="chat-actions">
            <button class="chat-action-btn" onclick="app.showCreateCaseModal()">Open Create Form</button>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = promptHtml;
    
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = '<div class="message-content">' + promptHtml + '</div>';
    
    messagesContainer.appendChild(messageDiv);
    this.scrollChatToBottom();
}

showHelp() {
    this.addMessage("I can help you with:");
    this.addMessage("• Viewing open cases");
    this.addMessage("• Creating new dispute cases");
    this.addMessage("• Managing existing cases");
    this.addMessage("• Uploading documents");
    this.addMessage("• Approving or escalating cases");
}

handleChatInput(event) {
    if (event.key === 'Enter') {
        this.sendMessage();
        event.preventDefault();
    }
}

sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (message) {
        this.addMessage(message, true);
        input.value = '';
        
        // Simple response logic
        setTimeout(() => {
            if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                this.addMessage("Hello! How can I help you with your dispute cases today?");
            } else if (message.toLowerCase().includes('case')) {
                this.showOpenCasesInChat();
            } else if (message.toLowerCase().includes('help')) {
                this.showHelp();
            } else {
                this.addMessage("I'm here to help with dispute cases. You can ask me about open cases or use the quick replies above.");
            }
        }, 500);
    }
}
    async showDocumentAnalysis() {
        try {
            const response = await this.apiCall(`/api/cases/${this.currentCase.case_id}/documents/analysis`, 'GET');
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>Document Analysis Results</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="analysis-header">
                            <h3>Overall Document Trust Analysis</h3>
                            <p class="overall-trust-score">Overall Trust Score: 
                                <span class="trust-score ${this.getTrustScoreClass(response.media_trust_score || 0)}">
                                    ${response.media_trust_score || 0}%
                                </span>
                            </p>
                        </div>
                        
                        <div class="documents-analysis">
                            ${response.document_analyses?.length > 0 ? 
                                response.document_analyses.map((analysis, index) => `
                                    <div class="document-analysis-card">
                                        <h4>${response.supporting_documents[index]?.original_filename || 'Document ' + (index + 1)}</h4>
                                        <div class="analysis-grid">
                                            <div class="analysis-item">
                                                <strong>Document Type:</strong>
                                                <span>${analysis.document_type || 'Unknown'}</span>
                                            </div>
                                            <div class="analysis-item">
                                                <strong>Trust Score:</strong>
                                                <span class="trust-score ${this.getTrustScoreClass(analysis.trust_score || 0)}">
                                                    ${analysis.trust_score || 0}%
                                                </span>
                                            </div>
                                            <div class="analysis-item">
                                                <strong>Authentic:</strong>
                                                <span class="${analysis.authentic ? 'status-success' : 'status-error'}">
                                                    ${analysis.authentic ? '✅ Yes' : '❌ No'}
                                                </span>
                                            </div>
                                            <div class="analysis-item">
                                                <strong>Relevant:</strong>
                                                <span class="${analysis.relevant ? 'status-success' : 'status-error'}">
                                                    ${analysis.relevant ? '✅ Yes' : '❌ No'}
                                                </span>
                                            </div>
                                            <div class="analysis-item">
                                                <strong>Matches Transaction:</strong>
                                                <span class="${analysis.matches_transaction ? 'status-success' : 'status-error'}">
                                                    ${analysis.matches_transaction ? '✅ Yes' : '❌ No'}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="reasoning">
                                            <strong>AI Analysis Reasoning:</strong>
                                            <p>${analysis.reasoning || 'No analysis reasoning available.'}</p>
                                        </div>
                                    </div>
                                `).join('') : 
                                '<p>No documents have been analyzed yet.</p>'
                            }
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add close event
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Failed to load document analysis:', error);
            this.showError('Failed to load document analysis.');
        }
    }

    showCreateCaseModal() {
        document.getElementById('create-case-modal').style.display = 'block';
    }

    async createNewCase() {
        const transactionId = document.getElementById('transaction-id').value;
        if (!transactionId) {
            this.showError('Please enter a transaction ID');
            return;
        }

        try {
            this.showLoading('Creating case...');
            
            const response = await this.apiCall('/api/disputes', 'POST', {
                transaction_id: transactionId
            });

            this.hideLoading();
            this.showSuccess(`Case created: ${response.case_id}`);
            this.closeModal(document.getElementById('create-case-modal'));
            this.loadDashboard();

        } catch (error) {
            console.error('Failed to create case:', error);
            this.hideLoading();
            this.showError('Failed to create case. Please check the transaction ID.');
        }
    }

    closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    showLoading(message = 'Loading...') {
        // Remove existing loading overlay if any
        this.hideLoading();
        
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(loadingOverlay);
    }

    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            document.body.removeChild(loadingOverlay);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            credentials: 'include',
            headers: {}
        };

        if (data && method !== 'GET') {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, config);

        if (!response.ok) {
            if (response.status === 401) {
                // Clear any invalid session
                this.currentUser = null;
                window.location.href = '/login';
                throw new Error('Authentication required');
            }
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DisputeHandler();
});