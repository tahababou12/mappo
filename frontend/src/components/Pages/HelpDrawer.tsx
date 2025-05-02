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
  Box,
  useColorMode,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  Link,
  Divider,
} from '@chakra-ui/react';
import { ExternalLink, Info, MousePointer, Search, Filter, Command } from 'lucide-react';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDrawer: React.FC<HelpDrawerProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
        <DrawerHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <Text fontWeight="bold">Help & Documentation</Text>
            <DrawerCloseButton position="relative" top={0} right={0} />
          </HStack>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={6} align="stretch" py={4}>
            <Box>
              <Heading size="sm" mb={4}>Getting Started</Heading>
              <Text fontSize="sm" mb={4}>
                Welcome to the Historical Network Analysis Tool. This application helps you explore historical relationships and connections between people, organizations, and events.
              </Text>
              
              <VStack spacing={2} align="stretch">
                <HStack>
                  <Box as={Info} size={16} />
                  <Text fontWeight="medium">View different visualizations using the Views menu</Text>
                </HStack>
                <HStack>
                  <Box as={Search} size={16} />
                  <Text fontWeight="medium">Search for entities using the search bar</Text>
                </HStack>
                <HStack>
                  <Box as={MousePointer} size={16} />
                  <Text fontWeight="medium">Click on nodes to view detailed information</Text>
                </HStack>
                <HStack>
                  <Box as={Filter} size={16} />
                  <Text fontWeight="medium">Use filters to focus on specific entity types</Text>
                </HStack>
              </VStack>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={4}>Frequently Asked Questions</Heading>
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        How do I navigate the network?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm">
                      You can zoom in/out using the scroll wheel, drag the network to pan, and click on nodes to select them. Double-clicking a node will center the view on that node.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        What do the different colors mean?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm">
                      Colors represent different types of entities: blue for people, orange for organizations, purple for events, and green for locations.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        How do I search for specific entities?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm">
                      Use the search bar in the top navigation. You can search by name, type, or other attributes.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
                
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        Can I export the network data?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm">
                      Yes, you can export data using the Export button in the header. Options include CSV, JSON, and image formats for visualizations.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={4}>Keyboard Shortcuts</Heading>
              <List spacing={2}>
                <ListItem>
                  <HStack>
                    <Box as={Command} size={16} />
                    <Text fontWeight="medium" minWidth="100px">F</Text>
                    <Text>Toggle fullscreen mode</Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as={Command} size={16} />
                    <Text fontWeight="medium" minWidth="100px">/</Text>
                    <Text>Focus search bar</Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as={Command} size={16} />
                    <Text fontWeight="medium" minWidth="100px">ESC</Text>
                    <Text>Deselect current node</Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Box as={Command} size={16} />
                    <Text fontWeight="medium" minWidth="100px">Shift</Text>
                    <Text>Toggle chatbot assistant</Text>
                  </HStack>
                </ListItem>
              </List>
            </Box>
            
            <Divider />
            
            <Box>
              <Heading size="sm" mb={4}>Additional Resources</Heading>
              <List spacing={2}>
                <ListItem>
                  <Link href="#" isExternal color={colorMode === 'dark' ? 'blue.300' : 'blue.600'}>
                    <HStack>
                      <Box as={ExternalLink} size={16} />
                      <Text>User Guide</Text>
                    </HStack>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="#" isExternal color={colorMode === 'dark' ? 'blue.300' : 'blue.600'}>
                    <HStack>
                      <Box as={ExternalLink} size={16} />
                      <Text>Video Tutorials</Text>
                    </HStack>
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="#" isExternal color={colorMode === 'dark' ? 'blue.300' : 'blue.600'}>
                    <HStack>
                      <Box as={ExternalLink} size={16} />
                      <Text>Contact Support</Text>
                    </HStack>
                  </Link>
                </ListItem>
              </List>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default HelpDrawer; 