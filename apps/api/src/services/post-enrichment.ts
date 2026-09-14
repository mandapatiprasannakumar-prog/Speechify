import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { comments, likes, posts, users } = schema;

export type PostListItem = {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
	} | null;
};

export async function enrichPosts(postsToEnrich: PostListItem[], userId?: string) {
	if (postsToEnrich.length === 0) return [];

	const postIds = postsToEnrich.map((post) => post.id);
	const [likeCounts, commentCounts, userLikes] = await Promise.all([
		db
			.select({ postId: likes.postId, count: sql<number>`count(*)` })
			.from(likes)
			.where(inArray(likes.postId, postIds))
			.groupBy(likes.postId),
		db
			.select({ postId: comments.postId, count: sql<number>`count(*)` })
			.from(comments)
			.where(inArray(comments.postId, postIds))
			.groupBy(comments.postId),
		userId
			? db
					.select({ postId: likes.postId })
					.from(likes)
					.where(and(eq(likes.userId, userId), inArray(likes.postId, postIds)))
			: Promise.resolve([]),
	]);

	const likesByPost = new Map(likeCounts.map((row) => [row.postId, row.count]));
	const commentsByPost = new Map(commentCounts.map((row) => [row.postId, row.count]));
	const userLikeIds = new Set(userLikes.map((row) => row.postId));

	return postsToEnrich.map((post) => ({
		...post,
		likeCount: likesByPost.get(post.id) || 0,
		commentCount: commentsByPost.get(post.id) || 0,
		isLiked: userLikeIds.has(post.id),
	}));
}

export function postSelection() {
	return {
		id: posts.id,
		content: posts.content,
		createdAt: posts.createdAt,
		updatedAt: posts.updatedAt,
		author: {
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
		},
	};
}
