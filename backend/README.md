# Commercial Website Backend API

A FastAPI backend to store visitor project requests in SQL Server.

## Setup Instructions

### 1. Install SQL Server

Install SQL Server Developer Edition, SQL Server Express, or use Azure SQL Database.

Also install Microsoft ODBC Driver 18 for SQL Server.

### 2. Create Database

Open SQL Server Management Studio or Azure Data Studio and run:

```sql
CREATE DATABASE commercial_website;
GO
```

The API creates the `project_requests` table automatically on startup.

### 3. Install Python Dependencies

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```text
DATABASE_URL=mssql+pyodbc://sa:YOUR_PASSWORD@localhost:1433/commercial_website?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

For Windows Authentication:

```text
DATABASE_URL=mssql+pyodbc://@localhost/commercial_website?driver=ODBC+Driver+18+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
```

### 5. Run the API

```powershell
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`.

### 6. View API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### Save a Project Request

**POST** `/api/project-requests`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "project_type": "Power BI dashboard",
  "message": "Need a sales dashboard",
  "timeline": "2 weeks",
  "budget": "$5000"
}
```

### Get All Requests

**GET** `/api/project-requests`

### Get Single Request

**GET** `/api/project-requests/{id}`

### Delete Request

**DELETE** `/api/project-requests/{id}`

### Health Check

**GET** `/api/health`

## Frontend Integration

The contact page posts JSON to:

```text
http://localhost:8000/api/project-requests
```

When the API is deployed, update the `data-api-url` attribute in `contact.html` to the production API URL.

## Troubleshooting

**Connection Error?**

- Ensure SQL Server is running
- Check `DATABASE_URL` in `.env`
- Verify the database exists
- Confirm Microsoft ODBC Driver 18 for SQL Server is installed

**Port 8000 in use?**

```powershell
uvicorn main:app --reload --port 8001
```

## Next Steps

- Add admin authentication
- Add email notifications
- Deploy the API
- Connect an admin dashboard
