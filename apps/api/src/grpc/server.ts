import {
	AdminService,
	AuthService,
	BookmarksService,
	CommentsService,
	FeedService,
	FollowsService,
	LikesService,
	NotificationsService,
	PostsService,
	SearchService,
	UsersService,
} from "@chirp/proto";
import { Server, ServerCredentials } from "@grpc/grpc-js";
import { adaptService } from "@protobuf-ts/grpc-backend";
import { adminHandler } from "./handlers/admin.handler";
import { authHandler } from "./handlers/auth.handler";
import { bookmarksHandler } from "./handlers/bookmarks.handler";
import { commentsHandler } from "./handlers/comments.handler";
import { feedHandler } from "./handlers/feed.handler";
import { followsHandler } from "./handlers/follows.handler";
import { likesHandler } from "./handlers/likes.handler";
import { notificationsHandler } from "./handlers/notifications.handler";
import { postsHandler } from "./handlers/posts.handler";
import { searchHandler } from "./handlers/search.handler";
import { usersHandler } from "./handlers/users.handler";
import { traceInterceptor, withObservability } from "./observability";

export function startGrpcServer(port: number): Promise<Server> {
	const server = new Server({ interceptors: [traceInterceptor] });

	// Register all service handlers
	server.addService(...adaptService(AuthService, withObservability("auth", authHandler)));
	server.addService(...adaptService(PostsService, withObservability("posts", postsHandler)));
	server.addService(
		...adaptService(CommentsService, withObservability("comments", commentsHandler)),
	);
	server.addService(...adaptService(LikesService, withObservability("likes", likesHandler)));
	server.addService(...adaptService(FollowsService, withObservability("follows", followsHandler)));
	server.addService(...adaptService(FeedService, withObservability("feed", feedHandler)));
	server.addService(...adaptService(SearchService, withObservability("search", searchHandler)));
	server.addService(...adaptService(UsersService, withObservability("users", usersHandler)));
	server.addService(...adaptService(AdminService, withObservability("admin", adminHandler)));
	server.addService(
		...adaptService(NotificationsService, withObservability("notifications", notificationsHandler)),
	);
	server.addService(
		...adaptService(BookmarksService, withObservability("bookmarks", bookmarksHandler)),
	);

	return new Promise((resolve, reject) => {
		server.bindAsync(`0.0.0.0:${port}`, ServerCredentials.createInsecure(), (error, boundPort) => {
			if (error) {
				console.error("Failed to bind gRPC server:", error);
				reject(error);
				return;
			}
			console.log(`   gRPC server bound to port ${boundPort}`);
			resolve(server);
		});
	});
}
