import express, { Request, Response } from 'express';
import { loadExcelData } from '../data/excelDataLoader';
import { sampleHistoricalGraphData } from '../data/dataAdapter';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get sample data
router.get('/sample', (req: Request, res: Response) => {
  try {
    res.json(sampleHistoricalGraphData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sample data' });
  }
});

// Get Excel data
router.get('/excel', async (req: Request, res: Response) => {
  try {
    const excelFilePath = path.join(__dirname, '../data/cleaned_ruskin.xlsx');
    const graphData = await loadExcelData(excelFilePath);
    res.json(graphData);
  } catch (error) {
    console.error('Error loading Excel data:', error);
    res.status(500).json({ 
      error: 'Failed to load Excel data',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 