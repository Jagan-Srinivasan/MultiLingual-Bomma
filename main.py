from flask import Flask, render_template, request, jsonify, session
import uuid
import datetime
import json
import os
import google.generativeai as genai

from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or 'AIzaSyBuWr2BQGvYvG8Sbheqd7cjZyTtnaIr0SU'
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# In-memory storage: user_id -> {conversations: {conv_id: {...}}}
users = {}

# For demo: Use session as user_id (works for single user/deploy), for multi-user use real auth.
def get_user_id():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']

# Multi-language responses (make sure 'english' always present!)
responses = {
    'english': {
        'hello': "Hello! How can I help you today?",
        'hi': "Hi there! How can I assist you?",
        'help': "I'm Bomma AI. Ask me anything or try changing the language.",
        'error': "Sorry, something went wrong. Please try again.",
        'fallback': "Thanks for reaching out! I'm Bomma AI, and I'd love to help with that. Currently running in demo mode."
    },
    'telugu': {
        'hello': "హలో! నిన్ను ఎలా సహాయపడగలను?",
        'hi': "హాయ్! నేను మీకు ఎలా సహాయపడగలను?",
        'help': "నేను బొమ్మా AI. నన్ను ఏదైనా అడగండి లేదా భాషను మార్చండి.",
        'error': "క్షమించండి, ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
        'fallback': "మీ సందేశానికి ధన్యవాదాలు! నేను బొమ్మా AI, మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను."
    },
    # Add more languages here as needed, always include 'english'
    # 'hindi': { ... }
}

@app.route('/')
def index():
    return render_template('index.html')

# --- Chat API: create/send message to a conversation ---
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    language = data.get('language', 'english')
    conv_id = data.get('conversation_id')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    user_id = get_user_id()
    user = users.setdefault(user_id, {'conversations': {}})

    # Use or create conversation
    if not conv_id or conv_id not in user['conversations']:
        # New conversation
        conv_id = str(uuid.uuid4())
        user['conversations'][conv_id] = {
            'id': conv_id,
            'messages': [],
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat(),
            'language': language,
            'title': message[:40] + ('...' if len(message) > 40 else '')
        }
    conversation = user['conversations'][conv_id]

    # Add user message
    user_message = {
        'id': str(uuid.uuid4()),
        'role': 'user',
        'content': message,
        'timestamp': datetime.datetime.now().isoformat(),
        'language': language
    }
    conversation['messages'].append(user_message)

    # Generate AI response
    ai_response = generate_ai_response(message, language, conversation['messages'])

    # Add AI message
    ai_message = {
        'id': str(uuid.uuid4()),
        'role': 'assistant',
        'content': ai_response,
        'timestamp': datetime.datetime.now().isoformat(),
        'language': language
    }
    conversation['messages'].append(ai_message)

    # Update conversation meta
    conversation['updated_at'] = datetime.datetime.now().isoformat()
    if not conversation.get("title"):
        conversation["title"] = message[:40] + ('...' if len(message) > 40 else '')

    # Save current conversation
    session['conversation_id'] = conv_id

    return jsonify({
        'response': ai_response,
        'conversation_id': conv_id,
        'language': language
    })

def generate_ai_response(message, language, conversation_history):
    message_lower = message.lower()
    # Always use .get with fallback to responses['english']
    lang_responses = responses.get(language, responses['english'])

    # Check for language-specific hardcoded responses
    for key, response in lang_responses.items():
        if key in message_lower:
            return response

    # Fallback to Gemini
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

    return lang_responses.get('fallback', "Thanks for reaching out! I'm Bomma AI, and I'd love to help with that. Currently running in demo mode.")

# --- List ALL conversations (for sidebar history) ---
@app.route('/api/conversations/list', methods=['GET'])
def list_conversations():
    user_id = get_user_id()
    user = users.get(user_id, {'conversations': {}})
    conversations = [
        {
            'id': conv['id'],
            'title': conv['title'] or "Conversation",
            'updated_at': conv.get('updated_at', conv.get('created_at', ''))
        }
        for conv in user['conversations'].values()
    ]
    # Sort newest first
    conversations.sort(key=lambda c: c['updated_at'], reverse=True)
    return jsonify({'conversations': conversations})

# --- Get messages for a conversation (by conv_id param, or current by session) ---
@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    user_id = get_user_id()
    user = users.get(user_id, {'conversations': {}})
    conv_id = request.args.get('id') or session.get('conversation_id')
    conversation = user['conversations'].get(conv_id) if conv_id else None
    if not conversation:
        return jsonify({'messages': []})
    return jsonify({'messages': conversation['messages']})

# --- Start a new conversation ---
@app.route('/api/new-chat', methods=['POST'])
def new_chat():
    session.pop('conversation_id', None)
    return jsonify({'success': True})

# --- Clear all history for current conversation only ---
@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    user_id = get_user_id()
    conv_id = session.get('conversation_id')
    user = users.get(user_id, {'conversations': {}})
    if conv_id and conv_id in user['conversations']:
        user['conversations'][conv_id]['messages'] = []
        user['conversations'][conv_id]['updated_at'] = datetime.datetime.now().isoformat()
    return jsonify({'success': True})

# --- FILE UPLOAD: PDF/DOCX/TXT summarization (stub) ---
@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    ext = filename.lower().split('.')[-1]
    if ext not in ['pdf', 'docx', 'txt']:
        return jsonify({'error': 'Unsupported file type'}), 400
    # For demo, just respond with a dummy summary
    # TODO: Add real file parsing and AI summarization
    summary = f"Received file '{filename}'. File summarization is not yet implemented."
    return jsonify({'summary': summary})

# --- IMAGE ANALYSIS (stub) ---
@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    data = request.get_json()
    image_data = data.get('image')
    # For demo, just return a dummy description
    # TODO: Add real image-to-text AI integration
    desc = "Image analysis is not yet implemented."
    return jsonify({'description': desc})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
