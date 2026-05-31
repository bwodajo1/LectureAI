from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import PyPDF2
import io
import os
import json
import jwt
import bcrypt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.environ.get("FRONTEND_ORIGIN", "*")}})

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_EXPIRY_HOURS = 24

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

USERS = {}

def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.current_user = payload["sub"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired — please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if email in USERS:
        return jsonify({"error": "An account with that email already exists"}), 409
    USERS[email] = {"password_hash": bcrypt.hashpw(password.encode(), bcrypt.gensalt())}
    token = create_token(email)
    return jsonify({"token": token, "email": email}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = USERS.get(email)
    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"]):
        return jsonify({"error": "Invalid email or password"}), 401
    token = create_token(email)
    return jsonify({"token": token, "email": email})

@app.route("/api/auth/me", methods=["GET"])
@require_auth
def me():
    return jsonify({"email": request.current_user})

def extract_text_from_pdf(pdf_bytes):
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()

def call_claude(content: str, task: str) -> dict:
    prompts = {
        "summary": f"""You are an expert academic tutor. Given the following lecture content, produce a concise but thorough summary.

Structure your response as JSON with this exact format:
{{
  "title": "inferred lecture title",
  "overview": "2-3 sentence high-level overview",
  "key_points": ["point 1", "point 2", "point 3", "...up to 8 key points"]
}}

Return ONLY valid JSON, no markdown, no preamble.

Lecture content:
{content[:6000]}""",

        "flashcards": f"""You are an expert academic tutor. Given the following lecture content, generate 8 high-quality flashcards for studying.

Structure your response as JSON with this exact format:
{{
  "flashcards": [
    {{"front": "question or term", "back": "answer or definition"}},
    ...
  ]
}}

Make flashcards that test understanding, not just memorization. Return ONLY valid JSON.

Lecture content:
{content[:6000]}""",

        "quiz": f"""You are an expert academic tutor. Given the following lecture content, generate 5 multiple-choice quiz questions.

Structure your response as JSON with this exact format:
{{
  "questions": [
    {{
      "question": "question text",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "answer": "A",
      "explanation": "brief explanation of why this is correct"
    }},
    ...
  ]
}}

Use chain-of-thought style questions that require reasoning. Return ONLY valid JSON.

Lecture content:
{content[:6000]}"""
    }

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompts[task]}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)

@app.route("/api/process", methods=["POST"])
@require_auth
def process():
    content = ""
    if "pdf" in request.files:
        pdf_file = request.files["pdf"]
        content = extract_text_from_pdf(pdf_file.read())
    elif request.json and "text" in request.json:
        content = request.json["text"]
    else:
        return jsonify({"error": "No content provided"}), 400
    if not content.strip():
        return jsonify({"error": "Could not extract text from input"}), 400
    task = request.args.get("task", "summary")
    if task not in ("summary", "flashcards", "quiz"):
        return jsonify({"error": "Invalid task"}), 400
    try:
        result = call_claude(content, task)
        return jsonify({"task": task, "result": result})
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse Claude response: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
