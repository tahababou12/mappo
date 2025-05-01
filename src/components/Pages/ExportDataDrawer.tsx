import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  useColorMode,
  Heading,
  Button,
  useToast,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Checkbox,
  Progress,
} from '@chakra-ui/react';
import { Download, FileJson, FileText, Image, Database } from 'lucide-react';

interface ExportDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportDataDrawer: React.FC<ExportDataDrawerProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [exportFormat, setExportFormat] = useState('json');
  const [imageFormat, setImageFormat] = useState('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export process
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          
          toast({
            title: 'Export complete',
            description: `Data exported successfully as ${exportFormat.toUpperCase()}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
        <DrawerHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <Text fontWeight="bold">Export Data</Text>
            <DrawerCloseButton position="relative" top={0} right={0} />
          </HStack>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={6} align="stretch" py={4}>
            <Box>
              <Heading size="sm" mb={4}>Export Format</Heading>
              <RadioGroup onChange={setExportFormat} value={exportFormat} mb={4}>
                <VStack align="start" spacing={3}>
                  <Radio 
                    value="json" 
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  >
                    <HStack>
                      <Box as={FileJson} size={16} />
                      <Text>JSON (for technical users)</Text>
                    </HStack>
                  </Radio>
                  
                  <Radio 
                    value="csv" 
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  >
                    <HStack>
                      <Box as={FileText} size={16} />
                      <Text>CSV (for spreadsheet software)</Text>
                    </HStack>
                  </Radio>
                  
                  <Radio 
                    value="image" 
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  >
                    <HStack>
                      <Box as={Image} size={16} />
                      <Text>Image (visualization snapshot)</Text>
                    </HStack>
                  </Radio>
                  
                  <Radio 
                    value="full" 
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  >
                    <HStack>
                      <Box as={Database} size={16} />
                      <Text>Full Dataset (all data formats)</Text>
                    </HStack>
                  </Radio>
                </VStack>
              </RadioGroup>
              
              {exportFormat === 'image' && (
                <FormControl mb={4}>
                  <FormLabel fontSize="sm">Image Format</FormLabel>
                  <Select 
                    value={imageFormat} 
                    onChange={(e) => setImageFormat(e.target.value)}
                    bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                  >
                    <option value="png">PNG</option>
                    <option value="jpg">JPEG</option>
                    <option value="svg">SVG (vector)</option>
                  </Select>
                </FormControl>
              )}
              
              {(exportFormat === 'json' || exportFormat === 'csv') && (
                <FormControl mb={4}>
                  <FormLabel fontSize="sm">Data Structure</FormLabel>
                  <Select 
                    defaultValue="nodes_edges"
                    bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                  >
                    <option value="nodes_edges">Nodes and Edges</option>
                    <option value="adjacency">Adjacency Matrix</option>
                    <option value="nodes_only">Nodes Only</option>
                    <option value="edges_only">Edges Only</option>
                  </Select>
                </FormControl>
              )}
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={4}>Export Options</Heading>
              <VStack align="start" spacing={3}>
                <Checkbox defaultChecked colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
                  Include metadata (descriptions, dates, etc.)
                </Checkbox>
                
                <Checkbox defaultChecked colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
                  Include only visible/filtered data
                </Checkbox>
                
                <Checkbox defaultChecked colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
                  Add export timestamp
                </Checkbox>
                
                {exportFormat === 'image' && (
                  <Checkbox defaultChecked colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
                    Include legend
                  </Checkbox>
                )}
                
                {exportFormat === 'full' && (
                  <Checkbox defaultChecked colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
                    Include documentation
                  </Checkbox>
                )}
              </VStack>
            </Box>
            
            <Divider />
            
            {isExporting ? (
              <Box>
                <Text mb={2}>Exporting data...</Text>
                <Progress value={exportProgress} size="sm" colorScheme={colorMode === 'dark' ? 'blue' : 'brand'} />
                <Text fontSize="xs" mt={1}>{exportProgress}% complete</Text>
              </Box>
            ) : (
              <Button 
                leftIcon={<Download size={16} />} 
                colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                onClick={handleExport}
              >
                Export Data
              </Button>
            )}
            
            <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
              Note: Exported data will reflect your current filters and settings.
            </Text>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ExportDataDrawer; 