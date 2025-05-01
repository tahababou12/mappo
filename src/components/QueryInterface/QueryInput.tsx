import React, { useState } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Text,
  Flex,
  useColorMode,
  List,
  ListItem,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';

interface QueryInputProps {
  onSubmitQuery: (query: string) => void;
  isLoading: boolean;
}

const EXAMPLE_QUERIES = [
  "Show connections between Abraham Lincoln and the Civil War",
  "Who were the key figures in the Battle of Gettysburg?",
  "What events led to the Emancipation Proclamation?",
  "Find all family relationships in the network",
  "Show all events connected to Washington D.C."
];

const QueryInput: React.FC<QueryInputProps> = ({ onSubmitQuery, isLoading }) => {
  const [query, setQuery] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const { colorMode } = useColorMode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() === '') return;
    
    onSubmitQuery(query);
    
    // Add to recent queries if not already there
    if (!recentQueries.includes(query)) {
      setRecentQueries(prev => [query, ...prev].slice(0, 5));
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <InputGroup size="md" mb={3}>
          <Input
            placeholder="Ask a question about the historical network..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg={colorMode === 'dark' ? 'gray.700' : 'white'}
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            _hover={{ borderColor: colorMode === 'dark' ? 'gray.500' : 'gray.300' }}
            _focus={{ 
              borderColor: colorMode === 'dark' ? 'blue.300' : 'blue.500',
              boxShadow: colorMode === 'dark' ? '0 0 0 1px #63B3ED' : '0 0 0 1px #3182CE'
            }}
          />
          <InputRightElement width="4.5rem">
            <Button 
              h="1.75rem" 
              size="sm" 
              type="submit"
              isLoading={isLoading}
              colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
              leftIcon={<Search size={14} />}
            >
              Ask
            </Button>
          </InputRightElement>
        </InputGroup>
      </form>

      <Box mb={3}>
        <Text fontSize="sm" fontWeight="medium" mb={1}>Example queries:</Text>
        <Flex flexWrap="wrap" gap={2}>
          {EXAMPLE_QUERIES.map((example, index) => (
            <Button
              key={index}
              size="xs"
              variant="outline"
              onClick={() => handleExampleClick(example)}
              colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
            >
              {example.length > 30 ? `${example.substring(0, 30)}...` : example}
            </Button>
          ))}
        </Flex>
      </Box>

      {recentQueries.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>Recent queries:</Text>
          <List spacing={1}>
            {recentQueries.map((recentQuery, index) => (
              <ListItem key={index}>
                <Button
                  size="xs"
                  variant="ghost"
                  justifyContent="flex-start"
                  width="100%"
                  onClick={() => setQuery(recentQuery)}
                  colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                  textAlign="left"
                >
                  {recentQuery}
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default QueryInput;
