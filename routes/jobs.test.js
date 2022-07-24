'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');
const Company = require('../models/company');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken
} = require('./_testCommon');
// const setBearerAdmin = ('authorization', `Bearer ${adminToken}`);
// const setBearerUser = ('authorization', `Bearer ${u1Token}`);

const Job = require('../models/job');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const basicJob = {
	id: 1,
	title: 'basic',
	salary: 100000,
	equity: 0.0,
	companyHandle: 'c1'
};

describe('/POST new job', () => {
	const newJob = {
		title: 'new',
		salary: 10000,
		equity: 0.0,
		companyHandle: 'c1'
	};

	const badJob = {
		title: 'new',
		salary: 10000,
		equity: 0.0
	};

	test('works with correct schema', async () => {
		const response = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(201);
	});
	test('fails with incorrect schema', async () => {
		const response = await request(app).post('/jobs').send(badJob).set('authorization', `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(400);
	});
});

describe('/GET all jobs', () => {
	test('works: show all jobs', async () => {
		const response = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(response.statusCode).toBe(200);
		expect(response).toBeTruthy();
		expect(response.body).toEqual([
			{
				id: expect.any(Number),
				title: 'CTO',
				salary: 50000,
				equity: null,
				companyHandle: 'c3'
			}
		]);
	});
});

describe('/GET job with id', () => {
	test('works with correct id', async () => {
		await db.query(
			`INSERT INTO jobs (id, title, salary, equity, company_handle)
            VALUES (1, 'analyst', '55000', 0.00, 'c3')`
		);
		const res = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(res).toBeTruthy();
	});
});

describe('PATCH /jobs/:id', () => {
	test('works for admin', async () => {
		await db.query(
			`INSERT INTO jobs (id, title, salary, equity, company_handle)
            VALUES (1, 'analyst', '55000', 0.00, 'c3')`
		);
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: 'top daddy'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toBe(200);
	});

	test('fails for anon', async () => {
		await db.query(
			`INSERT INTO jobs (id, title, salary, equity, company_handle)
            VALUES (1, 'analyst', '55000', 0.00, 'c3')`
		);
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: 'top daddy'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toBe(401);
	});
});
