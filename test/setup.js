import kl from 'kleur';

/*
 * Custom serializer borrowed from the Preact repo as the default in wtr
 * is busted when it comes to cyclical references or objects beyond a
 * certain depth.

 * This also has the benefit of being much prettier and human readable,
 * includes indentation, coloring, and support for Map and Set objects.
 */
function patchConsole(method) {
	const original = window.console[method];
	window.console[method] = (...args) => {
		original.apply(window.console, serializeConsoleArgs(args));
	};
}

patchConsole('log');
patchConsole('warn');
patchConsole('error');
patchConsole('info');

/**
 * @param {any[]} args
 * @returns {[string]}
 */
function serializeConsoleArgs(args) {
	const flat = args.map(arg => serialize(arg, 'flat', 0, new Set()));
	// We don't have access to the users terminal width, so we'll try to
	// format everything into one line if possible and assume a terminal
	// width of 80 chars
	if (kl.reset(flat.join(', ')).length <= 80) {
		return [flat.join(', ')];
	}

	const serialized = args.map(arg => serialize(arg, 'default', 0, new Set()));
	return ['\n' + serialized.join(',\n') + '\n'];
}

/**
 * @param {number} n
 * @returns {string}
 */
function applyIndent(n) {
	if (n <= 0) return '';
	return '  '.repeat(n);
}

/**
 * @param {any} value
 * @param {"flat" | "default"} mode
 * @param {number} indent
 * @param {Set<any>} seen
 * @returns {string}
 */
function serialize(value, mode, indent, seen) {
	if (seen.has(value)) {
		return kl.cyan('[Circular]');
	}

	if (value === null) {
		return kl.bold('null');
	} else if (Array.isArray(value)) {
		seen.add(value);
		const values = value.map(v => serialize(v, mode, indent + 1, seen));
		if (mode === 'flat') {
			return `[ ${values.join(', ')} ]`;
		}

		const space = applyIndent(indent);
		const pretty = values.map(v => applyIndent(indent + 1) + v).join(',\n');
		return `[\n${pretty}\n${space}]`;
	} else if (value instanceof Set) {
		const values = [];
		value.forEach(v => {
			values.push(serialize(v, mode, indent, seen));
		});

		if (mode === 'flat') {
			return `Set(${value.size}) { ${values.join(', ')} }`;
		}

		const pretty = values.map(v => applyIndent(indent + 1) + v).join(',\n');
		return `Set(${value.size}) {\n${pretty}\n${applyIndent(indent)}}`;
	} else if (value instanceof Map) {
		const values = [];
		value.forEach((v, k) => {
			values.push([
				serialize(v, 'flat', indent, seen),
				serialize(k, 'flat', indent, seen)
			]);
		});

		if (mode === 'flat') {
			const pretty = values.map(v => `${v[0]} => ${v[1]}`).join(', ');
			return `Map(${value.size}) { ${pretty} }`;
		}

		const pretty = values
			.map(v => {
				return applyIndent(indent + 1) + `${v[0]} => ${v[1]}`;
			})
			.join(', ');
		return `Map(${value.size}) {\n${pretty}\n${applyIndent(indent)}}`;
	}

	switch (typeof value) {
		case 'undefined':
			return kl.dim('undefined');

		case 'bigint':
		case 'number':
		case 'boolean':
			return kl.yellow(String(value));
		case 'string': {
			// By default node's built in logging doesn't wrap top level
			// strings with quotes
			if (indent === 0) {
				return String(value);
			}
			const quote = /[^\\]"/.test(value) ? '"' : "'";
			return kl.green(String(quote + value + quote));
		}
		case 'symbol':
			return kl.green(value.toString());
		case 'function':
			return kl.cyan(`[Function: ${value.name || 'anonymous'}]`);
	}

	if (value instanceof Element) {
		return value.outerHTML;
	}
	if (value instanceof Error) {
		return value.stack;
	}

	seen.add(value);

	const props = Object.keys(value).map(key => {
		// Skip calling getters
		const desc = Object.getOwnPropertyDescriptor(value, key);
		if (typeof desc.get === 'function') {
			return `get ${key}()`;
		}

		const v = serialize(value[key], mode, indent + 1, seen);
		return `${key}: ${v}`;
	});

	if (props.length === 0) {
		return '{}';
	} else if (mode === 'flat') {
		const pretty = props.join(', ');
		return `{ ${pretty} }`;
	}

	const pretty = props.map(p => applyIndent(indent + 1) + p).join(',\n');
	return `{\n${pretty}\n${applyIndent(indent)}}`;
}
