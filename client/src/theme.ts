import { createTheme } from '@mui/material/styles';

// Define our custom theme
const theme = createTheme({
  palette: {
    // We'll use a modern, professional color palette.
    // Feel free to change these hex codes to match your brand.
    primary: {
      main: '#1976d2', // A nice shade of blue
    },
    secondary: {
      main: '#dc004e', // A contrasting pink/magenta
    },
    background: {
      default: '#f4f6f8', // A very light grey for the page background
      paper: '#ffffff',   // White for cards, tables, etc.
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
    }
  },
  components: {
    // Here we can override default styles for specific components
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Buttons will use normal case, not UPPERCASE
          borderRadius: '8px',   // Slightly more rounded buttons
        },
      },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: '12px', // More rounded cards
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)' // A soft, modern shadow
            }
        }
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined', // All text fields will be outlined by default
        }
    },
    MuiSelect: {
        defaultProps: {
            variant: 'outlined',
        }
    }
  },
});

export default theme;