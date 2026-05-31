from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import PyPDF2
import io
import os
import json

app = Flask(__name__)
CORS(app)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

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
