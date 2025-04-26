// pages/index.js
import {useRef, useState} from 'react';
import html2canvas from 'html2canvas-pro';
if (typeof window !== 'undefined') window.html2canvas = html2canvas;
import jsPDF from 'jspdf';
import {createEvents} from 'ics';
import {ArrowLeft, Calendar, Clock, MapPin, Tag} from 'lucide-react';

export default function Home() {
    const [code, setCode] = useState('');
    const [allExams, setAllExams] = useState([]);
    const [selectedSubjects, setSelected] = useState(new Set());
    const [etSelected, setEtSelected] = useState({});
    const [view, setView] = useState('select'); // 'select' or 'cards'
    const cardsRef = useRef(null);

    // fetch exams whenever code changes
    const loadExams = async () => {
        if (!code.trim()) return;
        const res = await fetch(`/api/exams?all=true&studentCode=${code}`);
        const data = await res.json();
        setAllExams(data);
    };

    // grouped subjects by first word
    const subjects = Array.from(new Set(allExams.map(e => e.subject))).sort();
    const grouped = subjects.reduce((acc, subj) => {
        const key = subj.split(' ')[0];
        const grp = acc.find(g => g.key === key);
        if (grp) grp.items.push(subj);
        else acc.push({key, items: [subj]});
        return acc;
    }, []);

    const toggleSub = subj => {
        setSelected(prev => {
            const nxt = new Set(prev);
            nxt.has(subj) ? nxt.delete(subj) : nxt.add(subj);
            return nxt;
        });
    };

    const parseTime = str => {
        const m = /^(\d{1,2})\.(\d{2})(am|pm)$/i.exec(str) || [];
        let h = +m[1], mm = +m[2], p = m[3]?.toLowerCase();
        if (p === 'pm' && h < 12) h += 12;
        if (p === 'am' && h === 12) h = 0;
        return {h, mm};
    };

    const getExams = subj => {
        const special = allExams.filter(e => e.subject === subj && e.students.includes(code));
        return special.length ? special : allExams.filter(e => e.subject === subj && e.students.length === 0);
    };

    const hasAnySpecial = Array.from(selectedSubjects).some(subj =>
        allExams.some(e => e.subject === subj && e.students.includes(code))
    );

    // const downloadPDF = async () => {
    //     const container = cardsRef.current;
    //
    //     // 1) Force 3-column grid
    //     container.classList.add('pdf-grid');
    //
    //     // 2) Snapshot at white background
    //     const canvas = await html2canvas(container, { backgroundColor: '#fff' });
    //
    //     // 3) Remove the grid hack so the UI snaps back
    //     container.classList.remove('pdf-grid');
    //
    //     // 4) Scale to full A4 width, preserve aspect
    //     const img     = canvas.toDataURL('image/png');
    //     const pdf     = new jsPDF('p','pt','a4');
    //     const pdfW    = pdf.internal.pageSize.getWidth();
    //     const pdfH    = (canvas.height / canvas.width) * pdfW;
    //
    //     pdf.addImage(img, 'PNG', 0, 0, pdfW, pdfH);
    //     pdf.save('exam-cards.pdf');
    // };

    async function downloadPDF() {
        const container = cardsRef.current;

        // 1. Wait for your web font(s) to load
        await document.fonts.ready;

        // 2. Force a desktop-width so you always snap a 3-col grid
        const oldWidth = container.style.width;
        container.style.width = '1200px';

        // 3. Kick off html2pdf
        const opts = {
            margin:       20,            // pts
            filename:     'exam-cards.pdf',
            image:        { type: 'png', quality: 1.0 },
            html2canvas:  {
                backgroundColor: '#fff',
                scale:           2,        // Retina crispness
                useCORS:         true,
            },
            jsPDF:        { unit:'pt', format:'a4', orientation:'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] } // respect your grid, then auto-paginate
        };

        await html2pdf().set(opts).from(container).save();

        // 4. Restore live layout
        container.style.width = oldWidth;
    }



    const downloadICS = () => {
        const events = [];
        selectedSubjects.forEach(subj => {
            getExams(subj).forEach(ex => {
                const d = new Date(ex.date);
                const st = parseTime(ex.start);
                const enT = etSelected[ex.id] && ex.etFinish ? ex.etFinish : ex.finish;
                const en = parseTime(enT);
                events.push({
                    title: ex.subject,
                    start: [d.getFullYear(), d.getMonth() + 1, d.getDate(), st.h, st.mm],
                    end: [d.getFullYear(), d.getMonth() + 1, d.getDate(), en.h, en.mm],
                    location: ex.venue,
                    description: ex.code
                });
            });
        });
        createEvents(events, (err, value) => {
            if (err) return;
            const blob = new Blob([value], {type: 'text/calendar'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'exams.ics';
            link.click();
        });
    };

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
            <div className="max-w-11/12 mx-auto bg-white bg-opacity-70 backdrop-blur-md rounded-lg p-6 space-y-6">

                {/* combined code entry + exam selection */}
                {view === 'select' && (
                    <>
                        <div className="text-center space-y-3 align-middle">
                            <h1 className="text-4xl font-bold text-indigo-700">AS/AL Exams Beautifier</h1>
                            <h1 className="text-xl font-semibold text-indigo-700">Made by Nithan, enjoy!</h1>
                            <div className="flex justify-center items-center space-x-4 mt-4 flex-col">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Your candidate number"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        className="w-64 px-4 py-2 bg-white text-gray-800 placeholder-gray-600 border
                                    border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mx-1"
                                    />
                                    <button
                                        onClick={loadExams}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 mx-1"
                                    >
                                        Load Exams
                                    </button>
                                </div>
                                <p className="text-sm text-gray-700 flex items-center mt-1">*Candidate number used for
                                    exam clashes</p>
                            </div>
                        </div>

                        {allExams.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800">Select Your Exams</h2>
                                {grouped.map((g, i) => (
                                    <div key={i} className={i > 0 ? 'mt-6' : ''}>
                                        <div className="flex flex-wrap gap-3">
                                            {g.items.map((s, j) => (
                                                <label key={j}
                                                       className="inline-flex items-center space-x-2 px-3 py-2 bg-white rounded shadow-sm border hover:bg-gray-100 cursor-pointer">
                                                    <input type="checkbox" checked={selectedSubjects.has(s)}
                                                           onChange={() => toggleSub(s)}
                                                           className="form-checkbox h-5 w-5 text-indigo-600"/>
                                                    <span className="text-gray-800 font-medium">{s}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="text-right">
                                    <button onClick={() => setView('cards')}
                                            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">Show
                                        Cards
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {view === 'cards' && (
                    <>
                        <button onClick={() => setView('select')}
                                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-5 h-5"/><span>Back</span>
                        </button>
                        <h2 className="text-2xl font-semibold text-gray-800">Your Exam Cards</h2>
                        <div ref={cardsRef} className="flex flex-wrap justify-center gap-6">
                            {Array.from(selectedSubjects).flatMap(subj => getExams(subj).map(ex => {
                                const special = ex.students.includes(code);
                                const hasET = !!ex.etFinish;
                                const finish = etSelected[ex.id] && hasET ? ex.etFinish : ex.finish;
                                return (
                                    <div key={ex.id + subj}
                                         className="relative w-96 bg-white rounded-lg shadow-lg p-5 border-l-4"
                                         style={{borderColor: '#6366f1'}}>
                                        <h3 className="text-lg font-bold text-indigo-600 mb-2">{ex.subject}</h3>
                                        <p className="text-sm text-gray-700 flex items-center mb-1"><Calendar
                                            className="w-4 mr-1 text-indigo-600"/>{new Date(ex.date).toLocaleDateString('en-GB')}
                                        </p>
                                        <p className="text-sm text-gray-700 flex items-center mb-1"><Clock
                                            className="w-4 mr-1 text-indigo-600"/>{ex.start} – {finish}</p>
                                        <p className="text-sm text-gray-700 flex items-center whitespace-pre-line"><MapPin
                                            className="w-4 mr-1 text-indigo-600"/>{ex.venue}</p>
                                        <div className="absolute bottom-3 right-3 flex flex-col items-end space-y-1">
                                            {special && (
                                                <span
                                                    className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                                                    Updated Time
                                                </span>
                                            )}
                                            {hasET && (
                                                <label className="inline-flex items-center text-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!etSelected[ex.id]}
                                                        onChange={e => setEtSelected(p => ({
                                                            ...p,
                                                            [ex.id]: e.target.checked
                                                        }))}
                                                        className="h-4 w-4 mr-1"
                                                        style={{accentColor: '#4f46e5'}}
                                                    />
                                                    <span>Extra Time</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            }))}
                        </div>
                        {hasAnySpecial &&
                            <p className="mt-6 text-red-600 font-bold">
                                *Your updated exam time due to clashes - check emails for FCS details though.
                            </p>}
                        <p className="text-orange-500 font-bold">
                            Even if there shouldn't be any mistakes, I don't take any responsibility for any errors in the data. Please verify all details are fully correct.
                        </p>
                        <div className="mt-6 flex justify-center gap-4">
                            <button onClick={downloadPDF}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Download
                                PDF
                            </button>
                            <button onClick={downloadICS}
                                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Export to
                                Calendar
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
