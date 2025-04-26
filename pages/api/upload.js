// pages/api/upload.js

import formidable from "formidable";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import venueMap from "../../lib/venueMap";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Only POST allowed" });
    }

    try {
        // 1) Initialize formidable parser
        const form = formidable({ keepExtensions: true, multiples: false });

        // 2) Parse the incoming form
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });

        // 3) Debug: log the file keys we received
        console.log("🔍 files keys:", Object.keys(files));

        // 4) Retrieve the uploaded file (supports array or single)
        const fileKey = Object.keys(files)[0];
        let uploadRaw = files[fileKey];
        if (Array.isArray(uploadRaw)) {
            uploadRaw = uploadRaw[0];
        }

        if (!uploadRaw) {
            return res.status(400).json({ message: "No file found in upload" });
        }

        // 5) Figure out the temp‐file path property
        const tempPath =
            uploadRaw.filepath ||      // formidable v2+
            uploadRaw.tempFilePath ||  // some versions
            uploadRaw.path;            // formidable v1

        if (!tempPath) {
            console.error("Upload object:", uploadRaw);
            return res
                .status(400)
                .json({ message: "Upload failed: no temp path on file object" });
        }

        // 6) Read & parse the workbook with real Date objects
        const fileBuffer = fs.readFileSync(tempPath);
        const wb         = xlsx.read(fileBuffer, {
            type:      'buffer',
            cellDates: true
        });
        const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
            defval: "",
            raw: false,
        });

        // 7) Transform each row into an exam object
        const exams = rows.map((row, i) => {
            const students = row.Students
                .toString()
                .split(/\s*,\s*/)
                .filter(Boolean);

            const venues = [row["Venue 1"], row["Venue 2"]]
                .filter(Boolean)
                .map((c) => venueMap[c] || c)
                .join("and");

            // Ensure we have a JS Date for ISO conversion
            const dateObj =
                row.Date instanceof Date ? row.Date : new Date(row.Date);

            return {
                id:        i,
                board:     row.Board,
                code:      row.Code,
                qual:      row.Qual,
                subject:   row["Subject/Component"],
                date:      dateObj.toISOString(),
                start:     row.Start,
                finish:    row.Finish,
                etFinish:  row["ET Finish"] || "",
                session:   row.Session,
                venue:     venues,
                students,
            };
        });

        // 8) Write the exams array to data/exams.json
        const outDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }
        fs.writeFileSync(
            path.join(outDir, "exams.json"),
            JSON.stringify(exams, null, 2)
        );

        // 9) Return success
        return res.status(200).json({ message: "Exams uploaded and parsed." });
    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ message: err.message });
    }
}
