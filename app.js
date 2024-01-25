const fs = require('fs');
const path = require('path');
const express = require('express');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ben=33;
const app = express();
const port = 3434;
const homeDirectory = process.env.HOME;

const chartCallback = (ChartJS) => {
};

// Function to read file and extract values
function readAndChartFile(title, fileName, borderColor, backgroundColor, pointBackgroundColor) {
  try {
    //console.log(homeDirectory);
    const filePath = path.join(homeDirectory, fileName);
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the content of the file into an array of lines
    const lines = data.split('\n');


    // Parse the dataset into an array of objects with time and bytes properties
    const dataset = lines.map(line => {
      const [timestamp, bytes] = line.split('\t').map(Number); // Assuming tab-separated values
      return { timestamp, bytes };
    })
      .filter(entry => entry.timestamp >= 0); // Filter out entries with negative timestamps

    // Bucket values into seconds and sum up bytes
    const secondsData = {};
    dataset.forEach(point => {
      const key = Math.floor(point.timestamp);
      if (!secondsData[key]) {
        secondsData[key] = { timeInSeconds: key, totalBytes: 0 };
      }
      secondsData[key].totalBytes += point.bytes;
    });



    // Convert secondsData into an array for charting
    const chartData = Object.values(secondsData);


    // Charting
    const width = 1000;
    const height = 350;

    const canvasRenderService = new ChartJSNodeCanvas({ width, height, chartCallback });

    // Configure the chart
    const configuration = {
      type: 'line',
      data: {
        //labels: bpsData.map(point => point.timeInSeconds),
        labels: chartData.map(point => point.timeInSeconds),
        datasets: [{
          label: false,
          data: chartData.map(point => Math.floor((8 * point.totalBytes) / 1000)), // Convert bytes to kbps
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          pointBackgroundColor: pointBackgroundColor,
          borderWidth: 1,
          pointRadius: 1,
          fill: true,
        }],
      },
      options: {
        legend: {
          display: false
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: title
          },
        },
        scales: {
          x: {
            min: 0,
            max: 1600,
            type: 'linear', // Use linear scale for time in seconds
            position: 'bottom',
            title: {
              display: true,
              text: 'Time (seconds)',
            },
          },
          y: {
            min: 0,
            max: 1800,
            title: {
              display: true,
              text: 'kbps',
            },
          },
        },
      },
    };


    const imageBuffer = canvasRenderService.renderToBuffer(configuration);

    return imageBuffer;

  } catch (err) {
    console.error('Error reading file:', err);
    throw err;
  }
}

// Serve the chart image
app.get('/chart_in.png', async (req, res) => {
  try {
    const chartBuffer = await readAndChartFile("Downlink Bandwidth Usage", "tshark_in.txt", 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(chartBuffer);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

app.get('/chart_out.png', async (req, res) => {
  try {
    const chartBuffer = await readAndChartFile("Uplink Bandwidth Usage", 'tshark_out.txt', 'rgba(255, 105, 180, 1)', 'rgba(255, 182, 193, 0.2)', 'rgba(255, 105, 180, 1)');
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(chartBuffer);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Serve HTML file with an auto-refreshing script
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});