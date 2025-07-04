import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// --- MUI IMPORTS ---
import { Box, Container, Typography, Tabs, Tab, Link, Paper } from '@mui/material';

// --- Component Imports ---
import UserManagement from '../components/admin/UserManagement';
import InstanceSettings from '../components/admin/InstanceSettings'; // <-- THIS IS THE NEW IMPORT


// A helper component to associate a tab panel with a tab
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboardPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard">{'< Back to Main Dashboard'}</Link>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 1 }}>
          Admin Dashboard
        </Typography>
      </Box>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleChange} aria-label="admin dashboard tabs">
            <Tab label="User Management" id="admin-tab-0" />
            <Tab label="Instance Settings" id="admin-tab-1" />
          </Tabs>
        </Box>
        <TabPanel value={currentTab} index={0}>
          <UserManagement />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          {/* --- THIS IS THE FIX: Replaced placeholder with the actual component --- */}
          <InstanceSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboardPage;