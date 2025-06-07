const welcomeMessages = [
    "Welcome to Bomma AI", // English
    "Welcome to బొమ్మ AI", // Telugu
    "Welcome to பொம்மா AI" // Tamil
];

document.addEventListener("DOMContentLoaded", function () {
    const welcomeElement = document.getElementById("bomma-welcome");
    if (!welcomeElement) return; // Prevent errors if element doesn't exist

    let index = 0;
    function switchWelcomeMessage() {
        welcomeElement.textContent = welcomeMessages[index];
        index = (index + 1) % welcomeMessages.length;
    }

    switchWelcomeMessage(); // Show initial message right away
    setInterval(switchWelcomeMessage, 2000);
});
