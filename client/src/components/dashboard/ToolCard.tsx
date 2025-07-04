import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Tool } from '../../types';
import { Card, CardActionArea, CardContent, Typography, Divider } from '@mui/material';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const toolRoutes: { [key: string]: string } = {
    'Evolution API': '/tools/whatsapp-connections',
    'Campaign Manager': '/tools/campaigns',
  };
  
  const toolPath = toolRoutes[tool.name] || `/tools/${tool.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    // The sx prop allows for powerful inline styling and theme access
    <Card 
      sx={{ 
        width: 320, 
        m: 2, 
        height: '100%', // <-- Ensures the card fills the grid cell height
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // <-- Smooth transition
        '&:hover': {
          transform: 'translateY(-5px)', // <-- "Lift" effect on hover
          boxShadow: 6, // <-- MUI shorthand for a more pronounced shadow
        }
      }}
    >
      <CardActionArea component={RouterLink} to={toolPath} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            {tool.name}
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            {tool.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ToolCard;