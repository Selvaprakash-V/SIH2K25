# RuralIQ Development Setup

This guide helps you set up the RuralIQ application locally for development.

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)
- Git

## Backend Setup

1. Navigate to backend directory:
```powershell
cd backend
```

2. Create and activate virtual environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:
```powershell
pip install -r requirements.txt
```

4. Create environment file:
```powershell
copy .env.example .env
```

5. Update `.env` with your MongoDB URI and other configurations:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/ruraliq?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

6. Seed the database:
```powershell
python seed_mock_data.py
```

7. Start the development server:
```powershell
uvicorn main:app --reload --port 8000
```

## Frontend Setup

1. Navigate to frontend directory:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Create environment file:
```powershell
copy .env.example .env
```

4. Update `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

5. Start the development server:
```powershell
npm run dev
```

## Demo Credentials

After seeding the database, you can login with:

- **Admin**: admin@example.com / password
- **Field Officer**: officer@example.com / password  
- **Citizen**: citizen@example.com / password

## API Documentation

Once the backend is running, visit:
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Project Structure

```
RuralIQ/
├── backend/           # FastAPI backend
│   ├── main.py       # Main application
│   ├── models.py     # Pydantic models
│   ├── auth.py       # Authentication
│   ├── database.py   # MongoDB connection
│   └── ...
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── ...
├── data/            # Mock data
└── docs/           # Documentation
```

## Features

- ✅ Role-based authentication (Admin, Field Officer, Citizen)
- ✅ Village dashboard with development metrics
- ✅ Interactive map with gap severity indicators
- ✅ Gap detection analysis with rule-based logic
- ✅ Project tracking and management
- ✅ Offline-capable issue reporting
- ✅ Dark/light theme support
- ✅ Mobile-responsive design

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **API Testing**: Use the FastAPI docs at `/docs` for testing endpoints
3. **Database**: Use MongoDB Compass to view/edit data during development
4. **Offline Testing**: Use Chrome DevTools to simulate offline conditions

## Troubleshooting

### Backend Issues
- **Module not found**: Ensure virtual environment is activated
- **MongoDB connection**: Check your MONGO_URI in .env
- **Port conflicts**: Backend runs on 8000, frontend on 3000

### Frontend Issues
- **API connection**: Ensure backend is running on port 8000
- **Build errors**: Clear node_modules and run `npm install` again
- **Map not loading**: Check if Leaflet CSS is loaded

## Next Steps

1. Replace mock data with real village data
2. Implement ML-based gap detection
3. Add SMS/WhatsApp notifications
4. Deploy to production (Render + Vercel + MongoDB Atlas)
5. Add comprehensive test suite