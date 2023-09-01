import { aircraft1NM } from './adsbExchange.js';
import fs from 'fs';

let numberOfRequests = 0;
let intervalTime = 90000; // 1 min 30s
let interval;

// Initialize lastMonth to the current month at the start
let lastMonth = new Date().getMonth();

const fetchDataAndAppend = async () => {
    const currentTime = new Date();
    const startHour = 7;
    const endHour = 19;

    const latitude = '51.844991';
    const longitude = '-1.294335';

    if (currentTime.getMonth() !== lastMonth) {
        lastMonth = currentTime.getMonth();
        numberOfRequests = 0;
        console.log(`REQUEST COUNTER RESET FOR NEW MONTH: ${currentTime.getMonth() }`);
    }

    try {
        if ((numberOfRequests < 9990) && (currentTime.getHours() >= startHour && currentTime.getHours() < endHour)) {

            const flightsObject = await aircraft1NM(latitude, longitude);
            numberOfRequests++;
            console.log(`-------- Request: ${numberOfRequests} --------`);
            console.log(currentTime);

            if (flightsObject.total > 0) {
                console.log("Flight found: interval set to 20s");
                intervalTime = 20000; 
                // Read the existing content of the file
                fs.readFile('flightData.json', 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        return;
                    }

                    try {
                        // Parse the existing JSON content
                        const existingData = JSON.parse(data);

                        // Append the new flightsObject to the array
                        existingData.push(flightsObject);

                        // Convert the updated array back to JSON format
                        const updatedJson = JSON.stringify(existingData, null, 2);

                        // Write the updated JSON content back to the file
                        fs.writeFile('flightData.json', updatedJson, 'utf8', (err) => {
                            if (err) {
                                console.error('Error writing file:', err);
                            } else {
                                console.log('New flightsObject appended to the file.');
                            }
                        });
                    } catch (parseError) {
                        console.error('Error parsing JSON:', parseError);
                    }
                });
            } else {
                intervalTime = 90000;
                console.log('No data to append: interval set to 1min 30s.');
            }
        } else {
            console.log('Not running outside of 7 AM - 7 PM.');
        }
    } catch (error) {
        console.error('Error fetching aircraft data:', error);
    }
};

// Call the function every minute
interval = setInterval(fetchDataAndAppend, intervalTime); // 90000 milliseconds = 1 min 30s




// Function to copy contents of flightData.json to flightDataCopy.json
const copyDataToBackup = () => {
    try {
        const filename = 'flightData.json';
        const backupFilename = 'flightDataCopy.json';

        const data = fs.readFileSync(filename, 'utf8');
        fs.writeFileSync(backupFilename, data);

        console.log(`Copied data from ${filename} to ${backupFilename}`);
    } catch (error) {
        console.error('Error copying data:', error);
    }
};

// Schedule copyDataToBackup to run every day at 4 AM
const fourAMInterval = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 4) {
        copyDataToBackup();
    }
}, 3600000); // 3600000 milliseconds = 1 hour


// Stop interval and exit when Ctrl+C is pressed
process.on('SIGINT', () => {
    clearInterval(interval);
    clearInterval(fourAMInterval);
    console.log('Process terminated by user');
    process.exit();
});

// Check command-line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    await fetchDataAndAppend();

}

else if (args.length === 2) {
    const latitude = args[0];
    const longitude = args[1];
    aircraft1NM(latitude, longitude);
} else {
    console.log("Usage: \n npm start (runs with Paperhouse coordinates)\n npm start -- '<latitude>' '<longitude>'");
}