import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { postsController } from "./post.controller.js";
import {
  createPostSchema,
  listPostsQuerySchema,
  postIdParamsSchema,
  postSlugParamsSchema,
  updatePostSchema,
} from "./post.validation.js";
export const postRoutes = Router();
postRoutes.get("/", validateRequest(listPostsQuerySchema, "query"), postsController.listPublished);
postRoutes.get("/mine", requireAuth, postsController.listMine);
postRoutes.get(
  "/mine/:id",
  requireAuth,
  validateRequest(postIdParamsSchema, "params"),
  postsController.getMine,
);
postRoutes.get(
  "/:slug",
  validateRequest(postSlugParamsSchema, "params"),
  postsController.getPublished,
);
postRoutes.post("/", requireAuth, validateRequest(createPostSchema), postsController.create);
postRoutes.patch(
  "/:id",
  requireAuth,
  validateRequest(postIdParamsSchema, "params"),
  validateRequest(updatePostSchema),
  postsController.update,
);
postRoutes.post(
  "/:id/publish",
  requireAuth,
  validateRequest(postIdParamsSchema, "params"),
  postsController.publish,
);
postRoutes.post(
  "/:id/unpublish",
  requireAuth,
  validateRequest(postIdParamsSchema, "params"),
  postsController.unpublish,
);
postRoutes.delete(
  "/:id",
  requireAuth,
  validateRequest(postIdParamsSchema, "params"),
  postsController.remove,
);
