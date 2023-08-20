import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.RAPIDAPI_KEY;

const baseUrl = 'https://adsbexchange-com1.p.rapidapi.com/v2';
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
  }
};


export async function aircraft1NM(latitude, longitude) {
	latitude = latitude.trim();
    longitude = longitude.trim();

	const endpoint = `/lat/${latitude}/lon/${longitude}/dist/1/`;
    try {
		    const response = await fetch(baseUrl+endpoint, options);
		    const result = await response.text();

		    const flightsObject = JSON.parse(result);
		    return flightsObject;
		} catch (error) {
		    console.error(error);
		}
}
