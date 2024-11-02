import { Router } from "express";
import { getSessionsHandler } from "../controllers/session.controller";

const SessionRoutes = Router();

// prefix: / sessions

SessionRoutes.get("/", getSessionsHandler);

export default SessionRoutes;
