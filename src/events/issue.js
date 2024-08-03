#!/usr/bin/env node

// Check issue for consistency
const fs = require('node:fs');
const { IssueParser } = require('../lib/parser');

function on_issue(event_path, output_stream) {
	if(!event_path) {
		return Promise.reject(new Error('No event path!'));
	}

	// Find issue body. 
	const { issue } = JSON.parse(fs.readFileSync(event_path, 'utf8'));
	const { body: issue_body } = issue;

	try {
		const submission = IssueParser.parse(issue_body);
		return Promise.resolve(submission);
	} catch(e) {
		// Set errors as output
		// And comment in issue
		if(!e.errors) {
			console.log({issue_body});
			throw e;
		}

		const body = `> [!CAUTION]
> ### Errors

${e.errors.map(e => `* ${e}`).join('\n')}`;

		return new Promise((_, reject) => {
			output_stream.write(`error_body<<EOF\n${body}\nEOF`, (err) => {
				reject(err || e);
			});
		});
	}
}

module.exports = { on_issue };

if(require.main === module) {
	const github_output = fs.createWriteStream(process.env.GITHUB_OUTPUT);

	return on_issue(
		process.env.EVENT_PATH,
		github_output
	);
}
