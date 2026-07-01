import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

const preactJsx = {
	jsx: {
		runtime: "classic",
		pragma: "h",
		pragmaFrag: "Fragment",
		development: false,
	},
} as const;

export default defineConfig({
	test: {
		projects: [
			{
				oxc: preactJsx,
				test: {
					name: "node",
					environment: "node",
					include: ["test/node/**/*.test.{js,jsx}"],
				},
			},
			{
				oxc: preactJsx,
				optimizeDeps: {
					include: ["ansis", "preact", "preact/hooks"],
					noDiscovery: true,
				},
				test: {
					name: "browser",
					include: ["test/*.test.jsx"],
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
