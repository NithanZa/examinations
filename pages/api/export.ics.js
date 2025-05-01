// pages/api/export.ics.js
import fs from 'fs';
import path from 'path';
import { createEvents } from 'ics';

export default function handler(req, res) {
    const { code, category = 'asal', subjects, et } = req.query;
    if (!code) return res.status(400).send('Missing student code');

    // load exams JSON
    const filePath = path.join(process.cwd(), 'data', `${category}.json`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('No exam data for this category');
    }
    const allExams = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // parse subjects array
    let picked = [];
    if (subjects) {
        try {
            picked = JSON.parse(subjects);
        } catch {
            return res.status(400).send('Invalid subjects parameter');
        }
    }

    // parse the extra-time map
    let etMap = {};
    if (et) {
        try {
            etMap = JSON.parse(et);
        } catch {
            return res.status(400).send('Invalid et parameter');
        }
    }

    // helper to parse times
    const parseTime = str => {
        const m = /^([0-9]{1,2})\.([0-9]{2})(am|pm)$/i.exec(str) || [];
        let h = +m[1] || 0;
        let mm = +m[2] || 0;
        const p = m[3]?.toLowerCase();
        if (p === 'pm' && h < 12) h += 12;
        if (p === 'am' && h === 12) h = 0;
        return { h, mm };
    };

    // build events
    const events = [];
    picked.forEach(subj => {
        allExams
            .filter(
                e =>
                    e.subject === subj &&
                    (e.students.includes(code) || e.students.length === 0)
            )
            .forEach(ex => {
                const d = new Date(ex.date);
                const start = parseTime(ex.start);

                // choose finish based on etMap
                const useET = etMap[ex.id];
                const finishStr = useET && ex.etFinish ? ex.etFinish : ex.finish;
                const end = parseTime(finishStr);

                events.push({
                    title: ex.subject,
                    start: [d.getFullYear(), d.getMonth() + 1, d.getDate(), start.h, start.mm],
                    end:   [d.getFullYear(), d.getMonth() + 1, d.getDate(), end.h,   end.mm],
                    location: ex.venue,
                    description: ex.code,
                });
            });
    });

    // generate and send .ics
    createEvents(events, (error, ics) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error generating calendar');
        }
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="exams.ics"');
        res.status(200).send(ics);
    });
}
