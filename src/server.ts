import { app } from "./app.js";
import { logger } from "./observability/logger.js";

const SHUTDOWN_TIMEOUT_MS = 8_000;

function parsePort(raw: string | undefined): number {
	const port = Number(raw ?? 3000);
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`Invalid PORT: "${raw}"`);
	}
	return port;
}

const PORT = parsePort(process.env.PORT);

const server = app.listen(PORT, (error) => {
	if (error) {
		logger.fatal({ err: error, port: PORT }, "Failed to start server");
		process.exit(1);
	}
	logger.info({ port: PORT }, "API listening");
});

let isShuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
	if (isShuttingDown) return;
	isShuttingDown = true;
	logger.info({ signal }, "Shutdown started");

	const forceExit = setTimeout(() => {
		logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, "Shutdown timed out, forcing exit");
		server.closeAllConnections();
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);
	forceExit.unref();

	server.close((error) => {
		if (error) {
			logger.error({ err: error }, "Error while closing server");
			process.exit(1);
		}
		logger.info("Server closed cleanly");
		process.exit(0);
	});

	server.closeIdleConnections();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
