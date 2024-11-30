import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register required components with Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineGraph = ({ results = [] }) => {
  // Format the results for the chart
  const data = results.map((item) => {
    const parts = item.split(': ');
    return {
      name: parts[0], // e.g., '1 Days Ago'
      count: parseInt(parts[1], 10),
    };
  });

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: 'Pins',
        data: data.map((item) => item.count),
        borderColor: '#ed6d28',
        backgroundColor: '#d73d15',
        fill: true,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Last 7 Days', // Add the title here
        font: {
          size: 16,
        },
      },
      legend: {
        display: false, // Hide the legend
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Pins',
        },
      },
    },
  };

  return (
    <div style={{ width: '370px'}}>
        <Line data={chartData} options={options} />
    </div>
  )
};

export default LineGraph;
