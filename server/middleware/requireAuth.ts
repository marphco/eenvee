import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "eenvee_token";

export interface AuthRequest extends Request {
  userId?: string;
}

export default function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ message: "Non autorizzato" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as { userId: string };

    req.userId = decoded.userId;
    next();
  } catch (err: any) {
    console.log("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Non autorizzato" });
  }
}
