import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  Avatar,
  VStack,
  HStack,
  IconButton,
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Tooltip,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { MessageCircle, Send, User, Bot, X, Maximize2, Minimize2, Calendar, MapPin, Book } from 'lucide-react';
import { Entity } from '../../types';

interface ChatbotInterfaceProps {
  entities: Entity[];
  onSelectEntity: (entityId: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  entities?: string[];
}

const WELCOME_MESSAGE = {
  id: '0',
  sender: 'bot',
  text: "Welcome to the Historical Network Analysis Assistant! I can help you explore the network, find connections between historical figures, and answer questions about their relationships. Try asking something like 'Tell me about William Wordsworth' or 'What was the relationship between Wordsworth and Coleridge?'",
  timestamp: new Date(),
  entities: []
};

const SUGGESTIONS = [
  "Who was William Wordsworth?",
  "Show connections between Wordsworth and Coleridge",
  "What events happened in London?",
  "Tell me about John Ruskin",
  "What was the relationship between Elizabeth Barrett and Robert Browning?"
];

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ entities, onSelectEntity }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();

  // Entity map for quick lookups
  const entityMap = entities.reduce((acc, entity) => {
    acc[entity.id] = entity;
    return acc;
  }, {} as Record<string, Entity>);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard shortcut for opening chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen, onClose]);

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate bot response after a delay
    setTimeout(() => {
      // Simple keyword matching for demo purposes
      const lowerInput = input.toLowerCase();
      let responseText = "I'm not sure about that. Could you try asking something about the historical figures or events in our network?";
      let mentionedEntities: string[] = [];
      
      // Check for entity mentions
      entities.forEach(entity => {
        if (lowerInput.includes(entity.name.toLowerCase())) {
          mentionedEntities.push(entity.id);
          
          if (mentionedEntities.length === 1) {
            responseText = `${entity.name} was a ${entity.type} in our historical network. `;
            
            if (entity.type === 'person') {
              responseText += "They were connected to several other historical figures through correspondence and meetings.";
            } else if (entity.type === 'location') {
              responseText += "This location was the site of several important historical events and meetings.";
            } else if (entity.type === 'event') {
              responseText += "This event involved several key historical figures.";
            } else {
              responseText += "This organization was connected to several historical figures.";
            }
          }
        }
      });
      
      // Check for relationship questions
      if (mentionedEntities.length > 1) {
        responseText = `I found information about multiple entities you mentioned. Let me show you how they're connected in the network.`;
        
        // Find relationships between mentioned entities
        const entity1 = entityMap[mentionedEntities[0]];
        const entity2 = entityMap[mentionedEntities[1]];
        
        if (entity1 && entity2) {
          responseText += ` ${entity1.name} and ${entity2.name} were connected through various interactions, which you can explore in the graph visualization.`;
        }
      }
      
      // Check for location-related questions
      if (lowerInput.includes('london') || lowerInput.includes('rydal')) {
        const location = lowerInput.includes('london') ? 'London' : 'Rydal';
        responseText = `${location} was an important location in our historical network. Several key figures met or corresponded while in ${location}.`;
        
        // Find entities associated with this location
        const relatedEntities = entities.filter(e => 
          e.metadata.locations && 
          (e.metadata.locations as string).toLowerCase().includes(location.toLowerCase())
        );
        
        if (relatedEntities.length > 0) {
          mentionedEntities = relatedEntities.slice(0, 3).map(e => e.id);
          responseText += ` Notable figures associated with ${location} include ${relatedEntities.slice(0, 3).map(e => e.name).join(', ')}.`;
        }
      }
      
      // Check for time period questions
      if (lowerInput.includes('1800') || lowerInput.includes('19th century')) {
        responseText = "The early 19th century was a significant period in literary history, particularly for the Romantic poets and writers in our network.";
        
        // Find entities from this time period
        const relatedEntities = entities.filter(e => 
          e.startDate && e.startDate.startsWith('18')
        );
        
        if (relatedEntities.length > 0) {
          mentionedEntities = relatedEntities.slice(0, 3).map(e => e.id);
          responseText += ` Key figures active during this period include ${relatedEntities.slice(0, 3).map(e => e.name).join(', ')}.`;
        }
      }
      
      const botMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date(),
        entities: mentionedEntities
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Highlight mentioned entities in the graph
      if (mentionedEntities.length > 0) {
        onSelectEntity(mentionedEntities[0]);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleEntityClick = (entityId: string) => {
    onSelectEntity(entityId);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <Tooltip label="Open chatbot assistant (C)" placement="left">
        <IconButton
          aria-label="Open chatbot assistant"
          icon={<MessageCircle size={20} />}
          position="fixed"
          bottom="20"
          right="4"
          colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
          borderRadius="full"
          boxShadow="lg"
          onClick={onOpen}
          zIndex="docked"
          size="lg"
        />
      </Tooltip>
      
      {/* Chatbot drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
          <DrawerHeader borderBottomWidth="1px" p={4}>
            <Flex justify="space-between" align="center">
              <HStack>
                <Avatar 
                  size="sm" 
                  bg={colorMode === 'dark' ? 'blue.500' : 'brand.500'} 
                  icon={<Bot size={20} color="white" />} 
                />
                <Text fontWeight="bold">Historical Network Assistant</Text>
              </HStack>
              
              <HStack>
                <IconButton
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                  icon={isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  size="sm"
                  variant="ghost"
                  onClick={toggleMinimize}
                />
                <DrawerCloseButton position="relative" top={0} right={0} />
              </HStack>
            </Flex>
          </DrawerHeader>
          
          <DrawerBody p={0}>
            {!isMinimized && (
              <VStack h="full" spacing={0}>
                {/* Messages area */}
                <Box 
                  flex="1" 
                  w="full" 
                  overflowY="auto" 
                  p={4} 
                  bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                >
                  <VStack spacing={4} align="stretch">
                    {messages.map((message) => (
                      <Box key={message.id}>
                        <HStack mb={1} spacing={2}>
                          <Avatar 
                            size="xs" 
                            bg={message.sender === 'bot' 
                              ? (colorMode === 'dark' ? 'blue.500' : 'brand.500') 
                              : 'gray.500'
                            } 
                            icon={message.sender === 'bot' 
                              ? <Bot size={12} color="white" /> 
                              : <User size={12} color="white" />
                            } 
                          />
                          <Text 
                            fontSize="xs" 
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                          >
                            {message.sender === 'bot' ? 'Assistant' : 'You'}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                          >
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </HStack>
                        
                        <Box 
                          ml={8} 
                          p={3} 
                          bg={message.sender === 'bot' 
                            ? (colorMode === 'dark' ? 'blue.800' : 'blue.50') 
                            : (colorMode === 'dark' ? 'gray.600' : 'gray.100')
                          } 
                          borderRadius="md"
                        >
                          <Text fontSize="sm">{message.text}</Text>
                          
                          {message.entities && message.entities.length > 0 && (
                            <Box mt={2}>
                              <Divider my={1} />
                              <Text fontSize="xs" fontWeight="medium" mb={1}>Referenced entities:</Text>
                              <Flex wrap="wrap" gap={1}>
                                {message.entities.map(entityId => {
                                  const entity = entityMap[entityId];
                                  if (!entity) return null;
                                  
                                  return (
                                    <Badge 
                                      key={entityId}
                                      colorScheme={
                                        entity.type === 'person' ? 'blue' :
                                        entity.type === 'organization' ? 'orange' :
                                        entity.type === 'event' ? 'purple' : 'green'
                                      }
                                      cursor="pointer"
                                      onClick={() => handleEntityClick(entityId)}
                                    >
                                      {entity.name}
                                    </Badge>
                                  );
                                })}
                              </Flex>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                    
                    {isTyping && (
                      <Box>
                        <HStack mb={1} spacing={2}>
                          <Avatar 
                            size="xs" 
                            bg={colorMode === 'dark' ? 'blue.500' : 'brand.500'} 
                            icon={<Bot size={12} color="white" />} 
                          />
                          <Text 
                            fontSize="xs" 
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                          >
                            Assistant
                          </Text>
                        </HStack>
                        
                        <Box 
                          ml={8} 
                          p={3} 
                          bg={colorMode === 'dark' ? 'blue.800' : 'blue.50'} 
                          borderRadius="md"
                        >
                          <Text fontSize="sm">Typing<span className="typing-animation">...</span></Text>
                        </Box>
                      </Box>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </VStack>
                </Box>
                
                {/* Suggestions */}
                {messages.length < 3 && (
                  <Box w="full" p={3} borderTopWidth="1px" borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}>
                    <Text fontSize="xs" fontWeight="medium" mb={2}>Suggested questions:</Text>
                    <Flex wrap="wrap" gap={2}>
                      {SUGGESTIONS.map((suggestion, index) => (
                        <Badge 
                          key={index}
                          colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                          cursor="pointer"
                          onClick={() => handleSuggestionClick(suggestion)}
                          p={1}
                          borderRadius="md"
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
                
                {/* Input area */}
                <Box w="full" p={3} borderTopWidth="1px" borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}>
                  <Flex>
                    <Input
                      placeholder="Ask about historical connections..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      mr={2}
                      bg={colorMode === 'dark' ? 'gray.700' : 'white'}
                    />
                    <IconButton
                      aria-label="Send message"
                      icon={<Send size={16} />}
                      colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                      onClick={handleSendMessage}
                      isDisabled={input.trim() === '' || isTyping}
                    />
                  </Flex>
                </Box>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      <style jsx>{`
        .typing-animation {
          display: inline-block;
          animation: ellipsis 1.5s infinite;
        }
        
        @keyframes ellipsis {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }
      `}</style>
    </>
  );
};

export default ChatbotInterface;
