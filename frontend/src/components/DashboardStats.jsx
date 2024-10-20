import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';  // Import Chart and elements from 'chart.js'

// Register necessary components
Chart.register(ArcElement, Tooltip, Legend);

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const { users = 0, notebooks = 0, sharedNotebooks = 0 } = stats || {};

  const chartData = {
    labels: ['Users', 'Notebooks', 'Shared Notebooks'],
    datasets: [
      {
        data: [users, notebooks, sharedNotebooks],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <div style={{ width: '50%', margin: '0 auto' }}>
      <h2>Dashboard Statistics</h2>
      <Pie data={chartData} options={{ responsive: true }} />
    </div>
  );
};

export default DashboardStats;
