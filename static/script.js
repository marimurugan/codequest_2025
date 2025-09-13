class DisputeHandler {
    constructor() {
        this.currentUser = null;
        this.cases = [];
        this.currentCase = null;
        this.chatbotInitialized = false;
        this.chatbot = new EnhancedChatbot();
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
        
        // Initialize JUNO with welcome message after delay
        setTimeout(() => {
            this.showChatbotWelcome();
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

        // JUNO chatbot controls
        const minimizeChatbot = document.getElementById('minimize-chatbot');
        if (minimizeChatbot) {
            minimizeChatbot.addEventListener('click', () => this.minimizeChatbot());
        }

        const closeChatbot = document.getElementById('close-chatbot');
        if (closeChatbot) {
            closeChatbot.addEventListener('click', () => this.closeChatbot());
        }

        const junoToggle = document.getElementById('juno-toggle');
        if (junoToggle) {
            junoToggle.addEventListener('click', () => this.toggleChatbot());
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

                <div class="case-detail-card">
                    <h3>AI Analysis</h3>
                    <div class="case-info-item">
                        <strong>Dispute Type</strong>
                        <span>${this.currentCase.classification?.type || 'Unknown'}</span>
                    </div>
                    <div class="case-info-item">
                        <strong>Confidence Score</strong>
                        <span>${this.currentCase.classification?.confidence ? (this.currentCase.classification.confidence * 100).toFixed(1) + '%' : 'N/A'}</span>
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

    // ==================== JUNO CHATBOT FUNCTIONALITY ====================

    showChatbotWelcome() {
        if (!this.chatbotInitialized) {
            this.addMessage("👋 Hello! I'm JUNO, your AI Dispute Assistant", false);
            setTimeout(() => {
                this.addMessage("I'm here to help you manage cases, analyze documents, and answer questions about dispute resolution.", false);
            }, 800);
            setTimeout(() => {
                this.addMessage("How can I assist you today?", false);
                this.showEnhancedQuickReplies();
            }, 1600);
            this.chatbotInitialized = true;
        }
    }

    toggleChatbot() {
        const chatbot = document.getElementById('juno-chatbot');
        const toggleBtn = document.getElementById('juno-toggle');
        
        if (window.innerWidth <= 768) {
            // Mobile view - toggle visibility
            chatbot.classList.toggle('open');
            toggleBtn.style.display = chatbot.classList.contains('open') ? 'none' : 'flex';
        } else {
            // Desktop view - toggle minimization
            chatbot.classList.toggle('minimized');
            toggleBtn.style.display = chatbot.classList.contains('minimized') ? 'flex' : 'none';
        }
        
        if (chatbot.classList.contains('minimized') || chatbot.classList.contains('open')) {
            this.scrollChatToBottom();
            
            // Show welcome message when opening
            if (!this.chatbotInitialized) {
                this.showChatbotWelcome();
                this.chatbotInitialized = true;
            }
        }
    }

    minimizeChatbot() {
        const chatbot = document.getElementById('juno-chatbot');
        const toggleBtn = document.getElementById('juno-toggle');
        
        if (window.innerWidth <= 768) {
            chatbot.classList.remove('open');
            toggleBtn.style.display = 'flex';
        } else {
            chatbot.classList.add('minimized');
            toggleBtn.style.display = 'flex';
        }
    }

    closeChatbot() {
        const chatbot = document.getElementById('juno-chatbot');
        const toggleBtn = document.getElementById('juno-toggle');
        
        if (window.innerWidth <= 768) {
            chatbot.classList.remove('open');
        } else {
            chatbot.classList.add('minimized');
        }
        
        toggleBtn.style.display = 'flex';
    }

    addMessage(message, isUser = false) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        // Add typing indicator for bot messages
        if (!isUser) {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        this.scrollChatToBottom();
    }

    scrollChatToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="typing-text">JUNO is thinking...</div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        this.scrollChatToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showEnhancedQuickReplies() {
        const quickRepliesHtml = `
            <button class="quick-reply" onclick="app.handleQuickReply('open_cases')">
                <i class="fas fa-folder-open"></i>
                <span>View Open Cases</span>
            </button>
            <button class="quick-reply" onclick="app.handleQuickReply('create_case')">
                <i class="fas fa-plus-circle"></i>
                <span>Create New Case</span>
            </button>
            <button class="quick-reply" onclick="app.handleQuickReply('upload_docs')">
                <i class="fas fa-file-upload"></i>
                <span>Upload Documents</span>
            </button>
            <button class="quick-reply" onclick="app.handleQuickReply('ask_question')">
                <i class="fas fa-question-circle"></i>
                <span>Ask Question</span>
            </button>
            <button class="quick-reply" onclick="app.handleQuickReply('policy_info')">
                <i class="fas fa-book"></i>
                <span>Policy Information</span>
            </button>
            <button class="quick-reply" onclick="app.handleQuickReply('help')">
                <i class="fas fa-life-ring"></i>
                <span>Get Help</span>
            </button>
        `;

        document.getElementById('quick-replies').innerHTML = quickRepliesHtml;
    }

    handleQuickReply(action) {
        // Clear quick replies when an action is taken
        document.getElementById('quick-replies').innerHTML = '';
        
        this.addMessage(this.getQuickReplyText(action), true);
        
        switch(action) {
            case 'open_cases':
                setTimeout(() => this.showOpenCasesInChat(), 500);
                break;
            case 'create_case':
                setTimeout(() => this.promptCreateCase(), 500);
                break;
            case 'upload_docs':
                setTimeout(() => this.promptDocumentUpload(), 500);
                break;
            case 'ask_question':
                setTimeout(() => this.promptQuestion(), 500);
                break;
            case 'policy_info':
                setTimeout(() => this.showPolicyOptions(), 500);
                break;
            case 'help':
                setTimeout(() => this.showHelp(), 500);
                break;
        }
    }

    getQuickReplyText(action) {
        const texts = {
            'open_cases': 'Show me my open cases',
            'create_case': 'I want to create a new case',
            'upload_docs': 'I need to upload documents',
            'ask_question': 'I have a question',
            'policy_info': 'Tell me about policies',
            'help': 'I need help'
        };
        return texts[action] || 'I need assistance';
    }

    async showOpenCasesInChat() {
        const openCases = this.cases.filter(c => c.status === 'open');
        
        if (openCases.length === 0) {
            this.addMessage("🎉 Excellent! You have no open cases. Everything is resolved and up to date.", false);
            return;
        }

        this.addMessage(`I found ${openCases.length} open case${openCases.length > 1 ? 's' : ''}:`, false);

        openCases.forEach((caseItem, index) => {
            setTimeout(() => {
                const caseHtml = `
                    <div class="case-card" onclick="app.handleCaseSelection('${caseItem.case_id}')">
                        <div class="case-header">
                            <span class="case-id">${caseItem.case_id}</span>
                            <span class="case-amount">${caseItem.transaction?.amount || 0} ${caseItem.transaction?.currency || 'USD'}</span>
                        </div>
                        <div class="case-details">
                            <div class="case-detail-item">
                                <i class="fas fa-store"></i>
                                <span>${caseItem.transaction?.merchant || 'Unknown Merchant'}</span>
                            </div>
                            <div class="case-detail-item">
                                <i class="fas fa-tag"></i>
                                <span>${caseItem.classification?.type || 'Unknown Type'}</span>
                            </div>
                            <div class="case-detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>${new Date(caseItem.created_date).toLocaleDateString()}</span>
                            </div>
                            <div class="case-detail-item">
                                <i class="fas fa-chart-line"></i>
                                <span>Score: ${caseItem.media_trust_score || 'N/A'}%</span>
                            </div>
                        </div>
                    </div>
                `;

                const messageDiv = document.createElement('div');
                messageDiv.className = 'message bot-message';
                messageDiv.innerHTML = `
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content">${caseHtml}</div>
                `;

                document.getElementById('chatbot-messages').appendChild(messageDiv);
                this.scrollChatToBottom();

                // Show actions after last case
                if (index === openCases.length - 1) {
                    setTimeout(() => {
                        this.showCaseActions();
                    }, 300);
                }
            }, index * 400);
        });
    }

    handleCaseSelection(caseId) {
        const selectedCase = this.cases.find(c => c.case_id === caseId);
        if (!selectedCase) return;
        
        this.addMessage(`Selected case: ${caseId}`, true);
        this.showCaseActions(selectedCase);
    }

    showCaseActions(caseItem) {
        this.addMessage(`What would you like to do with case ${caseItem.case_id}?`, false);
        
        const actionsHtml = `
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="app.viewCaseDetails('${caseItem.case_id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Open Details</span>
                </button>
                <button class="chat-action-btn" onclick="app.uploadDocumentsChat('${caseItem.case_id}')">
                    <i class="fas fa-file-upload"></i>
                    <span>Upload Docs</span>
                </button>
                <button class="chat-action-btn" onclick="app.resolveCaseChat('${caseItem.case_id}', 'approve')">
                    <i class="fas fa-check"></i>
                    <span>Approve</span>
                </button>
                <button class="chat-action-btn" onclick="app.resolveCaseChat('${caseItem.case_id}', 'escalate')">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Escalate</span>
                </button>
            </div>
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">${actionsHtml}</div>
        `;

        document.getElementById('chatbot-messages').appendChild(messageDiv);
        this.scrollChatToBottom();
    }

    viewCaseDetails(caseId) {
        this.addMessage(`Opening case ${caseId} details...`, true);
        this.openCase(caseId);
        this.minimizeChatbot();
    }

    uploadDocumentsChat(caseId) {
        this.addMessage(`Preparing to upload documents for case ${caseId}...`, true);
        this.openCase(caseId);
        setTimeout(() => {
            this.uploadDocuments();
            this.minimizeChatbot();
        }, 1000);
    }

    async resolveCaseChat(caseId, action) {
        this.addMessage(`${action === 'approve' ? 'Approving' : 'Escalating'} case ${caseId}...`, true);
        
        try {
            const response = await this.apiCall(
                `/api/cases/${caseId}/resolve`,
                'POST',
                { action, notes: `Resolution ${action}d via JUNO chatbot` }
            );
            
            this.addMessage(`Case ${caseId} has been ${action}d successfully!`, false);
            this.loadDashboard();
            
        } catch (error) {
            console.error(`Failed to ${action} case:`, error);
            this.addMessage(`Failed to ${action} case. Please try again.`, false);
        }
    }

    promptCreateCase() {
        this.addMessage("To create a new case, I'll need some information:", false);
        
        setTimeout(() => {
            this.addMessage("1. Transaction ID 📄", false);
        }, 400);
        
        setTimeout(() => {
            this.addMessage("2. Customer details 👤", false);
        }, 800);
        
        setTimeout(() => {
            this.addMessage("3. Reason for dispute ❓", false);
        }, 1200);
        
        setTimeout(() => {
            const actionsHtml = `
                <div class="chat-actions">
                    <button class="chat-action-btn" onclick="app.showCreateCaseModal()">
                        <i class="fas fa-external-link-alt"></i>
                        <span>Open Case Form</span>
                    </button>
                    <button class="chat-action-btn" onclick="app.showEnhancedQuickReplies()">
                        <i class="fas fa-undo"></i>
                        <span>Back to Menu</span>
                    </button>
                </div>
            `;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>You can create a case through the form for better experience!</p>
                    ${actionsHtml}
                </div>
            `;
            
            document.getElementById('chatbot-messages').appendChild(messageDiv);
            this.scrollChatToBottom();
        }, 1600);
    }

    promptDocumentUpload() {
        this.addMessage("I can help you upload documents for your cases. Here's what I need:", false);
        
        setTimeout(() => {
            this.addMessage("1. Case ID 📋", false);
        }, 400);
        
        setTimeout(() => {
            this.addMessage("2. Document files 📁", false);
        }, 800);
        
        setTimeout(() => {
            this.addMessage("3. Document type 🏷️", false);
        }, 1200);
        
        setTimeout(() => {
            this.addMessage("You can upload documents through the case details page or use the attachment button below.", false);
            this.showEnhancedQuickReplies();
        }, 1600);
    }

    promptQuestion() {
        this.addMessage("I'm ready to answer your questions! I have knowledge about:", false);
        
        const knowledgeAreas = [
            "Refund policies and procedures",
            "Case escalation processes",
            "Document requirements",
            "Resolution timelines (SLA)",
            "Fraud prevention measures",
            "Customer support information"
        ];
        
        knowledgeAreas.forEach((area, index) => {
            setTimeout(() => {
                this.addMessage(`• ${area}`, false);
            }, index * 300);
        });
        
        setTimeout(() => {
            this.addMessage("What would you like to know?", false);
        }, knowledgeAreas.length * 300 + 300);
    }

    showPolicyOptions() {
        this.addMessage("I can provide information on these policy areas:", false);
        
        const policies = [
            "Refund and return policies",
            "Dispute resolution procedures",
            "Documentation requirements",
            "Escalation protocols",
            "Service level agreements (SLA)",
            "Fraud prevention guidelines"
        ];
        
        policies.forEach((policy, index) => {
            setTimeout(() => {
                this.addMessage(`• ${policy}`, false);
            }, index * 300);
        });
        
        setTimeout(() => {
            this.addMessage("Which policy area are you interested in?", false);
        }, policies.length * 300 + 300);
    }

    showHelp() {
        this.addMessage("Here's how I can help you: 🚀", false);
        
        const helpItems = [
            { icon: "📋", text: "View and manage open dispute cases" },
            { icon: "📁", text: "Upload documents for case verification" },
            { icon: "✅", text: "Approve or escalate case resolutions" },
            { icon: "🆕", text: "Create new dispute cases easily" },
            { icon: "📊", text: "Check case status and details" },
            { icon: "🤖", text: "Get AI-powered recommendations" },
            { icon: "❓", text: "Answer policy and procedure questions" },
            { icon: "⚡", text: "Provide quick dispute resolution guidance" }
        ];
        
        helpItems.forEach((item, index) => {
            setTimeout(() => {
                this.addMessage(`${item.icon} ${item.text}`, false);
            }, index * 250);
        });
        
        setTimeout(() => {
            this.addMessage("What would you like to do today?", false);
            this.showEnhancedQuickReplies();
        }, helpItems.length * 250 + 300);
    }

    toggleAttachment() {
        const attachmentMenu = document.getElementById('attachment-menu');
        attachmentMenu.classList.toggle('open');
    }

    uploadDocument() {
        this.addMessage("Document upload feature activated...", false);
        this.toggleAttachment();
        // Actual file upload would be implemented here
    }

    uploadImage() {
        this.addMessage("Image upload feature activated...", false);
        this.toggleAttachment();
        // Actual image upload would be implemented here
    }

    handleChatInput(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
            event.preventDefault();
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage(message, true);
            input.value = '';
            
            // Show typing indicator - REMOVED THE DUPLICATE CALL
            // Use RAG-powered response
            await this.chatbot.handleUserMessage(message);
        }
    }

    openDashboard() {
        this.addMessage("Opening main dashboard...", true);
        this.minimizeChatbot();
        // Dashboard is already open, just ensure we're on the right view
    }

    askForHelp() {
        this.addMessage("I need additional help", true);
        setTimeout(() => this.showHelp(), 500);
    }
}

// Enhanced Chatbot with RAG Integration
class EnhancedChatbot {
    constructor() {
        this.knowledgeBase = {
            policies: [
                {
                    question: "What is your refund policy?",
                    answer: "We offer full refunds for unauthorized transactions within 90 days. For billing errors, refunds are processed within 30 days. Merchant disputes may take 5-7 business days for resolution.",
                    source: "Refund Policy v2.1, Section 4.3"
                },
                {
                    question: "How to handle duplicate charges?",
                    answer: "Duplicate charges are automatically flagged by our system. Submit proof of duplicate transaction (screenshot or statement), and we'll process refund within 24 hours. No additional documentation required for amounts under $500.",
                    source: "Fraud Prevention Guide, Page 12"
                },
                {
                    question: "What documents are needed for dispute?",
                    answer: "Required documents: Transaction receipt (mandatory), government ID, proof of communication with merchant, and any supporting evidence. For amounts over $1000, notarized affidavit may be required.",
                    source: "Dispute Resolution Handbook, Chapter 3"
                }
            ],
            procedures: [
                {
                    question: "How to escalate a case?",
                    answer: "Cases with trust score above 90% are automatically escalated to senior agents. Manual escalation requires supervisor approval and detailed case notes. Use the 'Escalate' button in case details or request via chatbot.",
                    source: "Escalation Protocol v1.2"
                },
                {
                    question: "What is the SLA for dispute resolution?",
                    answer: "Standard resolution time is 5-7 business days. Priority cases are resolved within 48 hours. Emergency fraud cases are handled within 24 hours. All times are business days excluding weekends and holidays.",
                    source: "Service Level Agreement 2024, Section 8.2"
                },
                {
                    question: "How to check case status?",
                    answer: "Case status can be checked through the dashboard, via chatbot by providing case ID, or by contacting support. Real-time updates are available for all open cases through the case management system.",
                    source: "Case Management Procedures, Page 7"
                }
            ]
        };
        this.chatHistory = [];
    }

    async generateRAGResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Search knowledge base for relevant information
        const relevantKnowledge = this.searchKnowledgeBase(lowerMessage);
        
        if (relevantKnowledge) {
            return this.formatKnowledgeResponse(relevantKnowledge);
        }

        // If no specific knowledge found, use general response with context
        return this.generateContextualResponse(lowerMessage);
    }

    searchKnowledgeBase(query) {
        const allKnowledge = [...this.knowledgeBase.policies, ...this.knowledgeBase.procedures];
        
        const relevant = allKnowledge.filter(item =>
            item.question.toLowerCase().includes(query) ||
            query.includes(item.question.toLowerCase().split(' ')[0]) ||
            this.calculateSimilarity(query, item.question.toLowerCase()) > 0.3
        );

        if (relevant.length > 0) {
            // Return most relevant match based on similarity score
            return relevant.sort((a, b) => 
                this.calculateSimilarity(query, b.question.toLowerCase()) - 
                this.calculateSimilarity(query, a.question.toLowerCase())
            )[0];
        }

        return null;
    }

    calculateSimilarity(str1, str2) {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    formatKnowledgeResponse(knowledge) {
        return `
            <div class="knowledge-response">
                <div class="knowledge-title">
                    <i class="fas fa-lightbulb"></i>
                    <span>Based on our knowledge base:</span>
                </div>
                <div class="knowledge-content">
                    <p>${knowledge.answer}</p>
                </div>
                <div class="knowledge-source">
                    <i class="fas fa-book"></i>
                    <span>Source: ${knowledge.source}</span>
                </div>
            </div>
        `;
    }

    generateContextualResponse(message) {
        const context = this.getConversationContext();
        
        if (message.includes('refund') || message.includes('money back')) {
            return "For refund requests, I'll need the transaction ID and reason for dispute. Would you like to check your open cases or create a new refund request?";
        }
        
        if (message.includes('case status') || message.includes('status')) {
            return "I can check your case status. Please provide the case ID or let me show you your open cases.";
        }
        
        if (message.includes('document') || message.includes('upload')) {
            return "To upload documents, you'll need the case ID. I can help you attach supporting files for your dispute. What type of document are you looking to upload?";
        }
        
        if (message.includes('policy') || message.includes('rule')) {
            return "I have access to our comprehensive dispute resolution policies. Are you looking for information about refunds, escalations, documentation, or something else?";
        }
        
        if (message.includes('time') || message.includes('how long')) {
            return "Our standard resolution time is 5-7 business days. Priority cases are handled within 48 hours. Is this for a specific case or general information?";
        }
        
        if (message.includes('help') || message.includes('support')) {
            return "I'm here to help! I can assist with case management, document uploads, policy information, and answer questions about our dispute process. What do you need help with?";
        }
        
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello! 👋 I'm JUNO, your AI Dispute Assistant. I can help you manage cases, answer questions, and provide support using our knowledge base. How can I assist you today?";
        }
        
        if (message.includes('thank')) {
            return "You're welcome! 😊 Is there anything else I can help you with regarding dispute resolution?";
        }
        
        // Default response with context awareness
        return "I'm here to help with dispute resolution. I can assist with case management, document uploads, policy information, and general questions about our dispute process. What would you like to know or do today?";
    }

    getConversationContext() {
        // Analyze recent messages for context
        const recentMessages = this.chatHistory.slice(-5);
        return recentMessages.join(' ');
    }

    async handleUserMessage(message) {
        this.chatHistory.push(`User: ${message}`);
        
        // Show typing indicator - KEEP ONLY THIS ONE
        this.showTypingIndicator();
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Generate response using RAG
        const response = await this.generateRAGResponse(message);
        
        this.hideTypingIndicator();
        this.addMessage(response, false);
        
        this.chatHistory.push(`Bot: ${response}`);
        
        // Keep history manageable
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(-10);
        }
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="typing-text">JUNO is thinking...</div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        this.scrollChatToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    addMessage(message, isUser = false) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        if (!isUser) {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        this.scrollChatToBottom();
    }

    scrollChatToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DisputeHandler();
});