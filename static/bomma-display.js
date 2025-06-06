// bomma-display.js

let welcomeMessageInterval;
const currentLanguage = localStorage.getItem('preferredLanguage') || 'english';

// Translations object
const translations = {
    english: {
        welcome: "Welcome to Bomma AI",
        description: "Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations.",
        codeAssistance: "Code Assistance",
        creativeSolutions: "Creative Solutions",
        knowledgeBase: "Knowledge Base",
        messagePlaceholder: "Message Bomma AI...",
        sendHint: "Press Enter to send, Shift+Enter for new line",
        status: "Online",
        newChat: "New Conversation",
        clearHistory: "Clear History",
        poweredBy: "Powered by Gemini AI",
        errorMessage: "Sorry, I encountered an error. Please try again.",
        clearConfirm: "Are you sure you want to clear the chat history?"
    },
    telugu: {
        welcome: "బొమ్మ AI కి స్వాగతం",
        description: "మీ తెలివైన సహాయకుడు అధునాతన AI సాంకేతికతతో. సమాచారం, కోడింగ్, సృజనాత్మక కార్యాలు మరియు ఆలోచనాత్మక సంభాషణలతో సహాయపడటానికి నేను ఇక్కడ ఉన్నాను.",
        codeAssistance: "కోడ్ సహాయం",
        creativeSolutions: "సృజనాత్మక పరిష్కారాలు",
        knowledgeBase: "జ్ఞాన భాండాగారం",
        messagePlaceholder: "బొమ్మ AI కి సందేశం పంపండి...",
        sendHint: "పంపడానికి Enter నొక్కండి, కొత్త లైన్ కోసం Shift+Enter",
        status: "ఆన్‌లైన్",
        newChat: "కొత్త సంభాషణ",
        clearHistory: "చరిత్ర తొలగించు",
        poweredBy: "Gemini AI ద్వారా శక్తివంతం",
        errorMessage: "క్షమించండి, లోపం జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
        clearConfirm: "మీరు నిజంగా చాట్ చరిత్రను తొలగించాలనుకుంటున్నారా?"
    },
    tamil: {
        welcome: "பொம்மா AI க்கு வரவேற்கிறோம்",
        description: "உங்கள் மேம்பட்ட AI தொழில்நுட்பத்தால் இயக்கப்படும் புத்திசாலி உதவியாளர். தகவல், குறியீடு, படைப்பு பணிகள் மற்றும் சிந்தனை உரையாடல்களுடன் உதவ நான் இங்கே இருக்கிறேன்.",
        codeAssistance: "குறியீடு உதவி",
        creativeSolutions: "படைப்பு தீர்வுகள்",
        knowledgeBase: "அறிவு தளம்",
        messagePlaceholder: "பொம்மா AI க்கு செய்தி அனுப்பவும்...",
        sendHint: "அனுப்ப Enter ஐ அழுத்தவும், புதிய வரிக்கு Shift+Enter",
        status: "ஆன்லைன்",
        newChat: "புதிய உரையாடல்",
        clearHistory: "வரலாற்றை அழி",
        poweredBy: "Gemini AI ஆல் இயக்கப்படுகிறது",
        errorMessage: "மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
        clearConfirm: "உரையாடல் வரலாற்றை அழிக்க விரும்புகிறீர்களா?"
    }
};

// Initialize welcome message rotation
document.addEventListener('DOMContentLoaded', () => {
    const welcomeElement = document.getElementById("bomma-welcome");
    if (welcomeElement) {
        startWelcomeRotation();
    }
});

function startWelcomeRotation() {
    const languages = ['english', 'telugu', 'tamil'];
    let currentIndex = languages.indexOf(currentLanguage);
    
    function rotateWelcome() {
        const welcomeElement = document.getElementById("bomma-welcome");
        if (welcomeElement) {
            currentIndex = (currentIndex + 1) % languages.length;
            const nextLanguage = languages[currentIndex];
            welcomeElement.textContent = translations[nextLanguage].welcome;
            welcomeElement.style.opacity = "0";
            setTimeout(() => {
                welcomeElement.style.opacity = "1";
            }, 100);
        }
    }

    welcomeMessageInterval = setInterval(rotateWelcome, 3000);
}

// Cleanup function
function clearWelcomeInterval() {
    if (welcomeMessageInterval) {
        clearInterval(welcomeMessageInterval);
        welcomeMessageInterval = null;
    }
}

// Clean up on page unload
window.addEventListener('unload', clearWelcomeInterval);
