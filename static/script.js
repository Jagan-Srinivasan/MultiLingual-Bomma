// ====== GLOBAL STATE ======
let isTyping = false;
let isRecording = false;
let recognition = null;
let currentLanguage = localStorage.getItem('preferredLanguage') || 'english';
let isSpeakerEnabled = localStorage.getItem('speakerEnabled') === 'true';
let isCurrentlySpeaking = false;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let currentConversationId = null;
let conversationsList = [];
let settings = {
    theme: localStorage.getItem('theme') || 'system',
    userName: localStorage.getItem('userName') || 'Bomma AI',
    avatar: localStorage.getItem('userAvatar') || '',
    voice: localStorage.getItem('preferredVoice') || ''
};

// ====== INIT ======
window.addEventListener('DOMContentLoaded', () => {
    if (window.welcomeMessageInterval) clearInterval(window.welcomeMessageInterval);
});

document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    setTimeout(() => {
        hideLoadingScreen();
        loadConversationsList();
        loadConversation();
        setupInputHandlers();
        setupVoiceRecognition();
        initializeMobileLayout();
        updateUILanguage();
        addLanguageSwitcher();
        initializeSpeaker();
        initializeMobileMenu();
        loadSettings();
        setupSettingsModal();
        setupThemeToggle();
        setupKeyboardShortcuts();
    }, 1000);
});

// ====== CHAT HISTORY ======
async function loadConversationsList() {
    try {
        const response = await fetch('/api/conversations/list');
        const data = await response.json();
        conversationsList = data.conversations || [];
        renderChatHistoryList();
    } catch (e) {
        showToast('Failed to load chat history');
    }
}

function renderChatHistoryList() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    chatHistory.innerHTML = '';
    if (!conversationsList.length) {
        chatHistory.innerHTML = `<div class="chat-item chat-item-empty" tabindex="0">No previous conversations</div>`;
        return;
    }
    conversationsList.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'chat-item' + (conv.id === currentConversationId ? ' active' : '');
        item.tabIndex = 0;
        item.innerHTML = `<strong>${conv.title || 'Conversation'}</strong>
            <span class="chat-item-date">${new Date(conv.updated_at).toLocaleString()}</span>`;
        item.onclick = () => switchConversation(conv.id);
        item.onkeydown = (e) => { if (e.key === 'Enter') switchConversation(conv.id); };
        chatHistory.appendChild(item);
    });
}

async function switchConversation(id) {
    if (id === currentConversationId) return;
    currentConversationId = id;
    await loadConversation();
    highlightActiveConversation();
}

function highlightActiveConversation() {
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.onclick && item.onclick.toString().includes(currentConversationId)) {
            item.classList.add('active');
        }
    });
}

// ====== USER PROFILE/SETTINGS ======
function loadSettings() {
    document.getElementById('userName').textContent = settings.userName;
    if (settings.avatar) {
        document.getElementById('userAvatar').style.backgroundImage = `url(${settings.avatar})`;
        document.getElementById('userAvatar').innerHTML = '';
    }
    setTheme(settings.theme);
}

function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const openBtn = document.getElementById('profileBtn');
    const closeBtn = document.getElementById('closeSettings');

    if (openBtn) openBtn.onclick = () => { modal.style.display = 'block'; modal.focus(); };
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    modal.addEventListener('keydown', (e)=>{if(e.key==="Escape")modal.style.display='none';});

    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('userNameInput').value = settings.userName;

    fillVoiceSelect();
    document.getElementById('voiceSelect').value = settings.voice || '';

    document.getElementById('saveSettingsBtn').onclick = () => {
        settings.theme = document.getElementById('themeSelect').value;
        settings.userName = document.getElementById('userNameInput').value || "Bomma AI";
        settings.voice = document.getElementById('voiceSelect').value;
        localStorage.setItem('theme', settings.theme);
        localStorage.setItem('userName', settings.userName);
        localStorage.setItem('preferredVoice', settings.voice);
        document.getElementById('userName').textContent = settings.userName;
        setTheme(settings.theme);

        const avatarFile = document.getElementById('avatarInput').files[0];
        if (avatarFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                settings.avatar = e.target.result;
                localStorage.setItem('userAvatar', settings.avatar);
                document.getElementById('userAvatar').style.backgroundImage = `url(${settings.avatar})`;
                document.getElementById('userAvatar').innerHTML = '';
            };
            reader.readAsDataURL(avatarFile);
        }
        document.getElementById('settingsModal').style.display = 'none';
    };
}

function fillVoiceSelect() {
    const select = document.getElementById('voiceSelect');
    if (!select) return;
    select.innerHTML = '';
    speechSynthesis.getVoices().forEach(voice => {
        const opt = document.createElement('option');
        opt.value = voice.name;
        opt.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(opt);
    });
}

// ====== THEME CUSTOMIZATION ======
function setupThemeToggle() {
    document.getElementById('themeBtn').onclick = () => {
        const next = settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark';
        settings.theme = next;
        localStorage.setItem('theme', next);
        setTheme(next);
        document.getElementById('themeSelect').value = next;
    };
}
function setTheme(theme) {
    if (theme === 'system') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
}

// ====== TOAST NOTIFICATIONS ======
function showToast(msg, duration=2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), duration);
}

// ====== KEYBOARD SHORTCUTS ======
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); newChat(); }
        if (e.key === '/' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault(); document.getElementById('messageInput').focus();
        }
        if (e.key === 'Escape') {
            document.getElementById('settingsModal').style.display = 'none';
        }
    });
}

// ====== MESSAGE ACTIONS (COPY/DELETE/EDIT/RATE) ======
function addMessage(content, role, msgId=null) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    const messages = messagesContainer.querySelectorAll('.message');
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (messages.length === 0 && welcomeMessage) welcomeMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (msgId) messageDiv.dataset.msgId = msgId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = (role === 'user') ?
        (settings.avatar ? `<img src="${settings.avatar}" alt="User" />` : '<i class="fas fa-user"></i>') :
        '<i class="fas fa-brain"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // Use marked.js and highlight.js for markdown/code
    let formatted = '';
    try {
        formatted = marked.parse(content, {
            highlight: (str, lang) => {
                if (window.hljs && lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(str, { language: lang }).value;
                }
                return str;
            }
        });
    } catch {
        formatted = formatMessage(content);
    }
    messageContent.innerHTML = formatted;

    // Message actions
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.innerHTML = `
        <button class="copy-btn" title="Copy"><i class="fas fa-copy"></i></button>
        <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
        ${role === 'user' ? `<button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>` : ''}
        ${role === 'assistant' ? `<button class="rate-btn" title="Feedback"><i class="fas fa-thumbs-up"></i></button>
        <button class="rate-btn" title="Feedback"><i class="fas fa-thumbs-down"></i></button>` : ''}
    `;
    messageContent.appendChild(actions);

    actions.querySelector('.copy-btn').onclick = () => {
        navigator.clipboard.writeText(content);
        showToast('Copied!');
    };
    actions.querySelector('.delete-btn').onclick = () => {
        messageDiv.remove();
        // Optionally call backend to delete message by msgId
    };
    if (role === 'user') {
        actions.querySelector('.edit-btn').onclick = () => {
            const old = content;
            const area = document.createElement('textarea');
            area.value = old;
            messageContent.innerHTML = '';
            messageContent.appendChild(area);
            area.focus();
            area.onblur = () => {
                const newMsg = area.value.trim();
                if (newMsg && newMsg !== old) {
                    messageContent.innerHTML = newMsg;
                } else {
                    messageContent.innerHTML = old;
                }
                messageContent.appendChild(actions);
            };
        };
    }
    if (role === 'assistant') {
        const rateBtns = actions.querySelectorAll('.rate-btn');
        rateBtns[0].onclick = () => showToast('Thanks for your feedback!');
        rateBtns[1].onclick = () => showToast('We\'ll try to improve!');
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (role === 'assistant') speakMessage(content);
}

// ====== FILE & IMAGE UPLOADS ======
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!(/\.(pdf|docx|txt)$/i).test(file.name)) {
        showToast('Invalid file type');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/upload-file', { method: 'POST', body: formData })
        .then(r => r.json()).then(res => {
            if (res.summary) addMessage(res.summary, 'assistant');
            else showToast('File uploaded, but no summary returned.');
        }).catch(()=>showToast('Failed to upload file.'));
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            addImageMessage(imageDataUrl, 'user');
            fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageDataUrl })
            })
            .then(r => r.json())
            .then(res => addMessage(res.description || "Image analysis not available.", 'assistant'))
            .catch(() => addMessage("Image analysis failed.", 'assistant'));
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    } else {
        showToast("Please select a valid image file.");
    }
}

function addImageMessage(imageDataUrl, role) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) welcomeMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-user"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const img = document.createElement('img');
    img.src = imageDataUrl;
    img.style.maxWidth = '300px';
    img.style.maxHeight = '300px';
    img.style.borderRadius = '8px';
    img.style.objectFit = 'cover';

    messageContent.appendChild(img);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ====== CHAT/VOICE/INPUT FUNCTIONS ======
function setupInputHandlers() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (messageInput && sendBtn) {
        messageInput.addEventListener('input', function() {
            sendBtn.disabled = !this.value.trim();
            autoResize(this);
        });
        messageInput.addEventListener('keydown', handleKeyDown);
    }
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'flex';
}
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    }
}

function initializeMobileLayout() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }
}
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}
function initializeMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', toggleMobileMenu);
        overlay.addEventListener('click', toggleMobileMenu);
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ====== VOICE/SPEAKER ======
function initializeSpeaker() {
    const speakerBtn = document.getElementById('speakerBtn');
    if (speakerBtn) {
        speakerBtn.classList.toggle('active', isSpeakerEnabled);
        speakerBtn.innerHTML = `<i class="fas fa-volume-${isSpeakerEnabled ? 'up' : 'mute'}"></i>`;
    }
}
function toggleSpeaker() {
    isSpeakerEnabled = !isSpeakerEnabled;
    localStorage.setItem('speakerEnabled', isSpeakerEnabled);
    const speakerBtn = document.getElementById('speakerBtn');
    if (speakerBtn) {
        speakerBtn.classList.toggle('active', isSpeakerEnabled);
        speakerBtn.innerHTML = `<i class="fas fa-volume-${isSpeakerEnabled ? 'up' : 'mute'}"></i>`;
    }
    if (!isSpeakerEnabled && isCurrentlySpeaking) stopSpeaking();
}
function stopSpeaking() {
    if (currentUtterance) {
        speechSynthesis.cancel();
        isCurrentlySpeaking = false;
        currentUtterance = null;
    }
}
function speakMessage(text) {
    if (!isSpeakerEnabled || !speechSynthesis) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { 'english': 'en-US', 'telugu': 'te-IN', 'tamil': 'ta-IN' };
    utterance.lang = langMap[currentLanguage] || 'en-US';
    const voices = speechSynthesis.getVoices();
    let preferredVoice = null;
    if (settings.voice) {
        preferredVoice = voices.find(v => v.name === settings.voice);
    }
    if (!preferredVoice) {
        preferredVoice = voices.find(voice =>
            voice.lang === utterance.lang && /female|girl|woman/i.test(voice.name)
        ) || voices.find(voice => voice.lang === utterance.lang);
    }
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.15; utterance.pitch = 1.5; utterance.volume = 1.0;
    utterance.onstart = () => { isCurrentlySpeaking = true; };
    utterance.onend = () => { isCurrentlySpeaking = false; currentUtterance = null; };
    utterance.onerror = () => { isCurrentlySpeaking = false; currentUtterance = null; };
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}
function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        const recognitionLanguages = { english: 'en-US', telugu: 'te-IN', tamil: 'ta-IN' };
        recognition.lang = recognitionLanguages[currentLanguage];
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = transcript;
                document.getElementById('sendBtn').disabled = false;
            }
        };
        recognition.onstart = function() {
            isRecording = true;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceBtn.classList.add('recording');
            }
        };
        recognition.onend = function() {
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.classList.remove('recording');
            }
        };
    }
}
function toggleVoiceRecording() {
    if (!recognition) {
        alert(translations[currentLanguage].voiceNotSupported);
        return;
    }
    if (isRecording) recognition.stop();
    else recognition.start();
}

// ====== LANGUAGE SWITCHER ======
function addLanguageSwitcher() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !headerRight.querySelector('.language-switcher')) {
        const languageSwitcher = document.createElement('div');
        languageSwitcher.className = 'language-switcher';
        languageSwitcher.innerHTML = `
            <button onclick="switchLanguage('english')" class="lang-btn ${currentLanguage === 'english' ? 'active' : ''}" title="English">EN</button>
            <button onclick="switchLanguage('telugu')" class="lang-btn ${currentLanguage === 'telugu' ? 'active' : ''}" title="తెలుగు">తె</button>
            <button onclick="switchLanguage('tamil')" class="lang-btn ${currentLanguage === 'tamil' ? 'active' : ''}" title="தமிழ்">த</button>
        `;
        headerRight.insertBefore(languageSwitcher, headerRight.firstChild);
    }
}
function switchLanguage(language) {
    if (translations[language]) {
        stopSpeaking();
        currentLanguage = language;
        localStorage.setItem('preferredLanguage', language);
        updateUILanguage();
        setupVoiceRecognition();
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(language)) btn.classList.add('active');
        });
    }
}
function updateUILanguage() {
    try {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[currentLanguage] && translations[currentLanguage][key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[currentLanguage][key];
                } else {
                    element.textContent = translations[currentLanguage][key];
                }
            }
        });
    } catch (error) {
        console.error('Error updating UI language:', error);
    }
}

// ====== CHAT MANAGEMENT ======
async function newChat() {
    try {
        const response = await fetch('/api/new-chat', { method: 'POST' });
        if (response.ok) {
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = getWelcomeMessageHTML();
                updateUILanguage();
            }
            loadConversationsList();
        }
    } catch (error) { showToast('Error starting new chat'); }
}

async function clearHistory() {
    if (confirm(translations[currentLanguage].clearConfirm)) {
        try {
            const response = await fetch('/api/clear-history', { method: 'POST' });
            if (response.ok) {
                const messagesContainer = document.getElementById('messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = getWelcomeMessageHTML();
                    updateUILanguage();
                }
                loadConversationsList();
            }
        } catch (error) { showToast('Error clearing history'); }
    }
}

async function loadConversation() {
    try {
        let url = '/api/conversations';
        if (currentConversationId) url += `?id=${encodeURIComponent(currentConversationId)}`;
        const response = await fetch(url);
        const data = await response.json();
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer && data.messages && data.messages.length > 0) {
            messagesContainer.innerHTML = '';
            data.messages.forEach(message => {
                addMessage(message.content, message.role, message.id);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else if (messagesContainer) {
            messagesContainer.innerHTML = getWelcomeMessageHTML();
        }
    } catch (error) { showToast('Error loading conversation'); }
}

// ====== TYPING INDICATOR ======
function showTypingIndicator() {
    isTyping = true;
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-indicator';
    typingDiv.id = 'typingIndicator';
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-brain"></i>';
    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    typingContent.innerHTML = '<div class="typing-dots"><div></div><div></div><div></div></div>';
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
}

// ====== SEND MESSAGE ======
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;
    showTypingIndicator();
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                language: currentLanguage,
                conversation_id: currentConversationId
            })
        });
        const data = await response.json();
        if (response.ok) {
            hideTypingIndicator();
            addMessage(data.response, 'assistant');
            loadConversationsList();
        } else {
            hideTypingIndicator();
            addMessage(translations[currentLanguage].errorMessage, 'assistant');
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage(translations[currentLanguage].errorMessage, 'assistant');
    }
}

// ====== WELCOME MESSAGE HTML ======
function getWelcomeMessageHTML() {
    return `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-brain"></i>
            </div>
            <h2 id="bomma-welcome" data-translate="welcome">${settings.userName}, Welcome to Bomma AI</h2>
            <p data-translate="description">Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations.</p>
            <div class="features">
                <div class="feature">
                    <i class="fas fa-code"></i>
                    <span data-translate="codeAssistance">Code Assistance</span>
                </div>
                <div class="feature">
                    <i class="fas fa-lightbulb"></i>
                    <span data-translate="creativeSolutions">Creative Solutions</span>
                </div>
                <div class="feature">
                    <i class="fas fa-book"></i>
                    <span data-translate="knowledgeBase">Knowledge Base</span>
                </div>
            </div>
        </div>
    `;
}
