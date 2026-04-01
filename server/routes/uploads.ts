import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import Event from "../models/Event.js";
import { getR2Client } from "../utils/r2.js";

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = file.mimetype && file.mimetype.startsWith("image/");
  if (!isImage) return cb(new Error("Puoi caricare solo immagini."));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20,
  },
});

const requirePremiumForGalleryUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const ev = await Event.findOne({ slug: slug as string });
    if (!ev) return res.status(404).json({ error: "Evento non trovato" });

    const isPremium = (ev.plan || "free").toLowerCase() === "premium";
    // Allow uploads in local development or if premium
    if (!isPremium && process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Gallery solo Premium" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

// Caricamento Immagini
router.post(
  "/",
  requirePremiumForGalleryUpload as any,
  upload.array("images", 20),
  async (req: Request, res: Response) => {
    try {
      const files = (req as any).files as Express.Multer.File[] || [];
      const { slug, folder: customFolder } = req.query;
      const urls: string[] = [];

      const r2Config = {
        bucketName: process.env.R2_BUCKET_NAME,
        publicUrl: process.env.R2_PUBLIC_URL
      };

      const isR2Ready = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT && r2Config.bucketName);

      if (isR2Ready) {
        const client = getR2Client();
        
        // Determina la cartella di destinazione
        let folder = "temp";
        if (customFolder === "templates") {
          folder = "templates";
        } else if (slug) {
          folder = `events/${slug}`;
        }

        const uploadPromises = files.map(async (file) => {
          const ext = path.extname(file.originalname);
          const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

          const s3Upload = new Upload({
            client,
            params: {
              Bucket: r2Config.bucketName,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            },
          });

          await s3Upload.done();
          return `${r2Config.publicUrl}/${key}`;
        });

        const r2Urls = await Promise.all(uploadPromises);
        urls.push(...r2Urls);
      } else {
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        
        const localPromises = files.map(async (file) => {
          const ext = path.extname(file.originalname);
          const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          const filePath = path.join(UPLOAD_DIR, filename);
          fs.writeFileSync(filePath, file.buffer);
          return `/uploads/${filename}`;
        });
        
        const localUrls = await Promise.all(localPromises);
        urls.push(...localUrls);
      }

      res.json({ urls });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ error: "Errore durante il caricamento delle immagini." });
    }
  }
);

// ✅ Endpoint di test per R2
router.post("/test-r2", upload.single("image"), async (req: Request, res: Response) => {
  const r2Config = {
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL
  };

  const isR2Ready = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT && r2Config.bucketName);

  if (!isR2Ready) {
    return res.status(500).json({ error: "R2 non configurato" });
  }

  if (!req.file) return res.status(400).json({ error: "Nessun file inviato" });

  try {
    const client = getR2Client();
    const ext = path.extname(req.file.originalname);
    const key = `test/${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await client.send(command);
    
    const url = `${r2Config.publicUrl}/${key}`;
    res.json({ message: "Test R2 riuscito!", url });
  } catch (err: any) {
    console.error("TEST R2 ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
