const Ajv = require('ajv');

const ajv = new Ajv();

class DataValidationError extends Error {
	constructor(message, { errors, ...rest }) {
		super(message, rest);
		this.errors = errors;
	}
}

// This only parses issues with the standard format
class Submission {
	static SCHEMA = {
		date: {
			type: 'string',
		},
		type: {
			type: 'string',
			enum: ['weekly', 'daily'] 
		},
		product: { type: ['string', 'null']},
		projects: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					load: { type: 'number' }
				},
				required: ['id', 'load'],
				additionalProperties: false
			}
		},
	};

	static VALIDATOR = ajv.compile({
		type: 'object',
		properties: this.SCHEMA,
		required: [],
		additionalProperties: false
	});

	constructor({ date, type, product, projects=[] }) {
		this.date = date;
		this.type = type;
		this.product = product;
		this.projects = projects;
	}

	static build(data = {}) {
		if(!this.VALIDATOR(data)) {
			throw new DataValidationError('Invalid submission', {
				errors: this.VALIDATOR.errors.slice()
			});
		}

		return new this(data);
	}
}

class IssueParser {
	static answered(v) {
		return !['_No response_', 'None'].includes(v);
	}

	static parse(markdown='') {
		const parts = markdown.split('###').filter(e => e);
		const answers = parts.map(part => part.split('\n\n').filter(e => e).map(e => e.trim()));

		let [
			[, date_input],
			[, type_input],
			[, product],
			[, support_load],

			[, proj_1_proj],
			[, proj_1_load],

			[, proj_2_proj],
			[, proj_2_load],

			[, proj_3_proj],
			[, proj_3_load],
		] = answers;

		const errors = [];

		if(!this.answered(date_input)) {
			errors.push(`Date is mandatory`);
		}

		if(!this.answered(type_input)) {
			errors.push(`Type is mandatory`);
		}

		const type = type_input.toLowerCase();

		const [d, m, y] = date_input.split(/\/|-/g);
		// +1/2 in Europe/Paris
		const date = new Date(`${y}-${m}-${d}T00:00:00.000Z`);

		const projects = [{
			id: 'support',
			load: this.answered(support_load) ? parseFloat(support_load, 10) : null
		}, {
			id: proj_1_proj,
			load: parseFloat(proj_1_load, 10)
		}, {
			id: proj_2_proj,
			load: parseFloat(proj_2_load, 10)
		}, {
			id: proj_3_proj,
			load: parseFloat(proj_3_load, 10)
		}].filter(({ id, load }) => {
			return this.answered(id) && this.answered(load) && load;
		});

		const total_load = projects.reduce((s, p) => s + p.load, 0);

		if(Number.isNaN(date.getTime())) {
			errors.push(`Invalid date: ${date_input}`);
		}

		if(!this.answered(support_load) && !projects.length) {
			errors.push(`Invalid projects submission: submit at least 1 project or support`);
		}

		if(type === 'weekly' && total_load > 5) {
			errors.push(`Weekly load can have a maximum of 5 dev.days, you entered: ${total_load}`);
		}

		if(type === 'daily' && total_load > 1) {
			errors.push(`Daily load can have a maximum of 1 dev.days, you entered: ${total_load}`);
		}

		if(errors.length) {
			throw new DataValidationError('Invalid submission', {
				errors
			});
		}
		
		return Submission.build({
			date: new Date(date).toISOString(),
			type,
			product: this.answered(product) ? product : null,
			projects
		});
	}
}

module.exports = {
	IssueParser,
	Submission,
	DataValidationError
};
