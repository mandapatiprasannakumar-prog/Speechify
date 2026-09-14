import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { ServerInterceptingCall, type ServerInterceptor, status } from "@grpc/grpc-js";

const traceStorage = new AsyncLocalStorage<string>();

export type ErrorCode =
	| "INVALID_ARGUMENT"
	| "UNAUTHENTICATED"
	| "PERMISSION_DENIED"
	| "NOT_FOUND"
	| "INTERNAL";

export function toGrpcStatusCode(code: ErrorCode): number {
	return {
		INVALID_ARGUMENT: status.INVALID_ARGUMENT,
		UNAUTHENTICATED: status.UNAUTHENTICATED,
		PERMISSION_DENIED: status.PERMISSION_DENIED,
		NOT_FOUND: status.NOT_FOUND,
		INTERNAL: status.INTERNAL,
	}[code];
}

export interface ApiError {
	code: ErrorCode;
	message: string;
	traceId: string;
}

export function classifyError(error: unknown): ErrorCode {
	const message = error instanceof Error ? error.message : "";
	if (message.includes("Invalid") || message.includes("Authentication required"))
		return "UNAUTHENTICATED";
	if (message.includes("access") || message.includes("own") || message.includes("admin"))
		return "PERMISSION_DENIED";
	if (message.includes("not found") || message.includes("Not found")) return "NOT_FOUND";
	if (message.includes("required") || message.includes("already") || message.includes("taken"))
		return "INVALID_ARGUMENT";
	return "INTERNAL";
}

export function logRequest(
	service: string,
	method: string,
	traceId: string,
	fields: Record<string, unknown> = {},
) {
	console.log(
		JSON.stringify({ level: "info", event: "grpc.request", service, method, traceId, ...fields }),
	);
}

export function logFailure(service: string, method: string, traceId: string, error: unknown) {
	const code = classifyError(error);
	console.error(
		JSON.stringify({
			level: "error",
			event: "grpc.failure",
			service,
			method,
			traceId,
			code,
			grpcStatus: toGrpcStatusCode(code),
			error: error instanceof Error ? error.message : String(error),
		}),
	);
}

export const traceInterceptor: ServerInterceptor = (methodDescriptor, call) => {
	const traceId = randomUUID();
	traceStorage.enterWith(traceId);
	logRequest("grpc", methodDescriptor.path, traceId);
	return new ServerInterceptingCall(call, {
		sendMetadata(metadata, next) {
			metadata.add("x-trace-id", traceId);
			next(metadata);
		},
	});
};

export function withObservability<T extends object>(service: string, handler: T): T {
	return new Proxy(handler, {
		get(target, property, receiver) {
			const value = Reflect.get(target, property, receiver);
			if (typeof value !== "function") return value;
			return async (...args: unknown[]) => {
				const traceId = traceStorage.getStore() || randomUUID();
				const method = String(property);
				const startedAt = Date.now();
				logRequest(service, method, traceId);
				try {
					const result = await value.apply(target, args);
					logRequest(service, method, traceId, {
						status: "ok",
						durationMs: Date.now() - startedAt,
					});
					return result;
				} catch (error) {
					logFailure(service, method, traceId, error);
					throw error;
				}
			};
		},
	}) as T;
}
