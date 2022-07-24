const { sqlForPartialUpdate } = require('./sql.js');
describe('testing sqlForPartialUpdate function', () => {
	test('works', () => {
		let dataObjectToUpdate = { firstName: 'Aliya', age: 32 };
		let jsToSql = {
			firstName: 'first_name',
			lastName: 'last_name',
			isAdmin: 'is_admin'
		};
		const { setCols, values } = sqlForPartialUpdate(dataObjectToUpdate, jsToSql);
		expect(setCols).toBeTruthy();
		expect(values).toBeTruthy();
		expect(setCols).toBe('"first_name"=$1, "age"=$2');
		expect(values).toHaveLength(2);
	});
});
