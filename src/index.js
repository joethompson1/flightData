import {
	processFlights,
	getAdsbRequestData, 
	incrementNumberRequests, 
	resetNumberRequests,
	setResetOccuredFalse
} from './postgres.js';
import { aircraft1NM } from './adsbExchange.js';
import { addJsonFileFlightDataToPostgres } from './flightDataJsonToPostgres.js';
import fs from 'fs';


let intervalTime = 135000; // 2 min 15s
let interval;


const makeApiRequest = async () => {
	// Gets number of requests made for the month
	// and the day it needs to be reset
	const adsbRequestData = await getAdsbRequestData();
	let numberOfRequests = adsbRequestData[0];
	let resetDay = adsbRequestData[1];
	let resetOccured = adsbRequestData[2];

	const currentTime = new Date();
    const startHour = 7;
    const endHour = 19;

    const latitude = '51.844991';
    const longitude = '-1.294335';

    if (currentTime.getDate() === resetDay && !resetOccured) {
    	numberOfRequests = await resetNumberRequests();
    }

    if (currentTime.getDate() === resetDay + 1) {
    	await setResetOccuredFalse();
    }

    try {
    	if (numberOfRequests > 9990) {
    		console.log("Exceeded monthly request limit");
    		return;
    	} 

    	if (currentTime.getHours() <= startHour || currentTime.getHours() > endHour) {
    		console.log(`Not running outside of ${startHour} - ${endHour}.`);
    		return;
    	}

    	const flightsObject = await aircraft1NM(latitude, longitude);
    	numberOfRequests = await incrementNumberRequests(); // numberOfRequests++
    	console.log(`-------- Request: ${numberOfRequests} --------`);
    	console.log(currentTime);

    	if (flightsObject.total <= 0) {
    		intervalTime = 135000;
    		console.log('No data to append: interval set to 2min 15s.');
    		return;
    	}

    	console.log("Flight found: interval set to 20s");
        intervalTime = 20000; 

        // Add flights object to db
        await processFlights(flightsObject);


    } catch(err) {
    	console.error('Error fetching aircraft data: ', err);
    }
} 

// Stop interval and exit when Ctrl+C is pressed
process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('Process terminated by user');
    process.exit();
});


interval = setInterval(makeApiRequest, intervalTime); // 135000 = 2 min 15s
makeApiRequest();

