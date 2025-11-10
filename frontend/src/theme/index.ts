import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// Figma'dan alınan renk paleti
const colors = {
  brand: {
    yellow: {
      50: '#FFF9E6',
      100: '#FFEFB8',
      200: '#FFE58A',
      300: '#FFDB5C',
      400: '#FFD12E',
      500: '#F8C84A', // Primary yellow
      600: '#E0B23D',
      700: '#C89C30',
      800: '#B08623',
      900: '#987016',
    },
    green: {
      50: '#E8F2ED',
      100: '#C5DDCE',
      200: '#A1C8AF',
      300: '#7EB390',
      400: '#5A9E71',
      500: '#2D5C4E', // Primary green
      600: '#254C40',
      700: '#1D3C32',
      800: '#152C24',
      900: '#0D1C16',
    },
  },
  // Semantic colors
  primary: '#F8C84A',
  secondary: '#2D5C4E',
  background: {
    light: '#FFFFFF',
    dark: '#1A202C',
    cream: '#FFF9E6',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    light: '#718096',
  },
}

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
}

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'full',
    },
    variants: {
      primary: {
        bg: 'brand.yellow.500',
        color: 'text.primary',
        _hover: {
          bg: 'brand.yellow.600',
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        _active: {
          bg: 'brand.yellow.700',
          transform: 'translateY(0)',
        },
        transition: 'all 0.2s',
      },
      secondary: {
        bg: 'brand.green.500',
        color: 'white',
        _hover: {
          bg: 'brand.green.600',
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        _active: {
          bg: 'brand.green.700',
          transform: 'translateY(0)',
        },
        transition: 'all 0.2s',
      },
      outline: {
        borderColor: 'brand.yellow.500',
        color: 'brand.yellow.500',
        _hover: {
          bg: 'brand.yellow.50',
        },
      },
    },
    defaultProps: {
      variant: 'primary',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: '2xl',
        boxShadow: 'sm',
        _hover: {
          boxShadow: 'md',
          transform: 'translateY(-4px)',
        },
        transition: 'all 0.3s ease',
      },
    },
  },
  Input: {
    variants: {
      filled: {
        field: {
          borderRadius: 'xl',
          bg: 'gray.50',
          _hover: {
            bg: 'gray.100',
          },
          _focus: {
            bg: 'white',
            borderColor: 'brand.yellow.500',
          },
        },
      },
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      letterSpacing: 'tight',
    },
  },
}

const styles = {
  global: {
    body: {
      bg: 'background.light',
      color: 'text.primary',
    },
    '*::placeholder': {
      color: 'text.light',
    },
  },
}

// Spacing and sizing
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
}

const radii = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
}

const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
  space,
  radii,
  shadows: {
    outline: '0 0 0 3px rgba(248, 200, 74, 0.6)',
  },
})

export default theme

