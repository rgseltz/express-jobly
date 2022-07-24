'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError, ExpressError, UnauthorizedError } = require('../expressError');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const newJobSchema = require('../schemas/jobNew.json');
const updateJobSchema = require('../schemas/jobUpdate.json');
const { query } = require('express');
const searchJobSchema = require('../schemas/jobSearch.json');

const router = new express.Router();

/** POST new job
* job should return {job} --> {id, title, companyHandle, salary, equity} 
*/
router.post('/', ensureAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, newJobSchema);
		if (!validator.valid) {
			let errList = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errList);
		}
		const newJob = await Job.create(req.body);
		return res.status(201).json({ newJob });
	} catch (err) {
		return next(err);
	}
});

/** GET all jobs {jobs} --> [{id, title, salary, equity, companyHandle}, ...[],..] 
 * FILTER JOBS by {title, minSalary, hasEquity}
 * Any user can search
*/
router.get('/', async (req, res, next) => {
	try {
		let queryParams = req.query;
		//convert query string params into an integer and boolean
		if (queryParams.minSalary) queryParams.minSalary = +queryParams.minSalary;
		queryParams.hasEquity = queryParams.hasEquity === 'true';

		//validate query conforms to request schema
		const validator = jsonschema.validate(queryParams, searchJobSchema);
		if (!validator.valid) {
			let errList = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errList);
		}

		const jobs = await Job.findAll(queryParams);
		console.log(jobs);
		res.status(200).json(jobs);
	} catch (err) {
		return next(err);
	}
});

/** GET /[id] -- get a job listing by job id
 * RETURNING {id, title, salary, equity, companyHandle}
 */

router.get('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const job = await Job.find(id);
		return res.status(200).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[id] --- edit a job listing by id
 * patches job data {title, salary, equity, companyHandle}
 * RETURNS {id, title, salary, equity, companyHandle}
 */
router.patch('/:id', ensureAdmin, async (req, res, next) => {
	try {
		let validator = jsonschema.validate(req.body, updateJobSchema);
		if (!validator.valid) {
			let errList = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errList);
		}

		const jobEdit = await Job.update(req.params.id, req.body);
		return res.json({ jobEdit });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /job/[id] */
router.delete('/:id', ensureAdmin, async (req, res, next) => {
	try {
		const { id } = req.params;
		const job = await Job.delete(id);
		return res.json({ msg: 'Job Deleted' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
