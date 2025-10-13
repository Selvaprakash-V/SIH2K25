import React from 'react';
import Dashboard from './Dashboard';

export default function StateDashboard(props) {
  // You can add state-specific logic here if needed
  return <Dashboard {...props} role="state" />;
}
