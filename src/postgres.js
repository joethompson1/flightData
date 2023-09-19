import pkg from 'pg';
const { Pool, Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// const pool = new Pool({
// 	user: process.env.USER,
// 	host: process.env.HOST,
// 	database: process.env.DATABASE,
// 	password: process.env.PASSWORD,
// 	port: process.env.PORT
// });

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
	    rejectUnauthorized: false,
	},
});


async function addFlightToDB(flight, time) {
	const client = await pool.connect();
	try {
		const sanitizedFlight = {
	      	...flight,
	      	mlat: flight.mlat.length > 0 ? null : null,
	      	tisb: flight.tisb.length > 0 ? null : null,
	      	nav_modes: null,
	      	time_of_request: new Date(time).toISOString()
	    };

	    const columns = Object.keys(sanitizedFlight).join(', ');
	    const values = Object.values(sanitizedFlight).map((value) =>
	      	typeof value === 'number' ? value : `'${value}'`
	    ).join(', ');

	    const query = `INSERT INTO flights (${columns}) VALUES (${values})`;

	    await client.query(query);
	    console.log('Flight data added to the database.');

	} catch (err) {
		console.error(err);
	} finally {
		client.release();
	}
}


export async function processFlights(flightsObject) {
	const flightArray = flightsObject.ac;
	const time = flightsObject.now;

	for (const flight of flightArray) {
		await addFlightToDB(flight, time);
	}
}


export async function getAdsbRequestData() {
	const client = await pool.connect();
	try {
		const query = 'SELECT * FROM adbs_exchange_request_tracker LIMIT 1';
		const result = await client.query(query);

		const requestCount = result.rows[0].request_count;
		const resetDate = result.rows[0].reset_date;
		const resetOccured = result.rows[0].reset_occured;

		return [ requestCount, resetDate, resetOccured ];

	} catch(err) {
		console.error(err);
	} finally {
		client.release();
	}
}


export async function incrementNumberRequests() {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		// Increment the request_count by one in the first row
	    const incrementQuery = 'UPDATE adbs_exchange_request_tracker SET request_count = request_count + 1 RETURNING request_count';
	    const result = await client.query(incrementQuery);

	    // Commit the transaction to save the changes
	    await client.query('COMMIT');

	    // Return the updated request_count value
	    return result.rows[0].request_count;

	} catch(err) {
		await client.query('ROLLBACK');
		console.error(err);
	} finally {
		client.release();
	}
}


export async function resetNumberRequests() {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		// Increment the request_count by one in the first row
	    const incrementQuery = 'UPDATE adbs_exchange_request_tracker SET request_count = 0, reset_occured = true RETURNING request_count';
	    const result = await client.query(incrementQuery);

	    // Commit the transaction to save the changes
	    await client.query('COMMIT');

	    // Return the updated request_count value
	    return result.rows[0].request_count;

	} catch(err) {
		await client.query('ROLLBACK');
		console.error(err);
	} finally {
		client.release();
	}
}


export async function setResetOccuredFalse() {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

	    // Update reset_occured to false for all rows in the flights table
	    const updateQuery = 'UPDATE adbs_exchange_request_tracker SET reset_occured = false';
	    await client.query(updateQuery);

	    // Commit the transaction to save the changes
	    await client.query('COMMIT');
	    console.log('reset_occured set to false');

	} catch(err) {
		await client.query('ROLLBACK');
		console.error(err);
	} finally {
		client.release();
	}
}

