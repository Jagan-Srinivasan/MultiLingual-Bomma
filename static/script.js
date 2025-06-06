// script.js

// Global variables
let isTyping = false;
let isRecording = false;
let recognition = null;
let currentLanguage = localStorage.getItem('preferredLanguage') || 'english';

// Clear any existing intervals from bomma-display.js when chat starts
window.addEventListener('DOMContentLoaded', () => {
    if (window.welcomeMessageInterval) {
        clearInterval(window.welcomeMessageInterval);
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    
    // Wait for resources to load
    Promise.all([
        new Promise(resolve => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
            link.onload = resolve;
            document.head.appendChild(link);
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
    ]).then(() => {
        hideLoadingScreen();
        loadConversation();
        setupInputHandlers();
        setupVoiceRecognition();
        initializeMobileLayout();
        updateUILanguage();
        addLanguageSwitcher();
    }).catch(error => {
        console.error('Error during initialization:', error);
        hideLoadingScreen();
    });
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

// Update UI text based on selected language
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
        currentLanguage = language;
        localStorage.setItem('preferredLanguage', language);
        updateUILanguage();
        setupVoiceRecognition();

        // Update language switcher buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(language)) {
                btn.classList.add('active');
            }
        });
    }
}

[Rest of your original script.js code including all utility functions,
message handling functions, voice and image handling, and chat management functions]
