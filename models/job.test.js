'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const { findAll } = require('./job');
const Job = require('./job');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe('create', () => {
	const newJob = {
		title: 'manager',
		salary: 60000,
		equity: null,
		companyHandle: 'c3'
	};

	test('works', async () => {
		let job = await Job.create(newJob);
		expect(job).toEqual(newJob);
	});

	test('duplicate jobs will fail', async () => {
		try {
			await Job.create(newJob);
			await Job.create(newJob);
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe('find all jobs', () => {
	test('works: no filter', async () => {
		const newJob = {
			title: 'manager',
			salary: 60000,
			equity: null,
			companyHandle: 'c3'
		};
		await Job.create(newJob);
		let jobs = await Job.findAll();
		expect(jobs).toHaveLength(4);
	});
});

describe('find job by id', () => {
	test('works', async () => {
		let job = await Job.find(1);
		expect(job).toBeTruthy;
		expect(job).toEqual({
			id: 1,
			title: 'software architect',
			salary: 92000,
			equity: '0.003',
			companyHandle: 'c1',
			company: {
				handle: 'c1',
				name: 'C1',
				num_employees: 1,
				description: 'Desc1',
				logo_url: 'http://c1.img'
			}
		});
	});

	test('fail with incorrect id', async () => {
		try {
			let job = await Job.find(975000);
			expect(job).toBeFalsy();
			console.log(job);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe('update job info', () => {
	test('works: update job title', async () => {
		let updateTitle = {
			title: 'software engineer',
			salary: 92000,
			equity: '0.003',
			companyHandle: 'c1'
		};
		let job = await Job.update(1, updateTitle);
		expect(job).toBeTruthy();
	});

	test('fails if job id does not exist', async () => {
		let updateTitle = {
			title: 'software engineer',
			salary: 92000,
			equity: '0.003',
			companyHandle: 'c1'
		};
		try {
			let job = await Job.update(100, updateTitle);
			expect(job).toBeFalsy();
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy;
		}
	});
});
describe('delete job', () => {
	test('delete works', async () => {
		const result = await Job.delete(1);
		expect(result).toBeFalsy();
	});
});
