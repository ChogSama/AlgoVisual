# AlgoVisual

A full-stack **sorting algorithm visualizer** with animated frames, metrics, and timeline controls.

- **Frontend:** React + classic CSS
- **Backend:** Node.js + Express
- **Monorepo setup** with a root `npm start`

---

## 📦 Project Structure

```
AlgoVisual/
├── package.json            # root (concurrently)
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css         # classic CSS (inside src)
│   │   ├── index.js
│   │   ├── index.css       # classic CSS (inside src)
│   │   └── components/
│   ├── public/
│   ├── package.json
│   └── .env                # ignored
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env                # ignored
└── README.md
```

---

## ⚙️ Setup

### 1. Clone repository

```bash
git clone https://github.com/ChogSama/AlgoVisual.git
cd AlgoVisual
```

---

### 2. Install dependencies

#### Root (for concurrently)

```bash
npm install
```

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000
```

⚠️ `.env` files are ignored by git and must **not** be committed.

---

## ▶️ Running the App

### ✅ Development Mode (recommended)

From the **root folder**:

```bash
npm start
```

This runs:

- Backend on **[http://localhost:5000](http://localhost:5000)**
- Frontend on **[http://localhost:3000](http://localhost:3000)**

(using `concurrently`)

---

### ▶️ Manual Mode (optional)

**Terminal 1**

```bash
cd backend
npm start
```

**Terminal 2**

```bash
cd frontend
npm start
```

---

## 🏗️ Production Mode

1. Build frontend:

```bash
cd frontend
npm run build
```

2. Copy build into backend:

```bash
mv build ../backend/build
```

3. Start backend:

```bash
cd ../backend
npm start
```

The backend will serve both:

- API routes (`/api/*`)
- React app (`/`)

---

## ✨ Features

- Bubble Sort, Merge Sort, Quick Sort
- Backend-generated animation frames
- Comparisons & swaps metrics
- Pause / resume / step controls
- Timeline scrubber
- Input validation & safety limits
- Classic CSS styling

---

## 🎨 Styling Notes

This project uses **plain CSS only**:

- `frontend/src/App.css`
- `frontend/src/index.css`

No TailwindCSS or UI frameworks are used.
Styling is kept simple to focus on **algorithm visualization and animations**.

---

## 🛡️ Safety & Validation

Backend enforces:

- ❌ Empty array blocked
- ❌ Non-number values blocked
- ❌ Array size > 200 blocked
- ✅ Clear error messages with proper status codes

---

## 📜 License

MIT

---