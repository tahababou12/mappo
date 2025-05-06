import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dataRoutes from './routes/dataRoutes';

// For ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173; // Using 5173 as the unified port

// Middleware
app.use(cors());
app.use(express.json());

// API Routes - mount before static files
app.use('/data', dataRoutes);

// Start the server
export const startServer = async () => {
  // Create Vite server in middleware mode
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // In development, use Vite's dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    console.log('Vite dev server middleware attached');
  } else {
    // In production, serve static files
    app.use(express.static(path.join(__dirname, '../../../dist')));
    
    // For any other routes, serve the index.html file
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../../../dist/index.html'));
    });
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  });
};

export default app; 