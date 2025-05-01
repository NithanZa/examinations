import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const cat = req.query.category === 'igcse' ? 'igcse' : 'asal';
    const file = path.join(process.cwd(), 'data', `${cat}.json`);
    if (!fs.existsSync(file)) return res.status(500).json({ message: 'No exams data for ' + cat });
    const exams = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return res.status(200).json(exams)
}