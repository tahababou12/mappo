import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import MainLayout from './layouts/MainLayout';
import { sampleHistoricalGraphData } from './data/dataAdapter';
import theme from './theme';

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <MainLayout data={sampleHistoricalGraphData} />
      </ChakraProvider>
    </>
  );
}

export default App;
