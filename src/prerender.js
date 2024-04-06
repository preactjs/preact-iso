import { h, options, cloneElement } from 'preact';
import { renderToStringAsync } from 'preact-render-to-string';

let vnodeHook;

const old = options.vnode;
options.vnode = vnode => {
	if (old) old(vnode);
	if (vnodeHook) vnodeHook(vnode);
};

/**
 * @param {ReturnType<h>} vnode The root JSX element to render (eg: `<App />`)
 * @param {object} [options]
 * @param {object} [options.props] Additional props to merge into the root JSX element
 */
export default async function prerender(vnode, options) {
	options = options || {};

	const props = options.props;

	if (typeof vnode === 'function') {
		vnode = h(vnode, props);
	} else if (props) {
		vnode = cloneElement(vnode, props);
	}

	let links = new Set();
	vnodeHook = ({ type, props }) => {
		if (type === 'a' && props && props.href && (!props.target || props.target === '_self')) {
			links.add(props.href);
		}
	};

	try {
		let html = await renderToStringAsync(vnode);
		html += `<script type="isodata"></script>`;
		return { html, links };
	} finally {
		vnodeHook = null;
	}
}
