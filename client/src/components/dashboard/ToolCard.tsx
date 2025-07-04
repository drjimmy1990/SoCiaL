import React from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../../types';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '1rem',
    width: '300px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const [hover, setHover] = React.useState(false);
  const hoverStyle: React.CSSProperties = {
    transform: 'translateY(-3px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  // --- UPDATED: Centralized routing logic ---
  const toolRoutes: { [key: string]: string } = {
    'Evolution API': '/tools/whatsapp-connections',
    'Campaign Manager': '/tools/campaigns',
    // Add other tools here as we create them
  };
  
  const toolPath = toolRoutes[tool.name] || `/tools/${tool.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Link 
      to={toolPath} 
      style={hover ? {...cardStyle, ...hoverStyle} : cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
        {tool.name}
      </h3>
      <p style={{ color: '#666' }}>{tool.description}</p>
    </Link>
  );
};

export default ToolCard;