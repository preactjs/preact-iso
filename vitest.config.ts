import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "node",
					environment: "node",
					include: ["test/node/**/*.test.js"],
				},
			},
			{
				oxc: {
					jsx: {
						runtime: "classic",
						pragma: "h",
						pragmaFrag: "Fragment",
						development: false,
					},
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
