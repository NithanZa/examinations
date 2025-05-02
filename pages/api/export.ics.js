// pages/api/export.ics.js
import fs from 'fs';
import path from 'path';
import { createEvents } from 'ics';

export default function handler(req, res) {
    const { code = '', category = 'asal', subjects = '[]', et = '{}' } = req.query;

    // Load exams JSON
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

    // Build ICS events with local times (no UTC) and shift each date by 1
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
                // Parse date and shift one day forward
                const d = new Date(ex.date);
                d.setDate(d.getDate() + 1);

                const st    = parseTime(ex.start);
                const useET = etMap[ex.id] && ex.etFinish;
                const fin   = useET ? ex.etFinish : ex.finish;
                const en    = parseTime(fin);

                events.push({
                    title:          ex.subject,
                    start:          [d.getFullYear(), d.getMonth() + 1, d.getDate(), st.h,  st.mm],
                    end:            [d.getFullYear(), d.getMonth() + 1, d.getDate(), en.h,   en.mm],
                    location:       ex.venue,
                    description:    ex.code,
                    startInputType: 'local',
                    endInputType:   'local',
                });
            });
    });

    // Generate ICS
    createEvents(events, (error, ics) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error generating calendar');
        }

        // VTIMEZONE block for Asia/Bangkok
        const tzBlock = [
            'BEGIN:VTIMEZONE',
            'TZID:Asia/Bangkok',
            'X-LIC-LOCATION:Asia/Bangkok',
            'BEGIN:STANDARD',
            'DTSTART:19700101T000000',
            'TZOFFSETFROM:+0700',
            'TZOFFSETTO:+0700',
            'TZNAME:ICT',
            'END:STANDARD',
            'END:VTIMEZONE',
        ].join('\r\n');

        // Insert timezone block after CALSCALE line
        let output = ics.replace(
            /CALSCALE:GREGORIAN/,
            'CALSCALE:GREGORIAN\r\n' + tzBlock
        );

        // Replace UTC timestamps with local times tagged Asia/Bangkok
        output = output
            .replace(/^DTSTART:(\d{8}T\d{6})Z/gm, 'DTSTART;TZID=Asia/Bangkok:$1')
            .replace(/^DTEND:(\d{8}T\d{6})Z/gm,   'DTEND;TZID=Asia/Bangkok:$1');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="exams.ics"');
        res.status(200).send(output);
    });
}
