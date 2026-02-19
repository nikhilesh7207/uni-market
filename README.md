# University Student-to-Student Marketplace

## 🎓 Project Overview
A university-exclusive marketplace where students can buy/sell products and communicate via a secure chat system.

## 📁 Project Structure
- `/frontend`: React + Vite application (User Interface)
- `/backend`: Node.js + Express server (API & Database)
- `/ai`: Node.js service (Recommendation & Moderation)

## 🚀 How to Run

### 1. Backend
```bash
cd backend
npm install
# Ensure MongoDB is running locally
node server.js
```
Server runs on `http://localhost:5000`.

### 2. AI Service
```bash
cd ai
npm install
node index.js
```
AI Service runs on `http://localhost:5001` (if needed by backend, currently standalone mock).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

## 🔑 Key Features
- **Authentication**: Sign up with `@university.edu` email.
- **Products**: Buy and sell items.
- **Chat**: Real-time chat with "Report" functionality.
- **Admin**: Dashboard to view reported chats and moderate users/content.

## 📝 Configuration
- Backend `.env`:
  - `MONGO_URI`: MongoDB connection string.
  - `JWT_SECRET`: Secret for token signing.

## 🛠 Tech Stack
- **Frontend**: React, Tailwind CSS, Socket.io Client
- **Backend**: Express, MongoDB, Socket.io
- **AI**: Node.js (Mock Logic)
