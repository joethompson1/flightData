import {
	processFlights,
	getAdsbRequestData, 
	incrementNumberRequests, 
	resetNumberRequests,
	setResetOccuredFalse
} from './postgres.js';
import fs from 'fs';


export async function addJsonFileFlightDataToPostgres() {
	try {
		fs.readFile('flightData.json', 'utf8', (err, data) => {
	        if (err) {
	            console.error('Error reading file:', err);
	            return;
	        }

	        try {
	            // Parse the existing JSON content
	            const existingData = JSON.parse(data);
	            for (const requestData of existingData) {
		            processFlights(requestData);
	            }


	        } catch (parseError) {
	            console.error('Error parsing JSON:', parseError);
	        }
	    });
	} catch(err) {
		console.error(err);
	}
}