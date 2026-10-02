import { randomUUID } from "node:crypto";
import express from "express";
import { pinoHttp } from "pino-http";

import { logger } from "./observability/logger.js";

export const app = express();
app.use(express.json());

app.disable("x-powered-by");

app.use(
	pinoHttp({
		logger,

		genReqId: (req, res) => {
			const requestId = req.headers["x-request-id"];

			const id = typeof requestId === "string" && requestId.length > 0 ? requestId : randomUUID();

			res.setHeader("x-request-id", id);

			return id;
		},

		customLogLevel: (_req, res, err) => {
			if (err || res.statusCode >= 500) {
				return "error";
			}

			if (res.statusCode >= 400) {
				return "warn";
			}

			return "info";
		},

		serializers: {
			req: (req) => ({
				id: req.id,
				method: req.method,
				url: req.url?.split("?")[0],
				remoteAddress: req.remoteAddress,
				userAgent: req.headers["user-agent"],
			}),

			res: (res) => ({
				statusCode: res.statusCode,
			}),
		},
	}),
);

app.get("/", (_req, res) => {
	res.send("Hello from Nodejs");
});

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});
