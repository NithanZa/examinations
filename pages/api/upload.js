import formidable from "formidable";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import venueMap from "../../lib/venueMap";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ message: "Only POST allowed" });

    try {
        const form = formidable({ keepExtensions: true });
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
        });

        let category = 'asal';
        if (fields.category) {
            category = Array.isArray(fields.category)
                ? fields.category[0]
                : fields.category;
        }

        let fileRaw = files.file;
        if (Array.isArray(fileRaw)) fileRaw = fileRaw[0];
        const tempPath = fileRaw.filepath || fileRaw.tempFilePath || fileRaw.path;

        const fileBuffer = await fs.promises.readFile(tempPath);
        const wb = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });

        const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:"", raw:false });

        const exams = rows.map((row,i) => {
            const students = row.Students.toString().split(/\s*,\s*/).filter(Boolean);
            const venues = [row['Venue 1'], row['Venue 2']].filter(Boolean).map(c=>venueMap[c]||c).join(',\n');
            const dateObj = row.Date instanceof Date ? row.Date : new Date(row.Date);
            return { id:i, board:row.Board, code:row.Code, qual:row.Qual, subject:row['Subject/Component'], date:dateObj.toISOString(), start:row.Start, finish:row.Finish, etFinish:row['ET Finish']||'', venue:venues, students };
        });

        const outDir = path.join(process.cwd(),'data'); if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        const filename = category==='igcse'?'igcse.json':'asal.json';
        fs.writeFileSync(path.join(outDir,filename), JSON.stringify(exams,null,2));

        res.status(200).json({ message: `${category.toUpperCase()} exams uploaded.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}