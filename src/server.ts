import { app } from "./app.js";

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
		console.error("Failed to start server", error);
		process.exit(1);
	}
});

let isShuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
	if (isShuttingDown) return;
	isShuttingDown = true;
	console.log(`${signal} received, shutting down`);

	const forceExit = setTimeout(() => {
		console.error("Shutdown timed out, forcing exit");
		server.closeAllConnections();
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);
	forceExit.unref();

	server.close((error) => {
		if (error) {
			console.error("Error while closing server", error);
			process.exit(1);
		}
		console.log("Server closed cleanly");
		process.exit(0);
	});

	server.closeIdleConnections();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
