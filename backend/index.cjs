require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const pdfParse = require('pdf-parse');

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    'pdfjs-dist/legacy/build/pdf.worker.js'
);
pdfjsLib.disableFontFace = true;

const { createCanvas } = require('canvas');
const Tesseract  = require('tesseract.js');
const fs         = require('fs/promises');
const fsSync     = require('fs');
const axios      = require('axios');
const rateLimit  = require('express-rate-limit');

if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is missing');
    process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 5000;

// ensure upload directory
if (!fsSync.existsSync('uploads')) fsSync.mkdirSync('uploads');

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 60_000, max: 30 }));

const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (_, f, cb) => cb(null, `${Date.now()}.pdf`)
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_, f, cb) =>
        f.mimetype === 'application/pdf'
            ? cb(null, true)
            : cb(new Error('Only PDFs are allowed'))
});

class SafeCanvasFactory {
    create(w, h) {
        const cw = Math.max(1, Math.ceil(w)), ch = Math.max(1, Math.ceil(h));
        const canvas = createCanvas(cw, ch);
        return { canvas, context: canvas.getContext('2d') };
    }
    reset(t, w, h) {
        t.canvas.width  = Math.max(1, Math.ceil(w));
        t.canvas.height = Math.max(1, Math.ceil(h));
    }
    destroy(t) { t.canvas = null; t.context = null; }
}

async function openAI(messages, attempt = 1) {
    try {
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            { model: 'gpt-4o-mini', messages, max_tokens: 1024, temperature: 0.2 },
            {
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
                timeout: 30000
            }
        );
        return data.choices[0].message.content.trim();
    } catch (e) {
        if (attempt < 3) {
            await new Promise(r => setTimeout(r, 300 * attempt));
            return openAI(messages, attempt + 1);
        }
        throw e;
    }
}

async function ocrPdf(path) {
    const raw = new Uint8Array(await fs.readFile(path));
    const doc = await pdfjsLib.getDocument({ data: raw }).promise;
    const factory = new SafeCanvasFactory();
    let text = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const vp   = page.getViewport({ scale: 2 });
        const { canvas, context } = factory.create(vp.width, vp.height);

        await page.render({
            canvasContext: context,
            viewport: vp,
            canvasFactory: factory
        }).promise;

        const { data: ocr } = await Tesseract.recognize(
            canvas.toBuffer(), 'eng', { logger: () => {} }
        );
        text += ocr.text + '\n';
        factory.destroy({ canvas, context });
    }

    await doc.destroy();
    return text;
}

app.post('/upload', (req, res) => {
    upload.single('pdf')(req, res, async err => {
        if (err instanceof multer.MulterError) {
            return err.code === 'LIMIT_FILE_SIZE'
                ? res.status(413).send('File too large (max 8 MB)')
                : res.status(400).send(err.message);
        }
        if (err) return res.status(500).send('Upload error');
        if (!req.file) return res.status(400).send('No PDF uploaded');

        try {
            let { text } = await pdfParse(await fs.readFile(req.file.path));
            if (!text.trim()) text = await ocrPdf(req.file.path);
            if (!text.trim()) {
                return res.json({ summary: '', note: 'No readable text.' });
            }

            const summary = await openAI([
                { role: 'system', content: 'You are a concise summariser.' },
                { role: 'user',   content: `Summarise:\n\n${text}` }
            ]);

            res.json({ summary });
        } catch (e) {
            console.error('Error processing PDF:', e);
            res.status(500).json({ error: 'Error processing PDF' });
        } finally {
            fs.unlink(req.file.path).catch(() => {});
        }
    });
});

app.get('/', (_, res) => res.send('Backend running'));
app.listen(PORT, () => console.log(`Ready on http://localhost:${PORT}`));
