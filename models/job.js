'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

class Job {
	/** CREATE a job (from data), update the database, return new job data.
     * data (from route) should be {title, salary, equity, companyHandle}
     * RETURNS { title, salary, equity, companyHandle }
     * Throws BadRequestError if job is already in the database
     */

	static async create({ title, salary, equity, companyHandle }) {
		//check if job already exists in db//
		const duplicateCheck = await db.query(
			`SELECT title, salary, equity, company_handle FROM jobs 
            WHERE title = $1 AND company_handle = $2`,
			[ title, companyHandle ]
		);
		if (duplicateCheck.rows[0]) {
			throw new BadRequestError('Job already exists!');
		}

		const results = await db.query(
			`INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4) RETURNING title, salary, equity, company_handle AS "companyHandle"`,
			[ title, salary, equity, companyHandle ]
		);
		return results.rows[0];
	}

	/**FIND ALL jobs. 
     * RETURNS [{ id, title, salary, equity, companyHandle }, ...]
     */

	static async findAll(filterParams = {}) {
		//seperate the blanket query all sql statement into a variable. If no filterParams are passed, use this for db query. if there are filter params, concatinate them to the query string before db query//
		let query = `
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs`;

		//prepare empty array for sanitized query values for second arg of db.query call and empty array for list of strings that will make up the filter WHERE clause of the sql query//
		let sqlWhereArr = [];
		let sanitizedVals = [];

		//destructure assign each value of the filterParams object to a variable (title, minSalary, hasEquity)
		const { title, minSalary, hasEquity } = filterParams;

		//check which filter params where passed to findALL() method, and pushing their values into the sanitzied value array and their respective sanitized $index_numbers into their own WHERE statement string//
		if (title !== undefined) {
			sanitizedVals.push(`%${title}%`);
			sqlWhereArr.push(`title ILIKE $${sanitizedVals.length}`);
		}
		if (minSalary !== undefined) {
			sanitizedVals.push(`${minSalary}`);
			sqlWhereArr.push(`salary >= $${sanitizedVals.length}`);
		}
		if (hasEquity === true) {
			sqlWhereArr.push(`equity > 0`);
		}

		//concatinating the SELECT db query to the WHERE statement and flattenting the string values of the sqlWhereStatmentArr into one string, joined by ' AND '//
		if (sanitizedVals.length !== 0) {
			query = query + ` WHERE ${sqlWhereArr.join(' AND ')} ORDER BY title`;
			console.log(query);
		}

		const results = await db.query(query, [ ...sanitizedVals ]);
		console.log(results.rows);
		return results.rows;
	}

	/** FIND job by id 
     *  RETURN {id, companyHandle, title, salary, equity, company}
     *  company data includes { handle, name, description, num_employees, logo_url }
     */
	static async find(id) {
		let results = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs WHERE id = $1`,
			[ id ]
		);

		console.log(results.rows[0]);
		//CODE BELOW DOESNT WORK!!!!!!!!//
		// if (results.rows === undefined || !results) throw new NotFoundError();
		if (results.rows.length === 0) throw new NotFoundError();

		let job = results.rows[0];
		let company = await db.query(
			`SELECT handle, name, num_employees, description, logo_url 
            FROM companies WHERE handle = $1`,
			[ job.companyHandle ]
		);
		job.company = company.rows[0];
		console.log(job);
		return job;
	}

	/**UPDATE job 
     * incoming job data from req.body {id, title, salary, companyHandle}
     * use sqlForPartial data to convert companyHandle to company_handle for query and line up correct 
     * query SET clause of the UPDATE query and spread the values into the sanitized params at end
     * db.query call
     */
	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, { companyHandle: 'company_handle' });
		let query = `UPDATE jobs SET ${setCols} WHERE id = $${values.length + 1} 
        RETURNING id, title, salary, equity, company_handle`;
		const results = await db.query(query, [ ...values, id ]);
		if (!results) throw new NotFoundError();
		return results.rows[0];
	}

	static async delete(id) {
		const results = await db.query(
			`DELETE FROM jobs 
             WHERE id = $1 
             RETURNING id`,
			[ id ]
		);
		if (results.rows === 0) {
			throw new NotFoundError();
		}
	}
}

module.exports = Job;
