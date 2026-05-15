import { HttpStatus } from "../../constants/http.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { postsService } from "./post.service.js";
export const postsController = {
  listPublished: asyncHandler(async (req, res) => {
    const result = await postsService.listPublished(req.query);
    res.status(HttpStatus.OK).json(
      new ApiResponse(HttpStatus.OK, result.items, "Published posts", {
        nextCursor: result.nextCursor,
      }),
    );
  }),
  getPublished: asyncHandler(async (req, res) => {
    const post = await postsService.getPublished(req.params.slug);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, post, "Published post"));
  }),
  listMine: asyncHandler(async (req, res) => {
    const posts = await postsService.listMine(req.user);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, posts, "Your posts"));
  }),
  getMine: asyncHandler(async (req, res) => {
    const post = await postsService.getMine(req.user, req.params.id);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, post, "Your post"));
  }),
  create: asyncHandler(async (req, res) => {
    const post = await postsService.create(req.user, req.body);
    res.status(HttpStatus.CREATED).json(new ApiResponse(HttpStatus.CREATED, post, "Post created"));
  }),
  update: asyncHandler(async (req, res) => {
    const post = await postsService.update(req.user, req.params.id, req.body);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, post, "Post updated"));
  }),
  publish: asyncHandler(async (req, res) => {
    const post = await postsService.publish(req.user, req.params.id);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, post, "Post published"));
  }),
  unpublish: asyncHandler(async (req, res) => {
    const post = await postsService.unpublish(req.user, req.params.id);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, post, "Post unpublished"));
  }),
  remove: asyncHandler(async (req, res) => {
    const post = await postsService.remove(req.user, req.params.id);
    res.status(HttpStatus.OK).json(new ApiResponse(HttpStatus.OK, post, "Post deleted"));
  }),
};
