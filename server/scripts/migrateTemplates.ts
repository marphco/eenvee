import fs from 'fs';
import path from 'path';
import { getR2Client } from '../utils/r2.js';
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const TEMPLATES_DIR = path.resolve(__dirname, '../../client/public/templates');
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

async function migrate() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error("Templates directory not found at:", TEMPLATES_DIR);
    return;
  }

  const client = getR2Client();
  const files = fs.readdirSync(TEMPLATES_DIR);

  console.log(`Migrating ${files.length} templates from ${TEMPLATES_DIR}...`);

  for (const file of files) {
    if (file.startsWith('.')) continue;

    const filePath = path.join(TEMPLATES_DIR, file);
    const key = `templates/${file}`;
    const buffer = fs.readFileSync(filePath);

    console.log(`Uploading ${file}...`);
    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
      },
    });

    await upload.done();
    console.log(`Done: ${file}`);
  }
}

migrate().catch(console.error);
