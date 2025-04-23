import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable'; 
import fs from 'fs';

// Define sanitizeFileName locally (or import if you have it elsewhere)
const sanitizeFileName = (fileName: string): string => {
    const normalized = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\x00-\x7F]/g, '_'); // Replace non-ASCII with underscore

    const sanitized = normalized
      .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_+/g, '_'); // Collapse multiple underscores

    return sanitized.replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores
};

// Disable Next.js body parsing, rely on formidable
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Ensure environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Supabase URL or Service Role Key not configured.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const form = formidable({});

    try {
        const [fields, files] = await form.parse(req);

        const fileArray = files.file; // formidable wraps files in arrays
        const storeIdArray = fields.storeId;

        if (!fileArray || fileArray.length === 0 || !fileArray[0]) {
            return res.status(400).json({ error: 'No file provided.' });
        }
        const file = fileArray[0];

        if (!storeIdArray || storeIdArray.length === 0 || !storeIdArray[0]) {
            return res.status(400).json({ error: 'Store ID is required.' });
        }
        const storeId = storeIdArray[0];

        // Read the file buffer
        const fileBuffer = fs.readFileSync(file.filepath);

        // Use Admin client for bypassing RLS
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        const bucketName = 'csentio-contracts';
        const fileExt = file.originalFilename?.split('.').pop()?.toLowerCase() || '';
        const baseName = file.originalFilename?.substring(0, file.originalFilename.lastIndexOf('.')) || file.originalFilename || 'file';
        const sanitizedBaseName = sanitizeFileName(baseName);
        const fileName = `contracts/${Date.now()}-${storeId}-${sanitizedBaseName}.${fileExt}`;

        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
                contentType: file.mimetype || 'application/octet-stream',
                upsert: false,
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            return res.status(500).json({ error: `Failed to upload file: ${error.message}` });
        }

        // Get the public URL
        const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
            console.error('Failed to get public URL after upload for:', fileName);
            // Maybe still return success but without URL? Or consider it an error.
            return res.status(500).json({ error: 'File uploaded but failed to get URL.' });
        }

        console.log('File uploaded successfully via backend:', urlData.publicUrl);
        return res.status(200).json({ publicUrl: urlData.publicUrl });

    } catch (err) {
        console.error('Error parsing form or during file upload:', err);
        return res.status(500).json({ error: 'An unexpected error occurred processing the upload.' });
    }
} 