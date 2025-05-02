// pages/api/export.ics.js
import fs from 'fs';
import path from 'path';
import { createEvents } from 'ics';

export default function handler(req, res) {
    // Destructure and default query params
    const { code = '', category = 'asal', subjects = '[]', et = '{}' } = req.query;

    // Load the correct JSON file
    const filePath = path.join(process.cwd(), 'data', `${category}.json`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('No exam data for this category');
    }
    const allExams = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Parse selected subjects and extra-time map
    let picked, etMap;
    try {
        picked = JSON.parse(subjects);
        etMap  = JSON.parse(et);
    } catch {
        return res.status(400).send('Invalid subjects or et parameter');
    }

    // Helper to convert "9.30am" into { h, mm }
    const parseTime = str => {
        const m = /^([0-9]{1,2})\.(\d{2})(am|pm)$/i.exec(str) || [];
        let h = +m[1] || 0;
        let mm = +m[2] || 0;
        const p = (m[3] || '').toLowerCase();
        if (p === 'pm' && h < 12) h += 12;
        if (p === 'am' && h === 12) h = 0;
        return { h, mm };
    };

    // Build the ICS events array, marking times as local
    const events = [];
    picked.forEach(subj => {
        allExams
            .filter(ex =>
                ex.subject === subj &&
                (code.trim() === ''
                    ? ex.students.length === 0
                    : ex.students.includes(code) || ex.students.length === 0)
            )
            .forEach(ex => {
                const d     = new Date(ex.date);
                const st    = parseTime(ex.start);
                const useET = etMap[ex.id] && ex.etFinish;
                const fin   = useET ? ex.etFinish : ex.finish;
                const en    = parseTime(fin);

                events.push({
                    title: ex.subject,
                    start: [d.getFullYear(), d.getMonth() + 1, d.getDate(), st.h, st.mm],
                    end:   [d.getFullYear(), d.getMonth() + 1, d.getDate(), en.h,   en.mm],
                    location:    ex.venue,
                    description: ex.code,
                    // Tell ics library these are local times (no UTC/Z)
                    startInputType: 'local',
                    endInputType:   'local',
                });
            });
    });

    // Generate and send the ICS file
    createEvents(events, (error, value) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error generating calendar');
        }
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            'inline; filename="exams.ics"'
        );
        res.status(200).send(value);
    });
}
