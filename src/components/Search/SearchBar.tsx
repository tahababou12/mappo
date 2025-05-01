import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  List,
  ListItem,
  Text,
  Flex,
  Badge,
  useColorMode,
  IconButton,
  Kbd,
  Tooltip,
} from '@chakra-ui/react';
import { Search, X } from 'lucide-react';
import { Entity, EntityType } from '../../types';

interface SearchBarProps {
  entities: Entity[];
  onSearch: (results: string[]) => void;
  onSelectEntity: (entityId: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ entities, onSearch, onSelectEntity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const { colorMode } = useColorMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      onSearch([]);
      setSelectedResultIndex(-1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = entities.filter(entity => 
      entity.name.toLowerCase().includes(term)
    ).sort((a, b) => {
      // Sort by relevance - exact matches first, then by name length (shorter names first)
      const aExact = a.name.toLowerCase() === term;
      const bExact = b.name.toLowerCase() === term;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStartsWith = a.name.toLowerCase().startsWith(term);
      const bStartsWith = b.name.toLowerCase().startsWith(term);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.length - b.name.length;
    });
    
    setSearchResults(results);
    onSearch(results.map(r => r.id));
    setIsDropdownOpen(results.length > 0);
    setSelectedResultIndex(-1);
  }, [searchTerm, entities, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDropdownOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedResultIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedResultIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
            e.preventDefault();
            handleSelectEntity(searchResults[selectedResultIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsDropdownOpen(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, selectedResultIndex, searchResults]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    onSearch([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectEntity = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      // Add to recent searches if not already there
      if (!recentSearches.includes(entity.name)) {
        setRecentSearches(prev => [entity.name, ...prev].slice(0, 5));
      }
      
      setSearchTerm(entity.name);
      onSelectEntity(entityId);
      setIsDropdownOpen(false);
    }
  };

  const handleRecentSearch = (term: string) => {
    setSearchTerm(term);
    inputRef.current?.focus();
  };

  // Get badge color based on entity type
  const getBadgeColor = (type: EntityType) => {
    switch (type) {
      case 'person': return 'blue';
      case 'organization': return 'orange';
      case 'event': return 'purple';
      case 'location': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box position="relative" width="100%">
      <Tooltip label="Press '/' to focus search" openDelay={1000}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Search size={18} color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} />
          </InputLeftElement>
          
          <Input
            ref={inputRef}
            placeholder="Search entities..."
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
            bg={colorMode === 'dark' ? 'gray.700' : 'white'}
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            _hover={{ borderColor: colorMode === 'dark' ? 'gray.500' : 'gray.300' }}
            _focus={{ 
              borderColor: colorMode === 'dark' ? 'blue.300' : 'blue.500',
              boxShadow: colorMode === 'dark' ? '0 0 0 1px #63B3ED' : '0 0 0 1px #3182CE'
            }}
          />
          
          {searchTerm ? (
            <InputRightElement>
              <IconButton
                aria-label="Clear search"
                icon={<X size={16} />}
                size="sm"
                variant="ghost"
                onClick={clearSearch}
              />
            </InputRightElement>
          ) : (
            <InputRightElement>
              <Kbd color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>/</Kbd>
            </InputRightElement>
          )}
        </InputGroup>
      </Tooltip>

      {/* Search results dropdown */}
      {isDropdownOpen && (
        <Box
          ref={dropdownRef}
          position="absolute"
          top="100%"
          left="0"
          right="0"
          mt="1"
          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
          borderRadius="md"
          boxShadow="lg"
          zIndex="dropdown"
          maxH="300px"
          overflowY="auto"
        >
          <List spacing={0}>
            {searchResults.map((entity, index) => (
              <ListItem 
                key={entity.id}
                p="2"
                cursor="pointer"
                bg={index === selectedResultIndex ? 
                  (colorMode === 'dark' ? 'blue.700' : 'blue.50') : 
                  'transparent'
                }
                _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.100' }}
                onClick={() => handleSelectEntity(entity.id)}
              >
                <Flex justify="space-between" align="center">
                  <Text fontWeight={index === selectedResultIndex ? 'medium' : 'normal'}>
                    {entity.name}
                  </Text>
                  <Badge colorScheme={getBadgeColor(entity.type)} textTransform="capitalize">
                    {entity.type}
                  </Badge>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && !searchTerm && (
        <Flex mt="2" flexWrap="wrap" gap="2">
          {recentSearches.map((term, index) => (
            <Badge 
              key={index}
              colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
              cursor="pointer"
              onClick={() => handleRecentSearch(term)}
              px="2"
              py="1"
              borderRadius="full"
            >
              {term}
            </Badge>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default SearchBar;
