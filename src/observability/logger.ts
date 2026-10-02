import pino, { type LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";

const options: LoggerOptions = {
	level: process.env.LOG_LEVEL || "info",

	base: {
		service: "observability-api",
		env: process.env.NODE_ENV || "development",
	},

	timestamp: pino.stdTimeFunctions.isoTime,

	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"res.headers['set-cookie']",
			"req.headers['x-api-key']",
		],
		censor: "[REDACTED]",
	},

	formatters: {
		level: (label) => ({
			level: label,
		}),
	},
};

if (!isProduction) {
	options.transport = {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "SYS:standard",
			ignore: "pid,hostname",
		},
	};
}

export const logger = pino(options);
