import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ChakraProvider, ColorModeScript, Spinner, Center, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';
import theme from './theme';
import { GraphData } from './types';

// Lazy load the main layout to improve initial load time
const MainLayout = lazy(() => import('./layouts/MainLayout'));

// Memory optimization for large datasets - Preserve all nodes and edges
const optimizeGraph = (data: GraphData): GraphData => {
  // This is a pass-through function now - we want to show all nodes and edges
  console.log(`Processing graph data with ${data.nodes.length} nodes and ${data.links.length} links`);
  
  // Validate the data
  if (data.nodes.length === 0) {
    console.warn("Warning: No nodes found in the graph data!");
  }
  
  // Log some sample nodes for debugging
  if (data.nodes.length > 0) {
    console.log("Sample nodes:", data.nodes.slice(0, 5).map(n => n.name));
  }
  
  // Log some sample links for debugging
  if (data.links.length > 0) {
    console.log("Sample links:", data.links.slice(0, 5).map(l => ({
      source: typeof l.source === 'string' ? l.source : String(l.source),
      target: typeof l.target === 'string' ? l.target : String(l.target)
    })));
  }
  
  // Deep clone the data to avoid reference issues
  return {
    nodes: [...data.nodes],
    links: [...data.links]
  };
};

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api'
);

function App() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        setLoading(true);
        setLoadingProgress(10);
        
        console.log('Fetching data from API:', `${API_URL}/data/excel`);
        
        // Use API to fetch data
        try {
          setLoadingProgress(30);
          const response = await axios.get(`${API_URL}/data/excel`);
          const graphData = response.data;
          
          setLoadingProgress(80);
          // Optimize the data for performance
          const optimizedData = optimizeGraph(graphData);
          
          if (isMounted) {
            setData(optimizedData);
            setLoadingProgress(100);
            setTimeout(() => setLoading(false), 1000); // Increased from 100ms to 1000ms
          }
        } catch (err) {
          console.error('Failed to load data from API, falling back to sample data:', err);
          if (isMounted) {
            setError(`Failed to process data: ${err instanceof Error ? err.message : String(err)}`);
            // Fetch sample data instead
            try {
              const sampleResponse = await axios.get(`${API_URL}/data/sample`);
              setData(sampleResponse.data);
            } catch (sampleErr) {
              setError(`Failed to load sample data: ${sampleErr instanceof Error ? sampleErr.message : String(sampleErr)}`);
            }
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        if (isMounted) {
          setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}. Falling back to sample data.`);
          setLoading(false);
        }
      }
    }

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        {loading ? (
          <Center height="100vh">
            <VStack spacing={4}>
              <Spinner size="xl" />
              <Text>Loading network data... {loadingProgress}%</Text>
              {error && <Text color="red.500" fontSize="sm">{error}</Text>}
            </VStack>
          </Center>
        ) : data ? (
          <Suspense fallback={
            <Center height="100vh">
              <Spinner size="xl" />
            </Center>
          }>
            <MainLayout data={data} />
          </Suspense>
        ) : (
          <Center height="100vh">
            <Text color="red.500">Error loading data: {error}</Text>
          </Center>
        )}
      </ChakraProvider>
    </>
  );
}

export default App;
