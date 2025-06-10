import os
import json
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import base64
import time

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure Gemini API
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=api_key)

# Set up the model
model = genai.GenerativeModel('gemini-pro')
vision_model = genai.GenerativeModel('gemini-pro-vision')

# Chat history storage (in-memory for demo)
chat_history = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    chat_id = data.get('chatId', 'default')
    language = data.get('language', 'en')
    
    # Initialize chat history for this chat ID if it doesn't exist
    if chat_id not in chat_history:
        chat_history[chat_id] = []
    
    # Add user message to history
    chat_history[chat_id].append({"role": "user", "parts": [message]})
    
    try:
        # Create a chat session
        chat = model.start_chat(history=chat_history[chat_id])
        
        # Get response from Gemini
        response = chat.send_message(message)
        response_text = response.text
        
        # Add assistant response to history
        chat_history[chat_id].append({"role": "model", "parts": [response_text]})
        
        return jsonify({
            "response": response_text,
            "chatId": chat_id
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "response": "Sorry, I encountered an error. Please try again."
        }), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    chat_id = request.form.get('chatId', 'default')
    prompt = request.form.get('prompt', 'What is in this image?')
    
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    
    try:
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the image with Gemini Vision
        image_parts = [
            {
                "mime_type": file.content_type,
                "data": base64.b64encode(open(filepath, "rb").read()).decode('utf-8')
            }
        ]
        
        prompt_parts = [
            prompt,
            image_parts[0]
        ]
        
        response = vision_model.generate_content(prompt_parts)
        
        # Add to chat history
        if chat_id not in chat_history:
            chat_history[chat_id] = []
        
        # Add user message with image reference
        chat_history[chat_id].append({
            "role": "user", 
            "parts": [f"{prompt} [Image uploaded: {filename}]"]
        })
        
        # Add assistant response
        chat_history[chat_id].append({
            "role": "model", 
            "parts": [response.text]
        })
        
        return jsonify({
            "response": response.text,
            "chatId": chat_id
        })
    
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({
            "error": str(e),
            "response": "Sorry, I encountered an error processing your image."
        }), 500

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    chat_id = request.form.get('chatId', 'default')
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # For demo purposes, just acknowledge the file upload
        # In a real app, you'd process the file content based on type
        
        if chat_id not in chat_history:
            chat_history[chat_id] = []
        
        # Add file upload to chat history
        chat_history[chat_id].append({
            "role": "user", 
            "parts": [f"I've uploaded a file: {filename}. Please analyze it."]
        })
        
        response_text = f"I've received your file '{filename}'. For this demo, I can't process the file contents directly, but in a full implementation, I would analyze the content based on the file type."
        
        # Add assistant response
        chat_history[chat_id].append({
            "role": "model", 
            "parts": [response_text]
        })
        
        return jsonify({
            "response": response_text,
            "chatId": chat_id
        })
    
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify({
            "error": str(e),
            "response": "Sorry, I encountered an error processing your file."
        }), 500

@app.route('/api/get-history', methods=['GET'])
def get_history():
    chat_id = request.args.get('chatId', 'default')
    
    if chat_id in chat_history:
        # Format history for frontend
        formatted_history = []
        for i in range(0, len(chat_history[chat_id]), 2):
            if i+1 < len(chat_history[chat_id]):
                user_msg = chat_history[chat_id][i]["parts"][0]
                ai_msg = chat_history[chat_id][i+1]["parts"][0]
                formatted_history.append({
                    "user": user_msg,
                    "assistant": ai_msg,
                    "timestamp": time.time()  # In a real app, store actual timestamps
                })
        
        return jsonify({
            "history": formatted_history,
            "chatId": chat_id
        })
    else:
        return jsonify({
            "history": [],
            "chatId": chat_id
        })

@app.route('/api/new-chat', methods=['GET'])
def new_chat():
    # Generate a new chat ID
    import uuid
    new_id = str(uuid.uuid4())
    
    return jsonify({
        "chatId": new_id
    })

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    global chat_history
    chat_history = {}
    
    return jsonify({
        "success": True,
        "message": "Chat history cleared"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)

