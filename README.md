# LectureAI

An AI-powered study companion that turns lecture slides and notes into summaries, flashcards, and quizzes.

## Stack

- **Backend**: Flask, Anthropic API, PyPDF2, JWT, bcrypt
- **Frontend**: React, Vite
- **Deployment**: nginx, gunicorn, AWS EC2

## Running locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
export JWT_SECRET=any-random-string
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in, get token |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/process?task=summary` | Yes | Summarize content |
| POST | `/api/process?task=flashcards` | Yes | Generate flashcards |
| POST | `/api/process?task=quiz` | Yes | Generate quiz |
| GET | `/api/health` | No | Health check |

## Deploying to EC2

```bash
scp -r . ubuntu@YOUR_EC2_IP:~/lectureai
ssh ubuntu@YOUR_EC2_IP
cd ~/lectureai
chmod +x deploy.sh
ANTHROPIC_API_KEY=sk-ant-... JWT_SECRET=$(openssl rand -hex 32) ./deploy.sh
```

Make sure port 80 is open in your EC2 security group.
