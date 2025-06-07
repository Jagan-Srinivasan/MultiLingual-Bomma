// Global variables
let isTyping = false;
let isRecording = false;
let recognition = null;
let currentLanguage = localStorage.getItem('preferredLanguage') || 'english';
let isSpeakerEnabled = localStorage.getItem('speakerEnabled') === 'true';
let isCurrentlySpeaking = false;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// Clear any existing intervals from bomma-display.js when chat starts
window.addEventListener('DOMContentLoaded', () => {
    if (window.welcomeMessageInterval) {
        clearInterval(window.welcomeMessageInterval);
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    setTimeout(() => {
        hideLoadingScreen();
        loadConversation();
        setupInputHandlers();
        setupVoiceRecognition();
        initializeMobileLayout();
        updateUILanguage();
        addLanguageSwitcher();
        initializeSpeaker();
        
        // Add event listeners for better history handling
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                loadConversation();
            }
        });

        window.addEventListener('online', () => {
            loadConversation();
        });
    }, 3000);
});

// Add language switcher
function addLanguageSwitcher() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
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

// Speaker functions
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

    if (!isSpeakerEnabled && isCurrentlySpeaking) {
        stopSpeaking();
    }
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

    const langMap = {
        'english': 'en-US',
        'telugu': 'te-IN',
        'tamil': 'ta-IN'
    };
    utterance.lang = langMap[currentLanguage] || 'en-US';

    const voices = speechSynthesis.getVoices();

    // Choose a cute girl voice manually by filtering
    const preferredVoice = voices.find(voice =>
        voice.lang === utterance.lang &&
        /female|girl|woman/i.test(voice.name)  // match female-like voices
    ) || voices.find(voice => voice.lang === utterance.lang);

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.rate = 1.15;
    utterance.pitch = 1.6;
    utterance.volume = 1.0;

    utterance.onstart = () => {
        isCurrentlySpeaking = true;
    };
    utterance.onend = () => {
        isCurrentlySpeaking = false;
        currentUtterance = null;
    };
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        isCurrentlySpeaking = false;
        currentUtterance = null;
    };

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
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

// Language switching function
function switchLanguage(language) {
    if (translations[language]) {
        // Stop any ongoing speech
        stopSpeaking();
        
        currentLanguage = language;
        localStorage.setItem('preferredLanguage', language);
        updateUILanguage();
        setupVoiceRecognition();

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(language)) {
                btn.classList.add('active');
            }
        });
    }
}

// Utility functions
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function initializeMobileLayout() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
    }
}

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

function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        const recognitionLanguages = {
            english: 'en-US',
            telugu: 'te-IN',
            tamil: 'ta-IN'
        };
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

// Message handling functions
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                language: currentLanguage
            })
        });

        const data = await response.json();

        if (response.ok) {
            hideTypingIndicator();
            addMessage(data.response, 'assistant');
        } else {
            hideTypingIndicator();
            addMessage(translations[currentLanguage].errorMessage, 'assistant');
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage(translations[currentLanguage].errorMessage, 'assistant');
    }
}

function addMessage(content, role) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    // Only remove welcome message if this is the first actual message
    const messages = messagesContainer.querySelectorAll('.message');
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (messages.length === 0 && welcomeMessage) {
        welcomeMessage.remove();
        if (window.clearWelcomeInterval) {
            window.clearWelcomeInterval();
        }
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (role === 'user') {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-brain"></i>';
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Speak assistant messages
    if (role === 'assistant') {
        speakMessage(content);
    }
}

function formatMessage(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

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
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Voice and image handling
function toggleVoiceRecording() {
    if (!recognition) {
        alert(translations[currentLanguage].voiceNotSupported);
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            addImageMessage(imageDataUrl, 'user');
            setTimeout(() => {
                addMessage(translations[currentLanguage].imageAnalysisNotReady || "Image analysis is not yet implemented.", 'assistant');
            }, 1000);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    } else {
        alert(translations[currentLanguage].invalidImage || "Please select a valid image file.");
    }
}

function addImageMessage(imageDataUrl, role) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

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

// Chat management functions
async function newChat() {
    try {
        const response = await fetch('/api/new-chat', {
            method: 'POST'
        });

        if (response.ok) {
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = getWelcomeMessageHTML();
                updateUILanguage();
            }
        }
    } catch (error) {
        console.error('Error starting new chat:', error);
    }
}

async function clearHistory() {
    if (confirm(translations[currentLanguage].clearConfirm)) {
        try {
            const response = await fetch('/api/clear-history', {
                method: 'POST'
            });

            if (response.ok) {
                const messagesContainer = document.getElementById('messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = getWelcomeMessageHTML();
                    updateUILanguage();
                }
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }
}

async function loadConversation() {
    try {
        const response = await fetch('/api/conversations');
        const data = await response.json();
        
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer && data.messages && data.messages.length > 0) {
            // Clear everything including welcome message if we have history
            messagesContainer.innerHTML = '';
            
            // Add all messages from history
            data.messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.role}`;
                
                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                avatar.innerHTML = message.role === 'user' ? 
                    '<i class="fas fa-user"></i>' : 
                    '<i class="fas fa-brain"></i>';
                
                const messageContent = document.createElement('div');
                messageContent.className = 'message-content';
                messageContent.innerHTML = formatMessage(message.content);
                
                messageDiv.appendChild(avatar);
                messageDiv.appendChild(messageContent);
                messagesContainer.appendChild(messageDiv);
            });
            
            // Scroll to bottom after loading history
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

// Helper function to get welcome message HTML
function getWelcomeMessageHTML() {
    return `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-brain"></i>
            </div>
            <h2 id="bomma-welcome" data-translate="welcome">Welcome to Bomma AI</h2>
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
