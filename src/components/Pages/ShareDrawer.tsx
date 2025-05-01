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
  Input,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  Flex,
  Switch,
} from '@chakra-ui/react';
import { Link2, Mail, Copy, Twitter, Facebook, Linkedin } from 'lucide-react';

interface ShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareDrawer: React.FC<ShareDrawerProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const [shareUrl, setShareUrl] = useState('https://historical-network.example.com/view/abc123');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailMessage, setEmailMessage] = useState('Check out this interesting historical network visualization I found!');
  const toast = useToast();
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: 'The share link has been copied to your clipboard',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  const handleSendEmail = () => {
    // In a real app, this would send an email via API
    toast({
      title: 'Email sent',
      description: `Share link sent to ${emailRecipient}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setEmailRecipient('');
  };
  
  const handleSocialShare = (platform: string) => {
    // In a real app, this would open the respective sharing dialog
    toast({
      title: 'Sharing',
      description: `Opening ${platform} share dialog...`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
        <DrawerHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <Text fontWeight="bold">Share Visualization</Text>
            <DrawerCloseButton position="relative" top={0} right={0} />
          </HStack>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={6} align="stretch" py={4}>
            <Box>
              <Heading size="sm" mb={4}>Current Visualization</Heading>
              <Box 
                borderWidth="1px" 
                borderRadius="md" 
                p={3}
                bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
              >
                <Text fontSize="sm" mb={2}>The current network view includes:</Text>
                <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                  • All relationships in the American Civil War era
                  • Focus on historical figures and organizations
                  • Applied filters: people, organizations
                </Text>
              </Box>
            </Box>
            
            <Divider />
            
            <Tabs colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
              <TabList>
                <Tab><Box as={Link2} size={16} mr={2} /> Direct Link</Tab>
                <Tab><Box as={Mail} size={16} mr={2} /> Email</Tab>
                <Tab>Social Media</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel px={0} py={4}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">Share Link</FormLabel>
                      <HStack>
                        <Input 
                          value={shareUrl} 
                          onChange={(e) => setShareUrl(e.target.value)}
                          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                        />
                        <Button 
                          leftIcon={<Copy size={16} />} 
                          onClick={handleCopyLink}
                          colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                        >
                          Copy
                        </Button>
                      </HStack>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center" mt={2}>
                      <FormLabel htmlFor="include-filters" mb="0" fontSize="sm">
                        Include current filters
                      </FormLabel>
                      <Switch 
                        id="include-filters" 
                        defaultChecked={true}
                        colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                      />
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="include-selection" mb="0" fontSize="sm">
                        Include current selection
                      </FormLabel>
                      <Switch 
                        id="include-selection" 
                        defaultChecked={true}
                        colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>
                
                <TabPanel px={0} py={4}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">Recipient Email</FormLabel>
                      <Input 
                        type="email" 
                        placeholder="colleague@example.com"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Message</FormLabel>
                      <Textarea 
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Add a personal message here..."
                        rows={3}
                        bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                      />
                    </FormControl>
                    
                    <Button 
                      leftIcon={<Mail size={16} />} 
                      colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                      onClick={handleSendEmail}
                      isDisabled={!emailRecipient}
                    >
                      Send Email
                    </Button>
                  </VStack>
                </TabPanel>
                
                <TabPanel px={0} py={4}>
                  <Text fontSize="sm" mb={4}>
                    Share this visualization on your favorite social platform:
                  </Text>
                  
                  <Flex gap={3} wrap="wrap">
                    <Button 
                      leftIcon={<Twitter size={16} />} 
                      onClick={() => handleSocialShare('Twitter')}
                      colorScheme="twitter"
                      size="md"
                    >
                      Twitter
                    </Button>
                    <Button 
                      leftIcon={<Facebook size={16} />} 
                      onClick={() => handleSocialShare('Facebook')}
                      colorScheme="facebook"
                      size="md"
                    >
                      Facebook
                    </Button>
                    <Button 
                      leftIcon={<Linkedin size={16} />} 
                      onClick={() => handleSocialShare('LinkedIn')}
                      colorScheme="linkedin"
                      size="md"
                    >
                      LinkedIn
                    </Button>
                  </Flex>
                  
                  <Text fontSize="xs" mt={4} color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                    Note: Sharing on social media will include a snapshot of the current view.
                  </Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ShareDrawer; 