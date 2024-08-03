const fs = require('node:fs');
const path = require('node:path');
const { Writable } = require('node:stream');
const { expect } = require('chai');

const { on_issue } = require('../../../src/events/issue');

describe('Events - Issue Created', () => {
	it('Should throw if no event path found', () => {
		return on_issue().then(() => {
			throw new Error('Should not be here');
		}).catch(e => {
			expect(e.message).to.eql('No event path!');
		});
	});

	it('Should finish if everything is ok', () => {
		const body = path.join(__dirname, './bodies/ok.json');

		let out_content = '';

		const out = new Writable({
			write: (chunk, encoding, callback) => {
				try {
					out_content += chunk.toString();
					callback();
				} catch (e) {
					callback(e);
				}
			}
		});

		return on_issue(body, out).then(() => {
			expect(out_content).to.eql('');
		});
	});

	it('Should output body if errors found', () => {
		const body = path.join(__dirname, './bodies/nok.json');
		let out_content = '';

		const out = new Writable({
			write: (chunk, encoding, callback) => {
				try {
					out_content += chunk.toString();
					callback();
				} catch (e) {
					callback(e);
				}
			}
		});

		return on_issue(body, out).then(() => {
			throw new Error('Should not arrive here');
		}).catch(() => {
			expect(out_content).to.eql(`error_body<<EOF
> [!CAUTION]
> ### Errors

* Invalid date: plelp
EOF`
			);
		});
	});
});
