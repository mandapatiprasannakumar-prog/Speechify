import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

const LEGACY_PASSWORD_SALT = "salt";
const PASSWORD_SALT_ROUNDS = 12;

/**
 * Generate a simple ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function isBcryptHash(value: string | null | undefined): boolean {
	return !!value && value.startsWith("$2");
}

export function legacyHashPassword(password: string): string {
	return createHash("sha256")
		.update(password + LEGACY_PASSWORD_SALT)
		.digest("hex");
}

/**
 * Hash password using bcrypt.
 * Legacy SHA-256 hashes remain valid during the upgrade window so seeded users can still log in.
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

/**
 * Verify a plaintext password against either a current bcrypt hash or the legacy SHA-256 hash.
 */
export async function verifyPassword(
	password: string,
	hashedPassword: string | null | undefined,
): Promise<boolean> {
	if (!hashedPassword) {
		return false;
	}

	if (isBcryptHash(hashedPassword)) {
		return bcrypt.compare(password, hashedPassword);
	}

	return legacyHashPassword(password) === hashedPassword;
}

/**
 * Convert Date to protobuf Timestamp
 */
export function toProtoTimestamp(date: Date): { seconds: bigint; nanos: number } {
	const ms = date.getTime();
	return {
		seconds: BigInt(Math.floor(ms / 1000)),
		nanos: (ms % 1000) * 1000000,
	};
}

/**
 * Convert protobuf Timestamp to Date
 */
export function fromProtoTimestamp(timestamp: { seconds: bigint; nanos: number }): Date {
	return new Date(Number(timestamp.seconds) * 1000 + timestamp.nanos / 1000000);
}
