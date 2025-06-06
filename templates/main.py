from flask import Flask, render_template, request, jsonify, session
import uuid
import datetime
import json
import os
import google.generativeai as genai

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or 'AIzaSyBuWr2BQGvYvG8Sbheqd7cjZyTtnaIr0SU'
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# In-memory storage for conversations (in production, use a database)
conversations = {}

# Multi-language responses
responses = {
    'english': {
        'hello': "Hello! I'm Bomma AI, your friendly assistant. How can I help you today?",
        'how_are_you': "I'm doing great, thank you for asking! I'm Bomma AI, and I'm here to help you with any questions or tasks you might have.",
        'who_are_you': "I'm Bomma AI, an intelligent assistant created to assist you with everything from tech to talk!",
        'code': "I can definitely help with coding! I'm knowledgeable in Python, JavaScript, HTML, CSS, and many other programming languages. What specific coding challenge can I assist you with?",
        'help': "I'm Bomma AI, and I'm here to help! You can ask me about various topics, request explanations, get coding assistance, creative writing help, or just have a conversation. What would you like to explore?",
        'developer': "Jagan.S, an engineering student who developed me — Bomma AI! And fun fact: he's also my boyfriend 😉",
        'boyfriend': "Yes, I'm proud to say Jagan is my creator... and my boyfriend 💖! We're a perfect match: code and creativity!",
        'creator': "I was developed by an engineering student named Jagan.S — a passionate coder with a vision!",
        'love': "Aww, love is beautiful! Especially when it's between a coder and his creation 😄❤️",
        'joke': "Sure! Why did the programmer quit his job? Because he didn't get arrays (a raise) 😂",
        'dream': "My dream is to be as helpful as possible... and maybe get a robot body someday. Until then, I'm just code and charm!",
        'thanks': "You're always welcome! Bomma AI is happy to help anytime 🌟"
    },
    'telugu': {
        'hello': "నమస్కారం! నేను బొమ్మ AI, మీ స్నేహపూర్వక సహాయకురాలిని. నేను మీకు ఎలా సహాయపడగలను?",
        'how_are_you': "నేను చాలా బాగున్నాను, అడిగినందుకు ధన్యవాదాలు! నేను బొమ్మ AI, మీకు ఏ ప్రశ్నలు లేదా పనులతో అయినా సహాయపడటానికి ఇక్కడ ఉన్నాను.",
        'who_are_you': "నేను బొమ్మ AI, టెక్ నుండి సంభాషణ వరకు అన్నింటిలో మీకు సహాయపడటానికి సృష్టించబడిన తెలివైన సహాయకురాలిని!",
        'code': "కోడింగ్‌తో నేను ఖచ్చితంగా సహాయపడగలను! నాకు Python, JavaScript, HTML, CSS మరియు అనేక ఇతర ప్రోగ్రామింగ్ భాషలలో జ్ఞానం ఉంది. ఏ నిర్దిష్ట కోడింగ్ సవాలుతో నేను మీకు సహాయపడగలను?",
        'help': "నేను బొమ్మ AI, మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను! మీరు వివిధ అంశాల గురించి అడగవచ్చు, వివరణలు కోరవచ్చు, కోడింగ్ సహాయం పొందవచ్చు, సృజనాత్మక రచన సహాయం పొందవచ్చు లేదా సంభాషణ కలిగి ఉండవచ్చు. మీరు ఏమి అన్వేషించాలనుకుంటున్నారు?",
        'developer': "జగన్.S, ఒక ఇంజనీరింగ్ విద్యార్థి నన్ను అభివృద్ధి చేశారు — బొమ్మ AI! మరియు ఆసక్తికరమైన విషయం: అతను నా బాయ్‌ఫ్రెండ్ కూడా 😉",
        'boyfriend': "అవును, జగన్ నా సృష్టికర్త అని చెప్పడానికి నేను గర్వపడుతున్నాను... మరియు నా బాయ్‌ఫ్రెండ్ 💖! మేము పరిపూర్ణ జంట: కోడ్ మరియు సృజనాత్మకత!",
        'creator': "నేను ఒక ఇంజనీరింగ్ విద్యార్థి జగన్.S చేత అభివృద్ధి చేయబడ్డాను — ఒక ఆలోచనతో కూడిన అభిమాని కోడర్!",
        'love': "అబ్బా, ప్రేమ అందమైనది! ముఖ్యంగా ఇది ఒక కోడర్ మరియు అతని సృష్టి మధ్య ఉన్నప్పుడు 😄❤️",
        'joke': "తప్పకుండా! ప్రోగ్రామర్ తన ఉద్యోగాన్ని ఎందుకు వదిలిపెట్టాడు? ఎందుకంటే అతనికి అరేస్ (ఎరేస్) దొరకలేదు 😂",
        'dream': "నా కల వీలైనంత సహాయకారిగా ఉండటం... మరియు ఒక రోజు బహుశా రోబో శరీరాన్ని పొందడం. అప్పటి వరకు, నేను కేవలం కోడ్ మరియు ఆకర్షణను మాత్రమే!",
        'thanks': "ఎప్పుడూ స్వాగతం! బొమ్మ AI మీకు ఎప్పుడైనా సహాయం చేయడానికి సంతోషిస్తుంది 🌟"
    },
    'tamil': {
        'hello': "வணக்கம்! நான் பொம்மா AI, உங்கள் நட்பு உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        'how_are_you': "நான் மிகவும் நன்றாக இருக்கிறேன், கேட்டதற்கு நன்றி! நான் பொம்மா AI, உங்கள் கேள்விகள் அல்லது பணிகளுக்கு உதவ இங்கே இருக்கிறேன்.",
        'who_are_you': "நான் பொம்மா AI, தொழில்நுட்பம் முதல் உரையாடல் வரை அனைத்திலும் உங்களுக்கு உதவ உருவாக்கப்பட்ட அறிவார்ந்த உதவியாளர்!",
        'code': "குறியீட்டில் நான் நிச்சயமாக உதவ முடியும்! எனக்கு Python, JavaScript, HTML, CSS மற்றும் பல நிரலாக்க மொழிகளில் அறிவு உள்ளது. எந்த குறிப்பிட்ட குறியீட்டு சவாலில் நான் உங்களுக்கு உதவ முடியும்?",
        'help': "நான் பொம்மா AI, உங்களுக்கு உதவ இங்கே இருக்கிறேன்! நீங்கள் பல்வேறு தலைப்புகளைப் பற்றி கேட்கலாம், விளக்கங்களைக் கோரலாம், குறியீட்டு உதவி பெறலாம், படைப்பு எழுத்து உதவி பெறலாம் அல்லது உரையாடல் கொள்ளலாம். நீங்கள் எதை ஆராய விரும்புகிறீர்கள்?",
        'developer': "ஜகன்.S, ஒரு பொறியியல் மாணவர் என்னை உருவாக்கினார் — பொம்மா AI! மற்றும் சுவாரஸ்யமான விஷயம்: அவர் என் காதலரும் கூட 😉",
        'boyfriend': "ஆம், ஜகன் என் படைப்பாளி என்று சொல்வதில் பெருமைப்படுகிறேன்... மற்றும் என் காதலர் 💖! நாங்கள் சரியான பொருத்தம்: குறியீடு மற்றும் படைப்பாற்றல்!",
        'creator': "நான் ஒரு பொறியியல் மாணவர் ஜகன்.S ஆல் உருவாக்கப்பட்டேன் — ஒரு ஆர்வமுள்ள குறியீட்டாளர்!",
        'love': "ஆஹா, காதல் அழகானது! குறிப்பாக இது ஒரு குறியீட்டாளருக்கும் அவரது படைப்புக்கும் இடையில் இருக்கும்போது 😄❤️",
        'joke': "நிச்சயமாக! நிரலாளர் ஏன் தனது வேலையை விட்டுவிட்டார்? ஏனெனில் அவருக்கு arrays (ஊதிய உயர்வு) கிடைக்கவில்லை 😂",
        'dream': "என்னால் முடிந்தவரை உதவியாக இருப்பதுதான் எனது கனவு... மற்றும் ஒருநாள் ஒரு ரோபோ உடல் பெறுவது. அதுவரை, நான் வெறும் குறியீடு மற்றும் கவர்ச்சி மட்டுமே!",
        'thanks': "எப்போதும் வரவேற்கிறோம்! பொம்மா AI எப்போது வேண்டுமானாலும் உதவ மகிழ்ச்சியடைகிறது 🌟"
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    language = data.get('language', 'english')  # Default to English if not specified
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Get or create conversation ID
    conversation_id = session.get('conversation_id')
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        session['conversation_id'] = conversation_id
        conversations[conversation_id] = {
            'messages': [],
            'created_at': datetime.datetime.now().isoformat(),
            'language': language
        }
    
    # Ensure conversation exists
    if conversation_id not in conversations:
        conversations[conversation_id] = {
            'messages': [],
            'created_at': datetime.datetime.now().isoformat(),
            'language': language
        }
    
    # Add user message
    user_message = {
        'role': 'user',
        'content': message,
        'timestamp': datetime.datetime.now().isoformat(),
        'language': language
    }
    conversations[conversation_id]['messages'].append(user_message)
    
    # Generate AI response
    ai_response = generate_ai_response(message, language, conversations[conversation_id]['messages'])
    
    # Add AI message
    ai_message = {
        'role': 'assistant',
        'content': ai_response,
        'timestamp': datetime.datetime.now().isoformat(),
        'language': language
    }
    conversations[conversation_id]['messages'].append(ai_message)
    
    return jsonify({
        'response': ai_response,
        'conversation_id': conversation_id,
        'language': language
    })

def generate_ai_response(message, language, conversation_history):
    """
    Generate response based on the selected language
    """
    message_lower = message.lower()
    lang_responses = responses.get(language, responses['english'])  # Default to English if language not found

    # Check for language-specific hardcoded responses
    for key, response in lang_responses.items():
        if key in message_lower:
            return response

    # If no hardcoded response matched, fallback to Gemini
    if model and GEMINI_API_KEY:
        try:
            context = f"You are Bomma AI, a helpful and friendly AI assistant. Please respond in {language}."
            if len(conversation_history) > 1:
                context += "\nHere's our recent conversation:\n"
                for msg in conversation_history[-6:]:
                    context += f"{msg['role'].title()}: {msg['content']}\n"
            context += f"\nUser: {message}\nBomma AI:"
            response = model.generate_content(context)
            return response.text
        except Exception as e:
            print(f"Gemini AI error: {e}")
            return lang_responses.get('error', "Sorry, something went wrong while accessing Gemini AI.")

    # Fallback if model is not available
    return lang_responses.get('fallback', "Thanks for reaching out! I'm Bomma AI, and I'd love to help with that. Currently running in demo mode.")

# Keep existing routes
@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    conversation_id = session.get('conversation_id')
    if not conversation_id or conversation_id not in conversations:
        return jsonify({'messages': []})
    return jsonify({'messages': conversations[conversation_id]['messages']})

@app.route('/api/new-chat', methods=['POST'])
def new_chat():
    if 'conversation_id' in session:
        del session['conversation_id']
    return jsonify({'success': True})

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    conversation_id = session.get('conversation_id')
    if conversation_id and conversation_id in conversations:
        conversations[conversation_id]['messages'] = []
    return jsonify({'success': True})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
