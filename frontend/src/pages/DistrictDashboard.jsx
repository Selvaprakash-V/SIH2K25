import React from 'react';
import Dashboard from './Dashboard';

export default function DistrictDashboard(props) {
  // You can add district-specific logic here if needed
  return <Dashboard {...props} role="district" />;
}
