// /pages/api/exams.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const file = path.join(process.cwd(), 'data', 'exams.json');
    if (!fs.existsSync(file)) return res.status(500).json({ message: 'No exams data' });
    const exams = JSON.parse(fs.readFileSync(file, 'utf-8'));

    // if ?all=true, return them all
    if (req.query.all === 'true') {
        return res.status(200).json(exams);
    }

    // otherwise filter by studentCode (legacy)
    const { studentCode } = req.query;
    if (!studentCode) return res.status(400).json({ message: 'Missing studentCode' });
    const filtered = exams.filter(e => e.students.includes(studentCode));
    return res.status(200).json(filtered);
}
