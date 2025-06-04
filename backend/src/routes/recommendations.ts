import { Router } from "express";
const router = Router();
router.get("/", (req, res) =>
  res.json({ message: "Recommendations routes - implementation pending" })
);
router.post("/refresh", (req, res) =>
  res.json({ message: "Refresh recommendations - implementation pending" })
);
export default router;
