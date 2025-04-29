// pages/index.js
import { useRef, useState, useEffect } from 'react';
import { createEvents } from 'ics';
import { ArrowLeft, Calendar, Clock, MapPin, Tag } from 'lucide-react';

export default function Home() {
    const [code, setCode] = useState('');
    const [allExams, setAllExams] = useState([]);
    const [selectedSubjects, setSelected] = useState(new Set());
    const [etSelected, setEtSelected] = useState({});
    const [view, setView] = useState('select');
    const cardsRef = useRef(null);

    // Persist candidate code, selected exams, and extra-time ticks
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCode = localStorage.getItem('candidateCode');
            if (savedCode) {
                setCode(savedCode);
                fetchExams(savedCode);
            }
            const savedSubjects = localStorage.getItem('selectedSubjects');
            if (savedSubjects) {
                try { setSelected(new Set(JSON.parse(savedSubjects))); } catch {}
            }
            const savedET = localStorage.getItem('etSelected');
            if (savedET) {
                try { setEtSelected(JSON.parse(savedET)); } catch {}
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('candidateCode', code);
            localStorage.setItem('selectedSubjects', JSON.stringify(Array.from(selectedSubjects)));
            localStorage.setItem('etSelected', JSON.stringify(etSelected));
        }
    }, [code, selectedSubjects, etSelected]);

    // fetch exams
    const fetchExams = async candidateCode => {
        if (!candidateCode.trim()) return;
        const res = await fetch(`/api/exams?all=true&studentCode=${candidateCode}`);
        const data = await res.json();
        setAllExams(data);
    };
    const loadExams = () => fetchExams(code);

    // grouping logic
    const subjects = Array.from(new Set(allExams.map(e => e.subject))).sort();
    const grouped = subjects.reduce((acc, subj) => {
        const key = subj.split(' ')[0];
        const grp = acc.find(g => g.key === key);
        if (grp) grp.items.push(subj);
        else acc.push({ key, items: [subj] });
        return acc;
    }, []);

    const toggleSub = subj => setSelected(prev => {
        const nxt = new Set(prev);
        nxt.has(subj) ? nxt.delete(subj) : nxt.add(subj);
        return nxt;
    });

    const parseTime = str => {
        const m = /^([0-9]{1,2})\.([0-9]{2})(am|pm)$/i.exec(str) || [];
        let h = +m[1], mm = +m[2], p = m[3]?.toLowerCase();
        if (p === 'pm' && h < 12) h += 12;
        if (p === 'am' && h === 12) h = 0;
        return { h, mm };
    };

    const getExams = subj => {
        const special = allExams.filter(e => e.subject === subj && e.students.includes(code));
        return special.length
            ? special
            : allExams.filter(e => e.subject === subj && e.students.length === 0);
    };

    const hasAnySpecial = Array.from(selectedSubjects).some(subj =>
        allExams.some(e => e.subject === subj && e.students.includes(code))
    );

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
                    start: [d.getFullYear(), d.getMonth()+1, d.getDate(), st.h, st.mm],
                    end:   [d.getFullYear(), d.getMonth()+1, d.getDate(), en.h, en.mm],
                    location: ex.venue,
                    description: ex.code
                });
            });
        });
        createEvents(events, (err, value) => {
            if (err) return;
            const blob = new Blob([value], { type: 'text/calendar' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'exams.ics';
            link.click();
        });
    };

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
            <div className="max-w-7xl mx-auto bg-white bg-opacity-70 backdrop-blur-md rounded-lg p-6 space-y-6">
                {/* SELECT VIEW */}
                {view === 'select' && (
                    <>
                        <div className="text-center space-y-3">
                            <h1 className="text-4xl font-bold text-indigo-700">AS/AL Exams Beautifier</h1>
                            <h2 className="text-xl font-semibold text-indigo-700">Made by Nithan, enjoy!</h2>
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                                <input
                                    type="text"
                                    placeholder="Your candidate number"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    className="w-64 px-4 py-2 bg-white text-gray-800 placeholder-gray-600 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={loadExams}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                                >Load Exams</button>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">*Candidate number used for exam clashes</p>
                        </div>
                        {allExams.length > 0 && (
                            <div className="mt-6 space-y-4">
                                <h3 className="text-xl font-semibold text-gray-800">Select Your Exams</h3>
                                {grouped.map((g,i) => (
                                    <div key={i} className={i>0?'mt-6':''}>
                                        <div className="flex flex-wrap gap-3">
                                            {g.items.map((s,j)=>(
                                                <label key={j} className="inline-flex items-center space-x-2 px-3 py-2 bg-white rounded shadow-sm border hover:bg-gray-100 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSubjects.has(s)}
                                                        onChange={()=>toggleSub(s)}
                                                        className="form-checkbox h-5 w-5 text-indigo-600"/>
                                                    <span className="text-gray-800 font-medium">{s}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="text-right">
                                    <button onClick={()=>setView('cards')} className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">Show Cards</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {/* CARDS VIEW */}
                {view==='cards' && (
                    <>
                        <button onClick={()=>setView('select')} className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-5 h-5"/><span>Back</span>
                        </button>
                        <h3 className="text-2xl font-semibold text-gray-800">Your Exam Cards</h3>
                        <div ref={cardsRef} className="grid grid-cols-3 gap-6 p-4">
                            {Array.from(selectedSubjects).flatMap(subj => getExams(subj).map(ex => {
                                const special = ex.students.includes(code);
                                const hasET = !!ex.etFinish;
                                const finish = etSelected[ex.id] && hasET ? ex.etFinish : ex.finish;
                                return (
                                    <div key={ex.id+subj} className="relative w-full bg-white rounded-lg shadow-lg p-5 border-l-4" style={{borderColor: special?'#e11d48':'#6366f1'}}>
                                        {special && <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Updated Time</span>}
                                        <h4 className="text-lg font-bold text-indigo-600 mb-2">{ex.subject}</h4>
                                        <p className="text-sm text-gray-700 flex items-center mb-1"><Calendar className="w-4 h-4 mr-1 text-indigo-600"/>{new Date(ex.date).toLocaleDateString('en-GB')}</p>
                                        <p className="text-sm text-gray-700 flex items-center mb-1"><Clock className="w-4 h-4 mr-1 text-indigo-600"/>{ex.start} – {finish}</p>
                                        <p className="text-sm text-gray-700 flex items-center mb-1"><Tag className="w-4 h-4 mr-1 text-indigo-600"/>Session: {ex.session||'-'}</p>
                                        <p className="text-sm text-gray-700 flex items-center mb-1"><MapPin className="w-4 h-4 mr-1 text-indigo-600"/>{ex.venue}</p>
                                        {hasET && (
                                            <label className="absolute bottom-3 right-3 inline-flex items-center text-gray-800">
                                                <input type="checkbox" checked={!!etSelected[ex.id]} onChange={e=>setEtSelected(p=>({...p,[ex.id]:e.target.checked}))} className="h-4 w-4 mr-1" style={{accentColor:'#4f46e5'}}/>
                                                <span>Extra Time</span>
                                            </label>
                                        )}
                                    </div>
                                );
                            }))}
                        </div>
                        {hasAnySpecial && <p className="mt-6 text-red-600 font-bold">*Your updated exam time due to clashes - check emails for FCS details though.</p>}
                        <p className="text-orange-500 font-bold">Even if there shouldn't be any mistakes, I don't take any responsibility for any errors in the data. Please verify all details are fully correct.</p>
                        <div className="mt-6 flex justify-center gap-4">
                            <button onClick={downloadICS} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Export to Calendar</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
