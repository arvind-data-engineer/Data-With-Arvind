# Backend API Setup Guide

## Quick Start

Your project has a Python/FastAPI backend that stores visitor project requests in SQL Server.

### Step 1: Install SQL Server

Install one of these:

- SQL Server Developer Edition
- SQL Server Express
- Azure SQL Database

Also install Microsoft ODBC Driver 18 for SQL Server.

### Step 2: Create Database

Open SQL Server Management Studio or Azure Data Studio and run:

```sql
CREATE DATABASE [Data With Arvind];
GO
```

The API creates the `project_requests` table automatically when it starts.

### Step 3: Setup Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 4: Configure `.env`

Copy `backend/.env.example` to `backend/.env` and update your SQL Server password:

```text
DATABASE_URL=mssql+pyodbc://sa:YOUR_PASSWORD@localhost:1433/Data%20With%20Arvind?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

For Windows Authentication, use this style instead:

```text
DATABASE_URL=mssql+pyodbc://@localhost/Data%20With%20Arvind?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

### Step 5: Run API

```powershell
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive API documentation.

### Step 6: Connect Frontend

`contact.html` now posts enquiry data to:

```text
http://localhost:8000/api/project-requests
```

When you deploy the backend, update the `data-api-url` value on the contact form to your live API URL.

## API Endpoints

- **POST** `/api/project-requests` - Save a project request
- **GET** `/api/project-requests` - Get all requests
- **GET** `/api/health` - Check if API is running

## Database Schema

The `project_requests` table stores:

- `id` - Primary key
- `name` - Visitor name
- `email` - Visitor email
- `project_type` - Type of project
- `message` - Project description
- `timeline` - Project timeline
- `budget` - Budget estimate
- `submitted_at` - Submission timestamp

## Troubleshooting

**SQL Server Connection Error?**

- Check SQL Server is running
- Check TCP/IP is enabled for local SQL Server connections
- Verify `DATABASE_URL` in `.env`
- Confirm Microsoft ODBC Driver 18 for SQL Server is installed

**Port 8000 in use?**

```powershell
uvicorn main:app --reload --port 8001
```

**ModuleNotFoundError?**

- Ensure the virtual environment is activated
- Run `pip install -r requirements.txt` again

## Next Steps

1. Add JWT authentication for admin-only enquiry access
2. Create an admin dashboard
3. Deploy the API
4. Add email notifications after database save
