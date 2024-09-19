import { esbuildPlugin } from "@web/dev-server-esbuild";

export default {
	nodeResolve: true,
	testsFinishTimeout: 30000,
	plugins: [
		esbuildPlugin({
			jsx: true,
			loaders: {  '.js': 'jsx' },
			jsxFactory: 'h',
			jsxFragment: 'Fragment',
		}),
	],
};
