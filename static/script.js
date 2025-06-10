// Global variables
let currentChatId = "default"
let isProcessing = false
let speakerEnabled = false
let currentLanguage = "en"
const synth = window.speechSynthesis
let voices = []
let selectedVoice = null

// DOM elements
const messageInput = document.getElementById("messageInput")
const sendBtn = document.getElementById("sendBtn")
const messagesContainer = document.getElementById("messages")
const loadingScreen = document.getElementById("loadingScreen")
const voiceBtn = document.getElementById("voiceBtn")
const sidebar = document.getElementById("sidebar")
const menuBtn = document.getElementById("menuBtn")
const sidebarOverlay = document.querySelector(".sidebar-overlay")
const themeBtn = document.getElementById("themeBtn")
const profileBtn = document.getElementById("profileBtn")
const settingsModal = document.getElementById("settingsModal")
const closeSettings = document.getElementById("closeSettings")
const themeSelect = document.getElementById("themeSelect")
const voiceSelect = document.getElementById("voiceSelect")
const userNameInput = document.getElementById("userNameInput")
const saveSettingsBtn = document.getElementById("saveSettingsBtn")
const speakerBtn = document.getElementById("speakerBtn")
const chatHistory = document.getElementById("chatHistory")

// Translations object (all completed, no syntax errors)
const translations = {
  en: {
    welcome: "Welcome to Bomma AI",
    description: "Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations.",
    codeAssistance: "Code Assistance",
    creativeSolutions: "Creative Solutions",
    knowledgeBase: "Knowledge Base",
    languageChanged: "Language changed to English",
    settingsSaved: "Settings saved successfully",
    voiceOutputEnabled: "Voice output enabled",
    voiceOutputDisabled: "Voice output disabled",
    uploadingImage: "Uploading and analyzing image...",
    uploadingFile: "Uploading file...",
    chatHistoryCleared: "Chat history cleared",
    noChatHistory: "No chat history yet",
    typeMessage: "Type a message...",
    clearHistoryConfirmation: "Are you sure you want to clear all chat history?",
    errorSendingMessage: "Error sending message. Please try again.",
    errorProcessingImage: "Error processing image. Please try again.",
    errorProcessingFile: "Error processing file. Please try again.",
    errorCreatingNewChat: "Error creating new chat. Please try again.",
    errorClearingChatHistory: "Error clearing chat history. Please try again.",
    speechRecognitionNotSupported: "Speech recognition not supported in this browser",
    listening: "Listening...",
    pleaseSelectImage: "Please select an image file"
  },
  te: {
    welcome: "Bomma AI కి స్వాగతం",
    description: "అధునాతన AI సాంకేతిక పరిజ్ఞానం ద్వారా ఆధారితమైన మీ తెలివైన సహాయకుడు. నేను మీకు సమాచారం, కోడింగ్, సృజనాత్మక పనులు మరియు ఆలోచనాత్మక సంభాషణలలో సహాయం చేయడానికి ఇక్కడ ఉన్నాను.",
    codeAssistance: "కోడ్ సహాయం",
    creativeSolutions: "సృజనాత్మక పరిష్కారాలు",
    knowledgeBase: "నాలెడ్జ్ బేస్",
    languageChanged: "భాష తెలుగుకు మార్చబడింది",
    settingsSaved: "సెట్టింగ్‌లు విజయవంతంగా సేవ్ చేయబడ్డాయి",
    voiceOutputEnabled: "వాయిస్ అవుట్‌పుట్ ప్రారంభించబడింది",
    voiceOutputDisabled: "వాయిస్ అవుట్‌పుట్ నిలిపివేయబడింది",
    uploadingImage: "చిత్రాన్ని అప్‌లోడ్ చేస్తోంది మరియు విశ్లేషిస్తోంది...",
    uploadingFile: "ఫైల్‌ను అప్‌లోడ్ చేస్తోంది...",
    chatHistoryCleared: "చాట్ హిస్టరీ క్లియర్ చేయబడింది",
    noChatHistory: "చాట్ హిస్టరీ ఇంకా లేదు",
    typeMessage: "సందేశాన్ని టైప్ చేయండి...",
    clearHistoryConfirmation: "మీరు మొత్తం చాట్ హిస్టరీని క్లియర్ చేయాలనుకుంటున్నారా?",
    errorSendingMessage: "సందేశం పంపడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    errorProcessingImage: "చిత్రాన్ని ప్రాసెస్ చేయడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    errorProcessingFile: "ఫైల్‌ను ప్రాసెస్ చేయడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    errorCreatingNewChat: "కొత్త చాట్‌ను సృష్టించడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    errorClearingChatHistory: "చాట్ హిస్టరీని క్లియర్ చేయడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    speechRecognitionNotSupported: "ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు మద్దతు లేదు",
    listening: "వింటున్నారు...",
    pleaseSelectImage: "దయచేసి ఒక చిత్రం ఫైల్‌ను ఎంచుకోండి"
  },
  ta: {
    welcome: "Bomma AI க்கு வரவேற்கிறோம்",
    description: "மேம்பட்ட AI தொழில்நுட்பத்தால் இயங்கும் உங்கள் அறிவார்ந்த உதவியாளர். தகவல், குறியீடு, படைப்பாற்றல் பணிகள் மற்றும் ஆழ்ந்த உரையாடல்களில் உங்களுக்குத் துணைநிற்கிறேன்.",
    codeAssistance: "குறியீடு உதவி",
    creativeSolutions: "ஆக்கப்பூர்வமான தீர்வுகள்",
    knowledgeBase: "அறிவுத் தளம்",
    languageChanged: "மொழி தமிழாக மாற்றப்பட்டது",
    settingsSaved: "அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன",
    voiceOutputEnabled: "குரல் வெளியீடு இயக்கப்பட்டது",
    voiceOutputDisabled: "குரல் வெளியீடு முடக்கப்பட்டது",
    uploadingImage: "படத்தை பதிவேற்றி பகுப்பாய்வு செய்கிறது...",
    uploadingFile: "கோப்பை பதிவேற்றுகிறது...",
    chatHistoryCleared: "உரையாடல் வரலாறு அழிக்கப்பட்டது",
    noChatHistory: "உரையாடல் வரலாறு இன்னும் இல்லை",
    typeMessage: "ஒரு செய்தியை தட்டச்சு செய்க...",
    clearHistoryConfirmation: "நீங்கள் அனைத்து உரையாடல் வரலாற்றையும் அழிக்க விரும்புகிறீர்களா?",
    errorSendingMessage: "செய்தி அனுப்பும் போது பிழை. மீண்டும் முயற்சிக்கவும்.",
    errorProcessingImage: "படத்தை செயலாக்கும் போது பிழை. மீண்டும் முயற்சிக்கவும்.",
    errorProcessingFile: "கோப்பை செயலாக்கும் போது பிழை. மீண்டும் முயற்சிக்கவும்.",
    errorCreatingNewChat: "புதிய உரையாடலை உருவாக்கும் போது பிழை. மீண்டும் முயற்சிக்கவும்.",
    errorClearingChatHistory: "உரையாடல் வரலாற்றை அழிக்கும் போது பிழை. மீண்டும் முயற்சிக்கவும்.",
    speechRecognitionNotSupported: "இந்த உலாவியில் பேச்சு அங்கீகாரம் ஆதரிக்கப்படவில்லை",
    listening: "கேட்கிறது...",
    pleaseSelectImage: "படக் கோப்பைத் தேர்ந்தெடுக்கவும்"
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadingScreen.classList.add("hidden")
    setTimeout(() => {
      loadingScreen.style.display = "none"
    }, 600)
  }, 1500)

  initSettings()
  createLanguageSwitcher()
  loadChatHistory()
  setupEventListeners()
  initSpeechSynthesis()
})

// Initialize settings
function initSettings() {
  const savedTheme = localStorage.getItem("theme") || "system"
  const savedUserName = localStorage.getItem("userName") || "Bomma AI"
  const savedSpeakerEnabled = localStorage.getItem("speakerEnabled") === "true"

  themeSelect.value = savedTheme
  userNameInput.value = savedUserName
  document.getElementById("userName").textContent = savedUserName
  speakerEnabled = savedSpeakerEnabled
  updateSpeakerIcon()
  applyTheme(savedTheme)
}

// Apply theme
function applyTheme(theme) {
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    document.body.classList.toggle("light-theme", !prefersDark)
    themeBtn.innerHTML = prefersDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>'
  } else if (theme === "light") {
    document.body.classList.add("light-theme")
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>'
  } else {
    document.body.classList.remove("light-theme")
    themeBtn.innerHTML = '<i class="fas fa-moon"></i>'
  }
}

// Create language switcher
function createLanguageSwitcher() {
  const languages = [
    { code: "en", name: "EN" },
    { code: "te", name: "తెలుగు" },
    { code: "ta", name: "தமிழ்" },
  ]

  const switcher = document.createElement("div")
  switcher.className = "language-switcher"

  languages.forEach((lang) => {
    const btn = document.createElement("button")
    btn.className = `lang-btn ${lang.code === currentLanguage ? "active" : ""}`
    btn.textContent = lang.name
    btn.onclick = () => switchLanguage(lang.code)
    switcher.appendChild(btn)
  })

  document.querySelector(".header-right").prepend(switcher)
}

// Switch language
function switchLanguage(langCode) {
  currentLanguage = langCode
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.textContent === langCode)
  })
  updateTranslations()
  localStorage.setItem("language", langCode)
  showToast(translations[currentLanguage].languageChanged || "Language changed")
}

// Update translations
function updateTranslations() {
  const elements = document.querySelectorAll("[data-translate]")
  elements.forEach((el) => {
    const key = el.getAttribute("data-translate")
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = translations[currentLanguage][key]
      } else {
        el.textContent = translations[currentLanguage][key]
      }
    }
  })
}

// Set up event listeners
function setupEventListeners() {
  messageInput.addEventListener("input", () => {
    sendBtn.disabled = messageInput.value.trim() === ""
    messageInput.style.height = "auto"
    messageInput.style.height = messageInput.scrollHeight + "px"
  })
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!sendBtn.disabled) sendMessage()
    }
  })
  menuBtn.addEventListener("click", toggleSidebar)
  sidebarOverlay.addEventListener("click", toggleSidebar)
  themeBtn.addEventListener("click", toggleTheme)
  profileBtn.addEventListener("click", () => {
    settingsModal.style.display = "flex"
  })
  closeSettings.addEventListener("click", () => {
    settingsModal.style.display = "none"
  })
  saveSettingsBtn.addEventListener("click", saveSettings)
  window.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.style.display = "none"
  })
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingsModal.style.display === "flex") {
      settingsModal.style.display = "none"
    }
  })
}

// Initialize speech synthesis
function initSpeechSynthesis() {
  if ("speechSynthesis" in window) {
    synth.onvoiceschanged = () => {
      voices = synth.getVoices()
      voiceSelect.innerHTML = ""
      voices.forEach((voice, i) => {
        const option = document.createElement("option")
        option.value = i
        option.textContent = `${voice.name} (${voice.lang})`
        voiceSelect.appendChild(option)
      })
      const savedVoice = localStorage.getItem("selectedVoice")
      if (savedVoice) {
        voiceSelect.value = savedVoice
        selectedVoice = voices[savedVoice]
      }
    }
    synth.getVoices()
  }
}

// Toggle sidebar
function toggleSidebar() {
  sidebar.classList.toggle("active")
  sidebarOverlay.classList.toggle("active")
}

// Toggle theme
function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "system"
  let newTheme
  if (currentTheme === "system") {
    newTheme = document.body.classList.contains("light-theme") ? "dark" : "light"
  } else {
    newTheme = currentTheme === "light" ? "dark" : "light"
  }
  localStorage.setItem("theme", newTheme)
  themeSelect.value = newTheme
  applyTheme(newTheme)
}

// Save settings
function saveSettings() {
  const theme = themeSelect.value
  localStorage.setItem("theme", theme)
  applyTheme(theme)
  const voiceIndex = voiceSelect.value
  localStorage.setItem("selectedVoice", voiceIndex)
  selectedVoice = voices[voiceIndex]
  const userName = userNameInput.value
  localStorage.setItem("userName", userName)
  document.getElementById("userName").textContent = userName
  settingsModal.style.display = "none"
  showToast(translations[currentLanguage].settingsSaved || "Settings saved successfully")
}

// Toggle speaker
function toggleSpeaker() {
  speakerEnabled = !speakerEnabled
  localStorage.setItem("speakerEnabled", speakerEnabled)
  updateSpeakerIcon()
  showToast(
    speakerEnabled
      ? translations[currentLanguage].voiceOutputEnabled || "Voice output enabled"
      : translations[currentLanguage].voiceOutputDisabled || "Voice output disabled"
  )
}

// Update speaker icon
function updateSpeakerIcon() {
  speakerBtn.innerHTML = speakerEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>'
}

// Send message
async function sendMessage() {
  const message = messageInput.value.trim()
  if (message === "" || isProcessing) return
  isProcessing = true
  messageInput.value = ""
  messageInput.style.height = "auto"
  sendBtn.disabled = true
  addMessage(message, "user")
  scrollToBottom()
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        chatId: currentChatId,
        language: currentLanguage
      })
    })
    const data = await response.json()
    if (data.error) {
      showToast("Error: " + data.error)
      return
    }
    addMessage(data.response, "assistant")
    if (speakerEnabled) speakText(data.response)
    updateChatHistoryUI()
  } catch (error) {
    console.error("Error:", error)
    showToast(translations[currentLanguage].errorSendingMessage || "Error sending message. Please try again.")
  } finally {
    isProcessing = false
    scrollToBottom()
  }
}

// Add message to UI
function addMessage(content, role) {
  const welcomeMessage = document.querySelector(".welcome-message")
  if (welcomeMessage) welcomeMessage.remove()
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${role}`
  const avatar = document.createElement("div")
  avatar.className = "message-avatar"
  avatar.innerHTML = role === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>'
  const messageContent = document.createElement("div")
  messageContent.className = "message-content"
  if (role === "assistant") {
    messageContent.innerHTML = marked.parse(content)
    if (window.hljs) {
      messageContent.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block)
      })
    }
  } else {
    messageContent.textContent = content
  }
  messageDiv.appendChild(avatar)
  messageDiv.appendChild(messageContent)
  messagesContainer.appendChild(messageDiv)
}

// Scroll to bottom of messages
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

// Show toast notification
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.classList.add("show")
  setTimeout(() => {
    toast.classList.remove("show")
  }, duration)
}

// Speak text
function speakText(text) {
  if (!("speechSynthesis" in window)) return
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  if (selectedVoice) utterance.voice = selectedVoice
  if (currentLanguage === "te") utterance.lang = "te-IN"
  else if (currentLanguage === "ta") utterance.lang = "ta-IN"
  else utterance.lang = "en-US"
  synth.speak(utterance)
}

// Toggle voice recording
function toggleVoiceRecording() {
  if (!("webkitSpeechRecognition" in window)) {
    showToast(translations[currentLanguage].speechRecognitionNotSupported || "Speech recognition not supported in this browser")
    return
  }
  const recognition = new webkitSpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  if (currentLanguage === "te") recognition.lang = "te-IN"
  else if (currentLanguage === "ta") recognition.lang = "ta-IN"
  else recognition.lang = "en-US"
  voiceBtn.classList.add("recording")
  voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>'
  showToast(translations[currentLanguage].listening || "Listening...")
  recognition.start()
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    messageInput.value = transcript
    sendBtn.disabled = false
    messageInput.style.height = "auto"
    messageInput.style.height = messageInput.scrollHeight + "px"
  }
  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error)
    showToast("Error: " + event.error)
    voiceBtn.classList.remove("recording")
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>'
  }
  recognition.onend = () => {
    voiceBtn.classList.remove("recording")
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>'
  }
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.startsWith("image/")) {
    showToast(translations[currentLanguage].pleaseSelectImage || "Please select an image file")
    return
  }
  const formData = new FormData()
  formData.append("image", file)
  formData.append("chatId", currentChatId)
  formData.append("prompt", "What is in this image?")
  addMessage(`I've uploaded an image: ${file.name}`, "user")
  isProcessing = true
  showToast(translations[currentLanguage].uploadingImage || "Uploading and analyzing image...")
  fetch("/api/upload-image", { method: "POST", body: formData })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showToast("Error: " + data.error)
        return
      }
      addMessage(data.response, "assistant")
      if (speakerEnabled) speakText(data.response)
      updateChatHistoryUI()
    })
    .catch((error) => {
      console.error("Error:", error)
      showToast(translations[currentLanguage].errorProcessingImage || "Error processing image. Please try again.")
    })
    .finally(() => {
      isProcessing = false
      scrollToBottom()
    })
}

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append("file", file)
  formData.append("chatId", currentChatId)
  addMessage(`I've uploaded a file: ${file.name}`, "user")
  isProcessing = true
  showToast(translations[currentLanguage].uploadingFile || "Uploading file...")
  fetch("/api/upload-file", { method: "POST", body: formData })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        showToast("Error: " + data.error)
        return
      }
      addMessage(data.response, "assistant")
      if (speakerEnabled) speakText(data.response)
      updateChatHistoryUI()
    })
    .catch((error) => {
      console.error("Error:", error)
      showToast(translations[currentLanguage].errorProcessingFile || "Error processing file. Please try again.")
    })
    .finally(() => {
      isProcessing = false
      scrollToBottom()
    })
}

// Load chat history
function loadChatHistory() {
  fetch("/api/get-history?chatId=" + currentChatId)
    .then((response) => response.json())
    .then((data) => {
      updateChatHistoryUI()
      if (data.history && data.history.length > 0) {
        const welcomeMessage = document.querySelector(".welcome-message")
        if (welcomeMessage) welcomeMessage.remove()
        data.history.forEach((item) => {
          addMessage(item.user, "user")
          addMessage(item.assistant, "assistant")
        })
        scrollToBottom()
      }
    })
    .catch((error) => {
      console.error("Error loading chat history:", error)
    })
}

// Update chat history UI
function updateChatHistoryUI() {
  fetch("/api/get-history")
    .then((response) => response.json())
    .then((data) => {
      chatHistory.innerHTML = ""
      if (data.history && data.history.length > 0) {
        data.history.forEach((item) => {
          const chatItem = document.createElement("div")
          chatItem.className = `chat-item ${item.chatId === currentChatId ? "active" : ""}`
          chatItem.onclick = () => switchChat(item.chatId)
          const title = document.createElement("div")
          title.className = "chat-item-title"
          title.textContent = item.user.substring(0, 30) + (item.user.length > 30 ? "..." : "")
          const date = document.createElement("div")
          date.className = "chat-item-date"
          date.textContent = new Date(item.timestamp * 1000).toLocaleString()
          chatItem.appendChild(title)
          chatItem.appendChild(date)
          chatHistory.appendChild(chatItem)
        })
      } else {
        const emptyState = document.createElement("div")
        emptyState.className = "empty-state"
        emptyState.textContent = translations[currentLanguage].noChatHistory || "No chat history yet"
        chatHistory.appendChild(emptyState)
      }
    })
    .catch((error) => {
      console.error("Error updating chat history UI:", error)
    })
}

// Switch chat
function switchChat(chatId) {
  currentChatId = chatId
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.chatId === chatId)
  })
  messagesContainer.innerHTML = ""
  loadChatHistory()
  if (window.innerWidth <= 768) toggleSidebar()
}

// Start new chat
function newChat() {
  fetch("/api/new-chat")
    .then((response) => response.json())
    .then((data) => {
      currentChatId = data.chatId
      messagesContainer.innerHTML = ""
      const welcomeHTML = `
        <div class="welcome-message">
          <div class="welcome-icon">
            <i class="fas fa-brain"></i>
          </div>
          <h2 id="bomma-welcome" data-translate="welcome">${translations[currentLanguage].welcome || "Welcome to Bomma AI"}</h2>
          <p data-translate="description">${translations[currentLanguage].description || "Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations."}</p>
          <div class="features">
            <div class="feature">
              <i class="fas fa-code"></i>
              <span data-translate="codeAssistance">${translations[currentLanguage].codeAssistance || "Code Assistance"}</span>
            </div>
            <div class="feature">
              <i class="fas fa-lightbulb"></i>
              <span data-translate="creativeSolutions">${translations[currentLanguage].creativeSolutions || "Creative Solutions"}</span>
            </div>
            <div class="feature">
              <i class="fas fa-book"></i>
              <span data-translate="knowledgeBase">${translations[currentLanguage].knowledgeBase || "Knowledge Base"}</span>
            </div>
          </div>
        </div>
      `
      messagesContainer.innerHTML = welcomeHTML
      updateTranslations()
      updateChatHistoryUI()
      if (window.innerWidth <= 768) toggleSidebar()
    })
    .catch((error) => {
      console.error("Error creating new chat:", error)
      showToast(translations[currentLanguage].errorCreatingNewChat || "Error creating new chat. Please try again.")
    })
}

// Clear chat history
function clearHistory() {
  if (confirm(translations[currentLanguage].clearHistoryConfirmation || "Are you sure you want to clear all chat history?")) {
    fetch("/api/clear-history", { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          chatHistory.innerHTML = ""
          newChat()
          showToast(translations[currentLanguage].chatHistoryCleared || "Chat history cleared")
        }
      })
      .catch((error) => {
        console.error("Error clearing chat history:", error)
        showToast(translations[currentLanguage].errorClearingChatHistory || "Error clearing chat history. Please try again.")
      })
  }
}

// Note: DO NOT re-declare marked, hljs, or webkitSpeechRecognition.
// Use them directly as global objects (window.marked, window.hljs, window.webkitSpeechRecognition if needed)
