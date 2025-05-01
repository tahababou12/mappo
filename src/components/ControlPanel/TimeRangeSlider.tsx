import React from 'react';
import {
  Box,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  Flex,
  useColorMode
} from '@chakra-ui/react';

interface TimeRangeSliderProps {
  range: [number, number];
  min: number;
  max: number;
  onChange: (range: [number, number]) => void;
}

const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({ range, min, max, onChange }) => {
  const { colorMode } = useColorMode();
  
  // Handle changes during sliding - updates in real-time without loading icon
  const handleChange = (values: number[]) => {
    // Real-time update without showing loading indicator
    onChange([values[0], values[1]] as [number, number]);
  };

  return (
    <Box mb={4}>
      {/* <Heading size="sm" mb={2}>Time Period</Heading> */}
      <Box px={2}>
        <RangeSlider
          aria-label={['min', 'max']}
          value={range}
          min={min}
          max={max}
          step={1}
          onChange={handleChange}
          colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
        >
          <RangeSliderTrack>
            <RangeSliderFilledTrack />
          </RangeSliderTrack>
          <RangeSliderThumb index={0} boxSize={6}>
            <Box color={colorMode === 'dark' ? 'white' : 'black'} fontSize="xs">{range[0]}</Box>
          </RangeSliderThumb>
          <RangeSliderThumb index={1} boxSize={6}>
            <Box color={colorMode === 'dark' ? 'white' : 'black'} fontSize="xs">{range[1]}</Box>
          </RangeSliderThumb>
        </RangeSlider>
        <Flex justify="space-between" mt={1}>
          <Text fontSize="sm">{min}</Text>
          <Text fontSize="sm">{max}</Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default TimeRangeSlider;
