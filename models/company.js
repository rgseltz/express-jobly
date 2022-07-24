'use strict';

const { query } = require('express');
const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[ handle ]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[ handle, name, description, numEmployees, logoUrl ]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

	static async findAll(filterParams = {}) {
		//seperate the blanket query all sql statement into a variable. If no filterParams are passed, use this for db query. if there are filter params, concatinate them to the query string before db query//
		let query = `SELECT handle,
    name,
    description,
    num_employees AS "numEmployees",
    logo_url AS "logoUrl"
FROM companies`;
		//prepare empty array for sanitized query values for second arg of db.query call and empty array for list of strings that will make up the filter WHERE clause of the sql query//
		let sanitizedVals = [];
		let sqlWhereStatmentArr = [];

		//destructure assign each value of the filterParams object to a variable (min/max employees and name)
		let { minEmployees, maxEmployees, name } = filterParams;

		//validate min and max employee amounts
		if (minEmployees > maxEmployees) {
			throw BadRequestError('Min employees cannot be greater than max employees');
		}

		//check which filter params where passed to findALL() method, and pushing their values into the sanitzied value array and their respective sanitized $index numbers into their own WHERE statement string//
		if (minEmployees !== undefined) {
			sanitizedVals.push(`${minEmployees}`);
			sqlWhereStatmentArr.push(`num_employees >= $${sanitizedVals.length}`);
		}
		if (maxEmployees !== undefined) {
			sanitizedVals.push(`${maxEmployees}`);
			sqlWhereStatmentArr.push(`num_employees <= $${sanitizedVals.length}`);
		}
		if (name !== undefined) {
			sanitizedVals.push(`%${name}%`);
			sqlWhereStatmentArr.push(`name ILIKE $${sanitizedVals.length}`);
		}
		//concatinating the global SELECT query with the WHERE statement and flattenting the string values of the sqlWhereStatmentArr into one string, joined by ' AND '//
		if (sanitizedVals.length !== 0) {
			query = query + ` WHERE ${sqlWhereStatmentArr.join(' AND ')}ORDER BY name`;
		}
		console.log(query);
		const companiesRes = await db.query(query, sanitizedVals);
		return companiesRes.rows;
	}

	/** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

	static async get(handle) {
		const companyRes = await db.query(
			`SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
			[ handle ]
		);

		const company = companyRes.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		const jobs = await db.query(
			`SELECT id, title, salary, equity
      FROM jobs WHERE company_handle = $1`,
			[ company.handle ]
		);

		company.jobs = jobs.rows;

		return company;
	}

	/** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: 'num_employees',
			logoUrl: 'logo_url'
		});
		const handleVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
		console.log(querySql);
		const result = await db.query(querySql, [ ...values, handle ]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[ handle ]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}
}

module.exports = Company;
