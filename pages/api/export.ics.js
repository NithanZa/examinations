// pages/api/export.ics.js
import fs from 'fs';
import path from 'path';
import { createEvents } from 'ics';

export default function handler(req, res) {
    // code is now optional
    const { code = '', category = 'asal', subjects = '[]', et = '{}' } = req.query;

    // load exams JSON
    const filePath = path.join(process.cwd(), 'data', `${category}.json`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('No exam data for this category');
    }
    const allExams = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // parse subjects & et maps
    let picked, etMap;
    try {
        picked = JSON.parse(subjects);
        etMap  = JSON.parse(et);
    } catch {
        return res.status(400).send('Invalid subjects or et parameter');
    }

    // helper to parse times
    const parseTime = str => {
        const m = /^([0-9]{1,2})\.([0-9]{2})(am|pm)$/i.exec(str) || [];
        let h = +m[1] || 0, mm = +m[2] || 0;
        const p = (m[3] || '').toLowerCase();
        if (p === 'pm' && h < 12) h += 12;
        if (p === 'am' && h === 12) h = 0;
        return { h, mm };
    };

    // build events
    const events = [];
    picked.forEach(subj => {
        allExams
            .filter(ex => {
                if (ex.subject !== subj) return false;
                if (code.trim() === '') {
                    return ex.students.length === 0;
                }
                return ex.students.includes(code) || ex.students.length === 0;
            })

            .forEach(ex => {
                const d    = new Date(ex.date);
                const st   = parseTime(ex.start);
                const useET = etMap[ex.id] && ex.etFinish;
                const finT = useET ? ex.etFinish : ex.finish;
                const en   = parseTime(finT);
                events.push({
                    title:       ex.subject,
                    start:       [d.getFullYear(), d.getMonth()+1, d.getDate(), st.h,  st.mm],
                    end:         [d.getFullYear(), d.getMonth()+1, d.getDate(), en.h,   en.mm],
                    location:    ex.venue,
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
        res.setHeader('Content-Type',        'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="exams.ics"');
        res.status(200).send(ics);
    });
}
