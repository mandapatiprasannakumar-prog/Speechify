import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestPost, createTestUser } from "../../tests/helpers";
import { db, schema } from "../db";
import { getBookmarkedPosts } from "./bookmarks.service";
import { getHomeFeed } from "./feed.service";
import { generateId } from "./utils";

const { bookmarks } = schema;

describe("batched post enrichment query counts", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("loads a ten-post home feed in five queries", async () => {
		const user = await createTestUser();
		for (let index = 0; index < 10; index += 1) {
			await createTestPost(user.id, `Post ${index}`);
		}

		const { client } = await import("../db");
		const execute = vi.spyOn(client, "execute");
		await getHomeFeed(user.id, { limit: 10 });

		expect(execute).toHaveBeenCalledTimes(5);
	});

	it("loads ten bookmarked posts in five queries", async () => {
		const user = await createTestUser();
		for (let index = 0; index < 10; index += 1) {
			const postId = await createTestPost(user.id, `Post ${index}`);
			await db.insert(bookmarks).values({ id: generateId(), userId: user.id, postId });
		}

		const { client } = await import("../db");
		const execute = vi.spyOn(client, "execute");
		await getBookmarkedPosts(user.id, user.id, 10);

		expect(execute).toHaveBeenCalledTimes(5);
	});
});
