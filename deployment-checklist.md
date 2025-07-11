# 🚀 AWS EC2 Deployment Checklist

## 🔍 Current Issue
Your API is returning HTML instead of JSON, which means the backend server isn't properly configured or running on AWS EC2.

## ✅ Step-by-Step Troubleshooting

### 1. **Check Backend Server Status**
SSH into your EC2 instance and run:
```bash
# Check if Node.js processes are running
ps aux | grep node

# Check if your backend server is running on the expected port
netstat -tlnp | grep :3001
# OR
ss -tlnp | grep :3001
```

### 2. **Verify Backend Server Configuration**
```bash
# Navigate to your backend directory
cd /path/to/your/backend

# Check if dependencies are installed
npm list

# Try running the backend server manually
npm start
# OR
node dist/server.js
```

### 3. **Check Environment Variables**
```bash
# Check if NODE_ENV is set to production
echo $NODE_ENV

# Check if API port is configured correctly
echo $PORT
```

### 4. **Test API Endpoints Directly**
```bash
# Test from within the EC2 instance
curl -X GET http://localhost:3001/api/data/sample
curl -X GET http://localhost:3001/api/data/excel

# Test from outside (replace with your domain)
curl -X GET https://mhall.bragai.tech/api/data/sample
```

### 5. **Check Reverse Proxy Configuration**
If using Nginx or Apache:
```bash
# Check Nginx configuration
sudo nginx -t
sudo systemctl status nginx

# Check Apache configuration
sudo apachectl configtest
sudo systemctl status apache2
```

### 6. **Check PM2 Process Manager (if using)**
```bash
# Check PM2 processes
pm2 list
pm2 logs
pm2 restart all
```

### 7. **Verify File Permissions**
```bash
# Check if your user has permission to read the Excel file
ls -la /path/to/your/backend/src/data/
```

## 🔧 Common Solutions

### Option A: Start Backend Server
```bash
cd backend
npm install
npm run build
npm start
```

### Option B: Use PM2 for Process Management
```bash
# Install PM2 globally
npm install -g pm2

# Start your backend server with PM2
cd backend
pm2 start dist/server.js --name "backend"
pm2 startup
pm2 save
```

### Option C: Configure Reverse Proxy (Nginx Example)
```nginx
server {
    listen 80;
    server_name mhall.bragai.tech;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option D: Environment Configuration
Create a `.env` file in your backend directory:
```env
NODE_ENV=production
PORT=3001
```

## 🚨 Quick Fix Commands

Run these commands on your EC2 instance:
```bash
# 1. Navigate to your project
cd /path/to/your/project

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Build both projects
cd ../backend && npm run build
cd ../frontend && npm run build

# 4. Start backend server
cd ../backend && npm start &

# 5. Test API
curl http://localhost:3001/api/data/sample
```

## 🔍 Debug Script
Run the debugging script we created:
```bash
node debug-api.js
```

Let me know what you find from these checks! 