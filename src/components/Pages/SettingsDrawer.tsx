import React from 'react';
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
  Switch,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Box,
  useColorMode,
  Heading,
  Button,
} from '@chakra-ui/react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
        <DrawerHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <Text fontWeight="bold">Settings</Text>
            <DrawerCloseButton position="relative" top={0} right={0} />
          </HStack>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={6} align="stretch" py={4}>
            <Box>
              <Heading size="sm" mb={4}>Appearance</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel htmlFor="dark-mode" mb="0">
                    Dark Mode
                  </FormLabel>
                  <Switch 
                    id="dark-mode" 
                    isChecked={colorMode === 'dark'}
                    onChange={toggleColorMode}
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="node-size">Node Size Scale</FormLabel>
                  <Select id="node-size" defaultValue="medium">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel htmlFor="edge-width">Edge Width Scale</FormLabel>
                  <Select id="edge-width" defaultValue="medium">
                    <option value="thin">Thin</option>
                    <option value="medium">Medium</option>
                    <option value="thick">Thick</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={4}>Network Visualization</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel htmlFor="layout-algorithm">Layout Algorithm</FormLabel>
                  <Select id="layout-algorithm" defaultValue="force">
                    <option value="force">Force-Directed</option>
                    <option value="radial">Radial</option>
                    <option value="hierarchical">Hierarchical</option>
                    <option value="circular">Circular</option>
                  </Select>
                </FormControl>
                
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel htmlFor="show-labels" mb="0">
                    Always Show Labels
                  </FormLabel>
                  <Switch 
                    id="show-labels" 
                    defaultChecked={true}
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel htmlFor="show-communities" mb="0">
                    Show Communities
                  </FormLabel>
                  <Switch 
                    id="show-communities" 
                    defaultChecked={false}
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  />
                </FormControl>
              </VStack>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={4}>Performance</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel htmlFor="high-quality" mb="0">
                    High Quality Rendering
                  </FormLabel>
                  <Switch 
                    id="high-quality" 
                    defaultChecked={true}
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel htmlFor="animations" mb="0">
                    Enable Animations
                  </FormLabel>
                  <Switch 
                    id="animations" 
                    defaultChecked={true}
                    colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  />
                </FormControl>
              </VStack>
            </Box>
            
            <Divider />
            
            <Box pt={2}>
              <Button colorScheme={colorMode === 'dark' ? 'blue' : 'brand'} width="100%">
                Save Settings
              </Button>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default SettingsDrawer; 