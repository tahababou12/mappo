import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ChakraProvider, ColorModeScript, Spinner, Center, Text, VStack, Button } from '@chakra-ui/react';
import axios from 'axios';
import theme from './theme';
import { GraphData } from './types';

// Lazy load the main layout to improve initial load time
const MainLayout = lazy(() => import('./layouts/MainLayout'));

// Simple Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center height="100vh">
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              Something went wrong
            </Text>
            <Text color="gray.600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button
              onClick={() => window.location.reload()}
              colorScheme="blue"
              variant="outline"
            >
              Reload Page
            </Button>
          </VStack>
        </Center>
      );
    }

    return this.props.children;
  }
}

// Memory optimization for large datasets - Preserve all nodes and edges
const optimizeGraph = (data: unknown): GraphData => {
  // Validate input data structure
  if (!data || typeof data !== 'object') {
    console.error("Invalid data: data is null, undefined, or not an object");
    return { nodes: [], links: [] };
  }
  
  const graphData = data as { nodes?: unknown; links?: unknown };
  
  // More robust validation for nodes
  if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
    console.error("Invalid data: nodes is not an array or is undefined", graphData.nodes);
    return { nodes: [], links: [] };
  }
  
  // More robust validation for links
  if (!graphData.links || !Array.isArray(graphData.links)) {
    console.error("Invalid data: links is not an array or is undefined", graphData.links);
    return { nodes: [], links: [] };
  }
  
  // This is a pass-through function now - we want to show all nodes and edges
  console.log(`Processing graph data with ${graphData.nodes.length} nodes and ${graphData.links.length} links`);
  
  // Validate the data
  if (graphData.nodes.length === 0) {
    console.warn("Warning: No nodes found in the graph data!");
  }
  
  // Log some sample nodes for debugging
  if (graphData.nodes.length > 0) {
    console.log("Sample nodes:", graphData.nodes.slice(0, 5).map((n: { name?: string }) => n?.name || 'Unknown'));
  }
  
  // Log some sample links for debugging
  if (graphData.links.length > 0) {
    console.log("Sample links:", graphData.links.slice(0, 5).map((l: { source?: unknown; target?: unknown }) => ({
      source: l?.source ? String(l.source) : 'Unknown',
      target: l?.target ? String(l.target) : 'Unknown'
    })));
  }
  
  // Deep clone the data to avoid reference issues
  return {
    nodes: [...graphData.nodes],
    links: [...graphData.links]
  };
};

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? '/api'  // Use relative path when serving from same domain
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
        console.log('Environment:', process.env.NODE_ENV);
        console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
        
        // Use API to fetch data
        try {
          setLoadingProgress(30);
          const response = await axios.get(`${API_URL}/data/excel`);
          console.log('API Response status:', response.status);
          console.log('API Response headers:', response.headers);
          console.log('API Response data type:', typeof response.data);
          console.log('API Response data:', response.data);
          
          // Check if response data is valid
          if (!response.data) {
            throw new Error('API returned empty response');
          }
          
          // Check if response data is an error object
          if (response.data.error) {
            throw new Error(`API error: ${response.data.error}`);
          }
          
          const graphData = response.data;
          console.log('Graph data before optimization:', {
            type: typeof graphData,
            hasNodes: 'nodes' in graphData,
            hasLinks: 'links' in graphData,
            nodesType: typeof graphData.nodes,
            linksType: typeof graphData.links,
            nodesIsArray: Array.isArray(graphData.nodes),
            linksIsArray: Array.isArray(graphData.links)
          });
          
          setLoadingProgress(80);
          // Optimize the data for performance
          const optimizedData = optimizeGraph(graphData);
          console.log('Optimized data:', optimizedData);
          
          // Additional validation after optimization
          if (!optimizedData.nodes || !Array.isArray(optimizedData.nodes) || 
              !optimizedData.links || !Array.isArray(optimizedData.links)) {
            throw new Error('Data optimization failed: Invalid data structure');
          }
          
          if (isMounted) {
            setData(optimizedData);
            setLoadingProgress(100);
            setTimeout(() => setLoading(false), 1000); // Increased from 100ms to 1000ms
          }
        } catch (err) {
          console.error('Failed to load data from API, falling back to sample data:', err);
          if (axios.isAxiosError(err)) {
            console.error('Axios error details:', {
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
              url: err.config?.url
            });
          }
          if (isMounted) {
            setError(`Failed to process data: ${err instanceof Error ? err.message : String(err)}`);
            // Fetch sample data instead
            try {
              console.log('Trying to fetch sample data from:', `${API_URL}/data/sample`);
              const sampleResponse = await axios.get(`${API_URL}/data/sample`);
              console.log('Sample data response:', sampleResponse.data);
              
              // Validate sample data as well
              if (!sampleResponse.data) {
                throw new Error('Sample API returned empty response');
              }
              
              // Check if sample response data is an error object
              if (sampleResponse.data.error) {
                throw new Error(`Sample API error: ${sampleResponse.data.error}`);
              }
              
              const sampleOptimizedData = optimizeGraph(sampleResponse.data);
              
              if (!sampleOptimizedData.nodes || !Array.isArray(sampleOptimizedData.nodes) || 
                  !sampleOptimizedData.links || !Array.isArray(sampleOptimizedData.links)) {
                throw new Error('Sample data optimization failed: Invalid data structure');
              }
              
              setData(sampleOptimizedData);
              setError(null); // Clear error since we got sample data
            } catch (sampleErr) {
              console.error('Sample data error:', sampleErr);
              if (axios.isAxiosError(sampleErr)) {
                console.error('Sample data axios error details:', {
                  status: sampleErr.response?.status,
                  statusText: sampleErr.response?.statusText,
                  data: sampleErr.response?.data,
                  url: sampleErr.config?.url
                });
              }
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
        <ErrorBoundary>
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
            <ErrorBoundary>
              <MainLayout data={data} />
            </ErrorBoundary>
          </Suspense>
        ) : (
            <Center height="100vh">
              <Text color="red.500">Error loading data: {error}</Text>
            </Center>
          )}
        </ErrorBoundary>
      </ChakraProvider>
    </>
  );
}

export default App;
