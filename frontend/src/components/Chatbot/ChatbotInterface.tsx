import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
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
import { MessageCircle, Send, User, Bot, Maximize2, Minimize2 } from 'lucide-react';
import { Entity, GraphData, GraphLink } from '../../types';
import { sendMessageToOpenAI } from '../../utils/openaiService';

interface ChatbotInterfaceProps {
  entities: Entity[];
  onSelectEntity: (entityId: string) => void;
  graphData?: GraphData; // Optional graph data for more complex operations
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  entities?: string[];
}

// Type for link source/target
interface LinkNode {
  id: string;
  [key: string]: unknown;
}

// Service for handling more complex graph interactions
class GraphInteractionService {
  private graphData?: GraphData;
  private selectEntityCallback: (entityId: string) => void;
  private selectedEntities: Set<string> = new Set();
  
  constructor(graphData: GraphData | undefined, selectEntityCallback: (entityId: string) => void) {
    this.graphData = graphData;
    this.selectEntityCallback = selectEntityCallback;
  }
  
  // Select a single entity
  selectEntity(entityId: string): void {
    this.selectEntityCallback(entityId);
    this.selectedEntities = new Set([entityId]);
  }
  
  // Select multiple entities (by cycling through them with a delay)
  async selectMultipleEntities(entityIds: string[], intervalMs: number = 1500): Promise<void> {
    this.selectedEntities = new Set(entityIds);
    
    // First select the first entity immediately
    if (entityIds.length > 0) {
      this.selectEntityCallback(entityIds[0]);
    }
    
    // Then cycle through the others with a delay
    if (entityIds.length > 1) {
      for (let i = 1; i < entityIds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        this.selectEntityCallback(entityIds[i]);
      }
    }
  }
  
  // Find entities by name (partial match)
  findEntitiesByName(name: string, type?: string): Entity[] {
    if (!this.graphData) return [];
    
    const normalizedName = name.toLowerCase();
    return this.graphData.nodes.filter(entity => 
      entity.name.toLowerCase().includes(normalizedName) && 
      (!type || entity.type === type)
    );
  }
  
  // Find entities by type
  findEntitiesByType(type: string): Entity[] {
    if (!this.graphData) return [];
    return this.graphData.nodes.filter(entity => entity.type === type);
  }
  
  // Find entities related to a specific entity
  findRelatedEntities(entityId: string): Entity[] {
    if (!this.graphData) return [];
    
    const relatedIds = new Set<string>();
    
    this.graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
      
      if (sourceId === entityId) {
        relatedIds.add(targetId);
      } else if (targetId === entityId) {
        relatedIds.add(sourceId);
      }
    });
    
    return this.graphData.nodes.filter(node => relatedIds.has(node.id));
  }
  
  // Find entities by time period
  findEntitiesByTimePeriod(startYear: number, endYear: number): Entity[] {
    if (!this.graphData) return [];
    
    return this.graphData.nodes.filter(entity => {
      if (!entity.startDate) return false;
      
      const entityYear = parseInt(entity.startDate.split('-')[0]);
      return entityYear >= startYear && entityYear <= endYear;
    });
  }
  
  // Find connections between two entities
  findConnectionBetweenEntities(entity1Id: string, entity2Id: string): {
    directConnections: GraphLink[];
    indirectConnections: Array<{
      intermediateEntity: Entity;
      links: GraphLink[];
    }>;
  } | null {
    if (!this.graphData) return null;
    
    // Direct connections
    const directConnections = this.graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
      
      return (sourceId === entity1Id && targetId === entity2Id) || 
             (sourceId === entity2Id && targetId === entity1Id);
    });
    
    // Check for indirect connections through a common entity
    const entity1Links = this.graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
      
      return sourceId === entity1Id || targetId === entity1Id;
    });
    
    const entity2Links = this.graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
      
      return sourceId === entity2Id || targetId === entity2Id;
    });
    
    const entity1ConnectedIds = new Set<string>();
    entity1Links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
      
      if (sourceId === entity1Id) {
        entity1ConnectedIds.add(targetId);
      } else {
        entity1ConnectedIds.add(sourceId);
      }
    });
    
    const entity2ConnectedIds = new Set<string>();
    entity2Links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
      
      if (sourceId === entity2Id) {
        entity2ConnectedIds.add(targetId);
      } else {
        entity2ConnectedIds.add(sourceId);
      }
    });
    
    // Find common connections
    const commonEntityIds = [...entity1ConnectedIds].filter(id => entity2ConnectedIds.has(id));
    
    const indirectConnections = commonEntityIds.map(intermediateId => {
      const intermediateEntity = this.graphData!.nodes.find(node => node.id === intermediateId);
      
      if (!intermediateEntity) {
        return null;
      }
      
      const links = [
        ...entity1Links.filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
          
          return sourceId === intermediateId || targetId === intermediateId;
        }),
        ...entity2Links.filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as LinkNode).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as LinkNode).id;
          
          return sourceId === intermediateId || targetId === intermediateId;
        })
      ];
      
      return {
        intermediateEntity,
        links
      };
    }).filter(Boolean) as Array<{
      intermediateEntity: Entity;
      links: GraphLink[];
    }>;
    
    return {
      directConnections,
      indirectConnections
    };
  }
}

const WELCOME_MESSAGE = {
  id: '0',
  sender: 'bot',
  text: "Welcome to the Historical Network Analysis Assistant! I can help you explore the network, find connections between historical figures, and answer questions about their relationships. Try asking something like 'Tell me about William Wordsworth' or 'What was the relationship between Wordsworth and Coleridge?'",
  timestamp: new Date(),
  entities: []
} as Message;

const SUGGESTIONS = [
  "Who was William Wordsworth?",
  "Show connections between Wordsworth and Coleridge",
  "What events happened in London?",
  "Tell me about John Ruskin",
  "What was the relationship between Elizabeth Barrett and Robert Browning?"
];

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ entities, onSelectEntity, graphData }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  
  // Create graph interaction service
  const graphInteractionService = new GraphInteractionService(graphData, onSelectEntity);

  // Entity map for quick lookups
  const entityMap = entities.reduce((acc, entity) => {
    acc[entity.id] = entity;
    return acc;
  }, {} as Record<string, Entity>);

  // Extract entity names for context with additional metadata
  const contextEntities = entities.map(entity => ({
    id: entity.id,
    name: entity.name,
    type: entity.type,
    // Include additional information from metadata if available
    locations: entity.metadata?.locations,
    time: entity.startDate || entity.endDate,
  }));

  // Entity time period data for contextual answers
  const timePeriods = {
    '18th century': entities.filter(e => e.startDate && e.startDate.startsWith('17')),
    '19th century': entities.filter(e => e.startDate && e.startDate.startsWith('18')),
    '20th century': entities.filter(e => e.startDate && e.startDate.startsWith('19')),
  };

  // Location data for contextual answers
  const locationMap = entities.reduce((acc, entity) => {
    if (entity.metadata?.locations) {
      const locations = typeof entity.metadata.locations === 'string' 
        ? entity.metadata.locations.split(',').map(loc => loc.trim())
        : [];
      
      locations.forEach(location => {
        if (!acc[location]) acc[location] = [];
        acc[location].push(entity.id);
      });
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard shortcut for opening chatbot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
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

  const handleSendMessage = async () => {
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
    
    try {
      // Pre-process the input to identify any explicit graph interaction requests
      const lowerInput = input.toLowerCase();
      const isExplicitGraphRequest = 
        lowerInput.includes('show') || 
        lowerInput.includes('highlight') || 
        lowerInput.includes('display') || 
        lowerInput.includes('connection') || 
        lowerInput.includes('connected to') ||
        lowerInput.includes('relationship between');
      
      // Check for relationship questions between specific entities
      const relationshipMatch = lowerInput.match(/relationship between ([a-z ]+) and ([a-z ]+)/i);
      let entity1, entity2;
      
      if (relationshipMatch) {
        const name1 = relationshipMatch[1].trim();
        const name2 = relationshipMatch[2].trim();
        
        entity1 = entities.find(e => e.name.toLowerCase().includes(name1));
        entity2 = entities.find(e => e.name.toLowerCase().includes(name2));
      }
      
      // Check if this is a request about a specific time period
      const isCenturyRequest = 
        lowerInput.includes('18th century') || 
        lowerInput.includes('19th century') || 
        lowerInput.includes('20th century') ||
        lowerInput.includes('1700s') ||
        lowerInput.includes('1800s') ||
        lowerInput.includes('1900s');
      
      let timePeriod = null;
      if (lowerInput.includes('18th century') || lowerInput.includes('1700s')) timePeriod = '18th century';
      if (lowerInput.includes('19th century') || lowerInput.includes('1800s')) timePeriod = '19th century';
      if (lowerInput.includes('20th century') || lowerInput.includes('1900s')) timePeriod = '20th century';
      
      // Check if this is a request about a specific location
      const locationEntities: string[] = [];
      Object.keys(locationMap).forEach(location => {
        if (lowerInput.includes(location.toLowerCase())) {
          locationEntities.push(...locationMap[location]);
        }
      });
      
      // Prepare conversation history for OpenAI
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Add system message with context about the historical network
      const systemMessage = {
        role: 'system' as const,
        content: `You are a Historical Network Analysis Assistant that helps users explore a network of historical figures, events, organizations, and locations. 
        The network primarily focuses on historical figures and their connections.
        
        Here are some of the key entities in the network (format: name (type)): 
        ${contextEntities.slice(0, 15).map(e => `${e.name} (${e.type})`).join(', ')}.
        
        When mentioning entities that exist in our database, please wrap them in [ENTITY] tags so they can be highlighted.
        For example, if mentioning William Wordsworth, say "[ENTITY]William Wordsworth[/ENTITY]".
        
        If the user is asking about relationships or connections between two entities, describe what you know about their relationship
        and note that the visualization can show these connections graphically.
        
        If the user is asking about a specific location or time period, mention the relevant entities from that location/period.
        
        If the user explicitly asks to show or highlight something in the graph, make sure to tag all relevant entities with [ENTITY] tags
        and state that the visualization will update to show the requested information.`
      };

      // Add additional context if this is a relationship question
      if (entity1 && entity2) {
        systemMessage.content += `\n\nThe user is asking about the relationship between ${entity1.name} and ${entity2.name}.
        Make sure to wrap both [ENTITY]${entity1.name}[/ENTITY] and [ENTITY]${entity2.name}[/ENTITY] in entity tags.
        Explain their relationship if known.`;
      }
      
      // Add additional context for time period questions
      if (timePeriod && isCenturyRequest) {
        const periodEntities = timePeriods[timePeriod as keyof typeof timePeriods];
        const examples = periodEntities.slice(0, 5).map(e => e.name).join(', ');
        
        systemMessage.content += `\n\nThe user is asking about the ${timePeriod}. 
        Some key figures from this period include: ${examples}.
        Make sure to wrap these entity names in [ENTITY] tags.`;
      }
      
      // Add additional context for location questions
      if (locationEntities.length > 0) {
        const locationEntityObjects = locationEntities.slice(0, 5).map(id => entities.find(e => e.id === id));
        const locationExamples = locationEntityObjects.filter(Boolean).map(e => e?.name).join(', ');
        
        systemMessage.content += `\n\nThe user is asking about a specific location. 
        Entities associated with this location include: ${locationExamples}.
        Make sure to wrap these entity names in [ENTITY] tags.`;
      }

      // Add current user message
      conversationHistory.push({
        role: 'user' as const,
        content: input
      });

      // Send to OpenAI
      const aiResponse = await sendMessageToOpenAI([
        systemMessage,
        ...conversationHistory
      ]);

      // Process the response to extract entity mentions
      let responseText = aiResponse.message || "I'm having trouble connecting to the knowledge base right now. Please try again later.";
      const mentionedEntities: string[] = [];

      // Extract entities mentioned in the response (marked with [ENTITY] tags)
      const entityRegex = /\[ENTITY\](.*?)\[\/ENTITY\]/g;
      let match;
      
      // Remove entity tags and collect mentioned entities
      while ((match = entityRegex.exec(responseText)) !== null) {
        const entityName = match[1];
        const entity = entities.find(e => 
          e.name.toLowerCase() === entityName.toLowerCase() ||
          entityName.toLowerCase().includes(e.name.toLowerCase())
        );
        
        if (entity) {
          mentionedEntities.push(entity.id);
        }
      }

      // Clean the response of entity tags
      responseText = responseText.replace(/\[ENTITY\](.*?)\[\/ENTITY\]/g, '$1');
      
      // Add bot response
      const botMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date(),
        entities: mentionedEntities
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Special handling for relationship questions - use the graph interaction service
      if (entity1 && entity2 && mentionedEntities.includes(entity1.id) && mentionedEntities.includes(entity2.id)) {
        // Use our enhanced graph service to display both entities in sequence
        await graphInteractionService.selectMultipleEntities([entity1.id, entity2.id], 1500);
      }
      // Special handling for time period questions - highlight multiple entities from that period
      else if (timePeriod && mentionedEntities.length > 0) {
        // Select the first mentioned entity to begin with
        graphInteractionService.selectEntity(mentionedEntities[0]);
      }
      // Special handling for location questions - highlight entities from that location
      else if (locationEntities.length > 0 && mentionedEntities.some(id => locationEntities.includes(id))) {
        // Find the first mentioned entity that's associated with the location
        const locationEntity = mentionedEntities.find(id => locationEntities.includes(id));
        if (locationEntity) {
          graphInteractionService.selectEntity(locationEntity);
        }
      }
      // Default case - highlight the first mentioned entity
      else if (mentionedEntities.length > 0) {
        graphInteractionService.selectEntity(mentionedEntities[0]);
      }
      
      // If this was an explicit graph request, ensure the visualization is updated
      if (isExplicitGraphRequest && mentionedEntities.length > 0) {
        // If there are multiple mentioned entities, cycle through them
        if (mentionedEntities.length > 1 && isExplicitGraphRequest) {
          await graphInteractionService.selectMultipleEntities(mentionedEntities, 1500);
        } else {
          // Otherwise just select the first one
          graphInteractionService.selectEntity(mentionedEntities[0]);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add fallback bot response if there's an error
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: "I'm having trouble connecting to the knowledge base right now. Please try again later.",
        timestamp: new Date(),
        entities: []
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
      <Tooltip label="Open chatbot assistant (Shift)" placement="left">
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
      
      <style dangerouslySetInnerHTML={{__html: `
        .typing-animation {
          display: inline-block;
          animation: ellipsis 1.5s infinite;
        }
        
        @keyframes ellipsis {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }
      `}} />
    </>
  );
};

export default ChatbotInterface;