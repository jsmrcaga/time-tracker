const fs = require('node:fs');
const path = require('node:path');

const { expect } = require('chai');
const { IssueParser, Submission, DataValidationError } = require('../../../src/lib/parser');

describe('Issue Parser', () => {
	it('Should parse a complete issue', () => {
		const complete_md = fs.readFileSync(path.join(__dirname, './issues/complete.md'), 'utf8');

		const parsed = IssueParser.parse(complete_md);

		expect(parsed).to.be.instanceof(Submission);
		expect(parsed.projects).to.have.length(4);
		expect(parsed.type).to.eql('weekly');
		expect(parsed.date).to.eql('2024-08-05T00:00:00.000Z');
	});

	it('Should parse an issue with incomplete projects', () => {
		const incomplete_md = fs.readFileSync(path.join(__dirname, './issues/incomplete.md'), 'utf8');

		const parsed = IssueParser.parse(incomplete_md);

		expect(parsed).to.be.instanceof(Submission);
		expect(parsed.projects).to.have.length(2); //missing proj 3 and support
		expect(parsed.type).to.eql('weekly');
		expect(parsed.date).to.eql('2024-08-13T00:00:00.000Z');
	});

	it('Should throw an error if date does not make sense', () => {
		const broken_date_md = fs.readFileSync(path.join(__dirname, './issues/broken_date.md'), 'utf8');

		try {
			IssueParser.parse(broken_date_md);
		} catch(e) {
			expect(e).to.be.instanceof(DataValidationError);
			expect(e.errors).to.have.length(1);
			expect(e.errors[0]).to.eql('Invalid date: plelp');
		}
	});

	it('Should throw an error if dev.days are > 1 for daily', () => {
		const too_much_daily_md = fs.readFileSync(path.join(__dirname, './issues/too_much_daily.md'), 'utf8');

		try {
			IssueParser.parse(too_much_daily_md);
			throw new Error('Should fail');
		} catch(e) {
			expect(e).to.be.instanceof(DataValidationError);
			expect(e.errors).to.have.length(1);
			expect(e.errors[0]).to.eql('Daily load can have a maximum of 1 dev.days, you entered: 1.7');
		}
	});

	it('Should throw an error if dev.days are > 5 for weekly', () => {
		const too_much_weekly_md = fs.readFileSync(path.join(__dirname, './issues/too_much_weekly.md'), 'utf8');

		try {
			IssueParser.parse(too_much_weekly_md);
			throw new Error('Should fail');
		} catch(e) {
			expect(e).to.be.instanceof(DataValidationError);
			expect(e.errors).to.have.length(1);
			expect(e.errors[0]).to.eql('Weekly load can have a maximum of 5 dev.days, you entered: 6');
		}
	});
});
