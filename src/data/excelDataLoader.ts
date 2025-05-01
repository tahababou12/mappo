import * as XLSX from 'xlsx';
import { convertToGraphData } from './dataAdapter';
import { GraphData } from '../types';

// Define the structure to match the dataAdapter HistoricalRecord
interface HistoricalRecord {
  Source: string;
  Target: string;
  Event: string;
  'Start date': string;
  'End date': string;
  Location: string;
  lon: string;
  lat: string;
  'Type of action': string;
  Bibliography: string;
}

// Cache for loaded data to avoid reprocessing
const dataCache = new Map<string, GraphData>();

export async function loadExcelData(filePath: string): Promise<GraphData> {
  try {
    // Return cached data if available
    if (dataCache.has(filePath)) {
      console.log('Using cached data for:', filePath);
      return dataCache.get(filePath)!;
    }

    console.log('Fetching Excel file from:', filePath);
    // Start timing the operation
    const startTime = performance.now();
    
    // Fetch the Excel file
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('File fetched successfully, size:', arrayBuffer.byteLength, 'bytes');
    
    // Parse the Excel file with optimized options
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: false, // Don't convert to dates (faster)
      cellNF: false,    // Don't parse number formats (faster)
      cellStyles: false // Don't parse styles (faster)
    });
    
    console.log('Workbook parsed, sheets:', workbook.SheetNames);
    
    // Assume the first sheet is the data
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as HistoricalRecord[];
    console.log('Excel data converted to JSON, records:', jsonData.length);
    
    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }
    
    // Process all records without any batching or limiting
    console.log('Processing all records:', jsonData.length);
    
    // Convert to GraphData format with all records
    const graphData = convertToGraphData(jsonData);
    
    // Cache the result
    dataCache.set(filePath, graphData);
    
    // Log performance
    const endTime = performance.now();
    console.log(`Excel data processing completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('Graph data created:', {
      nodes: graphData.nodes.length,
      links: graphData.links.length
    });
    
    // Add a small delay to ensure all rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return graphData;
  } catch (error) {
    console.error('Error loading Excel data:', error);
    throw error;
  }
} 