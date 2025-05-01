import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e6f1ff',
    100: '#c4daff',
    200: '#9ec2ff',
    300: '#78a9ff',
    400: '#5291ff',
    500: '#2b78ff',
    600: '#1f60cc',
    700: '#154899',
    800: '#0b3066',
    900: '#041833',
  },
  entityColors: {
    person: '#4299E1',
    organization: '#F6AD55',
    event: '#9F7AEA',
    location: '#68D391',
  },
  relationshipColors: {
    family: '#FC8181',
    professional: '#4FD1C5',
    social: '#B794F4',
    political: '#F6E05E',
    conflict: '#F56565',
  },
};

const fonts = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
    },
    variants: {
      solid: (props: { colorScheme: string }) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.600`,
        },
      }),
      outline: (props: { colorScheme: string }) => ({
        border: '1px solid',
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
      }),
    },
  },
  Tooltip: {
    baseStyle: {
      bg: 'gray.700',
      color: 'white',
      fontSize: 'sm',
      borderRadius: 'md',
      px: '2',
      py: '1',
    },
  },
  Drawer: {
    baseStyle: {
      dialog: {
        borderRadius: 'md',
        boxShadow: 'xl',
      }
    }
  },
  Menu: {
    baseStyle: {
      list: {
        borderRadius: 'md',
        boxShadow: 'lg',
        p: '1',
      },
      item: {
        borderRadius: 'md',
        _hover: {
          bg: 'gray.100',
        },
        _dark: {
          _hover: {
            bg: 'gray.700',
          },
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'md',
      px: '2',
      py: '1',
    },
  },
};

const styles = {
  global: (props: { colorMode: string }) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
    },
    '::-webkit-scrollbar-thumb': {
      bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
    },
  }),
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
});

export default theme;
