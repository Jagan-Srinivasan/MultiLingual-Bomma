// bomma-display.js
let welcomeIndex = 0;
const welcomeMessages = [
    {
        welcome: "Welcome to Bomma AI",
        description: "Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations.",
        codeAssistance: "Code Assistance",
        creativeSolutions: "Creative Solutions",
        knowledgeBase: "Knowledge Base"
    },
    {
        welcome: "బొమ్మ AI కి స్వాగతం",
        description: "మీ తెలివైన సహాయకుడు అధునాతన AI సాంకేతికతతో. సమాచారం, కోడింగ్, సృజనాత్మక కార్యాలు మరియు ఆలోచనాత్మక సంభాషణలతో సహాయపడటానికి నేను ఇక్కడ ఉన్నాను.",
        codeAssistance: "కోడ్ సహాయం",
        creativeSolutions: "సృజనాత్మక పరిష్కారాలు",
        knowledgeBase: "జ్ఞాన భాండాగారం"
    },
    {
        welcome: "பொம்மா AI க்கு வரவேற்கிறோம்",
        description: "உங்கள் மேம்பட்ட AI தொழில்நுட்பத்தால் இயக்கப்படும் புத்திசாலி உதவியாளர். தகவல், குறியீடு, படைப்பு பணிகள் மற்றும் சிந்தனை உரையாடல்களுடன் உதவ நான் இங்கே இருக்கிறேன்.",
        codeAssistance: "குறியீடு உதவி",
        creativeSolutions: "படைப்பு தீர்வுகள்",
        knowledgeBase: "அறிவு தளம்"
    }
];

function updateWelcomeText() {
    const welcomeElement = document.getElementById('bomma-welcome');
    const descriptionElement = document.querySelector('.welcome-message p');
    const featureElements = document.querySelectorAll('.feature span');
    
    if (welcomeElement && descriptionElement && featureElements.length === 3) {
        const currentMessage = welcomeMessages[welcomeIndex];
        
        welcomeElement.textContent = currentMessage.welcome;
        descriptionElement.textContent = currentMessage.description;
        featureElements[0].textContent = currentMessage.codeAssistance;
        featureElements[1].textContent = currentMessage.creativeSolutions;
        featureElements[2].textContent = currentMessage.knowledgeBase;
        
        welcomeIndex = (welcomeIndex + 1) % welcomeMessages.length;
    }
}

// Initialize welcome message rotation
document.addEventListener('DOMContentLoaded', () => {
    // Initial update
    updateWelcomeText();
    // Set interval for rotation
    setInterval(updateWelcomeText, 2000);
});
