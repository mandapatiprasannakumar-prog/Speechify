import { useSession } from "@tanstack/react-start/server";

export interface AdminSessionData {
	userId: string;
	username: string;
	role: "admin" | "moderator";
}

export function getAdminSessionSecret(): string {
	const secret = process.env.SESSION_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error("SESSION_SECRET must be configured to a secure value before creating admin sessions.");
	}
	return secret;
}

export function useAdminSession() {
	return useSession<AdminSessionData>({
		password: getAdminSessionSecret(),
		name: "chirp-admin-session",
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 8, // 8 hours (shorter for admin)
		},
	});
}

export async function getAdminSessionData(): Promise<AdminSessionData | null> {
	const session = await useAdminSession();
	if (!session.data.userId || !session.data.role) {
		return null;
	}
	// Verify role is admin or moderator
	if (session.data.role !== "admin" && session.data.role !== "moderator") {
		return null;
	}
	return session.data as AdminSessionData;
}

export async function setAdminSessionData(data: AdminSessionData): Promise<void> {
	const session = await useAdminSession();
	await session.update(data);
}

export async function clearAdminSessionData(): Promise<void> {
	const session = await useAdminSession();
	await session.clear();
}

export async function requireAdminAuth(): Promise<AdminSessionData> {
	const session = await getAdminSessionData();
	if (!session) {
		throw new Error("Admin access required");
	}
	return session;
}
