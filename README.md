# 📄 I&L Lending Services - PDF Generation Server

Professional PDF generation server for I&L Lending Services loan management system.

## ✨ Features

- ✅ Health check endpoint
- 📋 Customer information display
- 💰 Loan summary and details
- 📊 Payment history tracking
- 🎨 Professional PDF formatting with company branding
- 🌐 CORS enabled for frontend integration
- 🚀 Ready for Render.com deployment

## 📦 Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/Okulo-1996/pdf-server.git
cd pdf-server
```

2. Install dependencies
```bash
npm install
```

3. Start the server
```bash
npm start
```

Server will run on `http://localhost:3000`

## 🔌 API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "I&L Lending PDF Server is running",
  "time": "2026-02-16T10:30:00.000Z"
}
```

### Generate PDF
```
POST /generate-pdf
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "phone": "0775 109 046",
    "email": "john@example.com",
    "address": "123 Main Street, Kampala"
  },
  "loans": [
    {
      "id": 1001,
      "amount": 5000000,
      "term": 12,
      "balance": 2500000,
      "status": "active",
      "totalInterest": 500000,
      "paidAmount": 2500000
    }
  ],
  "payments": [
    {
      "date": "2026-01-15",
      "loanId": 1001,
      "amount": 500000,
      "method": "mobile money"
    }
  ]
}
```

**Response:**
- Returns PDF file as attachment
- Filename: `statement-{customer-name}.pdf`

## 📊 Request Body Fields

### Customer Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Customer full name |
| phone | string | No | Contact phone number |
| email | string | No | Email address |
| address | string | No | Physical address |

### Loans Array
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Loan ID |
| amount | number | Yes | Original loan amount in UGX |
| term | number | No | Loan term in months |
| balance | number | No | Outstanding balance in UGX |
| status | string | No | Loan status (active, paid, overdue) |
| totalInterest | number | No | Total interest accumulated |
| paidAmount | number | No | Amount paid to date |

### Payments Array
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Payment date (ISO format) |
| loanId | number | Yes | Associated loan ID |
| amount | number | Yes | Payment amount in UGX |
| method | string | No | Payment method |

## 🚀 Deployment on Render.com

### Step 1: Push to GitHub
Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Initial commit: PDF server setup"
git push origin main
```

### Step 2: Connect to Render
1. Go to [https://render.com](https://render.com)
2. Sign in with your GitHub account
3. Click "New +" → "Web Service"
4. Select your `Okulo-1996/pdf-server` repository
5. Configure settings:
   - **Name:** pdf-server
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free tier (or higher)

### Step 3: Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Your PDF server will be live at: `https://pdf-server-xxxxx.onrender.com`

## 📝 Usage Example

```bash
curl -X POST https://pdf-server-xxxxx.onrender.com/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Jane Smith",
      "phone": "0750 263 691",
      "email": "jane@illending.com",
      "address": "Kampala, Uganda"
    },
    "loans": [
      {
        "id": 5001,
        "amount": 10000000,
        "term": 24,
        "balance": 5000000,
        "status": "active"
      }
    ],
    "payments": []
  }' \
  -o statement.pdf
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |

## 📞 Contact

**I&L Lending Services**
- Phone: 0775 109 046 | 0750 263 691
- Email: info@illending.com

## 📄 License

MIT License - See LICENSE file for details

## ✅ Status

- ✅ Ready for production
- ✅ Render.com compatible
- ✅ CORS enabled
- ✅ Error handling implemented