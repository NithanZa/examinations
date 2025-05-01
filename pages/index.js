// pages/index.js
import {useRef, useState, useEffect} from 'react';
import {ArrowLeft, Calendar, Clock, MapPin} from 'lucide-react';

export default function Home() {
    const [acknowledged, setAcknowledged] = useState(false);
    const [ackSubmitted, setAckSubmitted] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('acknowledged') === 'true') {
            setAckSubmitted(true);
        }
    }, []);

    const [code, setCode] = useState('');
    const [allExams, setAllExams] = useState([]);
    const [selectedSubjects, setSelected] = useState(new Set());
    const [etSelected, setEtSelected] = useState({});
    const [view, setView] = useState('select');
    const [category, setCategory] = useState('igcse');
    const cardsRef = useRef(null);

    // Persist candidate code, selected exams, extra-time ticks, and view per category
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // load persisted category, view, code, and per-category selections
        const cat = localStorage.getItem('examCategory') || 'igcse';
        setCategory(cat);

        fetchExams(cat)

        const savedCode = localStorage.getItem('candidateCode') || '';
        setCode(savedCode);

        const savedView = localStorage.getItem('examView') || 'select';
        setView(savedView);

        // per-category selected subjects
        const subjKey = `selectedSubjects_${cat}`;
        const savedSubjects = localStorage.getItem(subjKey);
        if (savedSubjects) {
            try {
                setSelected(new Set(JSON.parse(savedSubjects)));
            } catch {
            }
        }

        // per-category extra-time flags
        const etKey = `etSelected_${cat}`;
        const savedET = localStorage.getItem(etKey);
        if (savedET) {
            try {
                setEtSelected(JSON.parse(savedET));
            } catch {
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        // persist code, category, view, selections, and extra-time
        localStorage.setItem('candidateCode', code);
        localStorage.setItem('examCategory', category);
        localStorage.setItem('examView', view);
        localStorage.setItem(
            `selectedSubjects_${category}`,
            JSON.stringify(Array.from(selectedSubjects))
        );
        localStorage.setItem(
            `etSelected_${category}`,
            JSON.stringify(etSelected)
        );
    }, [code, category, view, selectedSubjects, etSelected]);

    const fetchExams = (cat) =>
        fetch(`/api/exams?category=${cat}`)
            .then(r => r.json())
            .then(setAllExams);

    const grouped = Array.from(new Set(allExams.map(e => e.subject))).sort()
        .reduce((acc, subj) => {
            const key = subj.split(' ')[0];
            const grp = acc.find(g => g.key === key);
            grp ? grp.items.push(subj) : acc.push({key, items: [subj]});
            return acc;
        }, []);

    const toggleSub = subj => setSelected(prev => {
        const nxt = new Set(prev);
        nxt.has(subj) ? nxt.delete(subj) : nxt.add(subj);
        return nxt;
    });

    const getExams = subj => {
        const special = allExams.filter(e => e.subject === subj && e.students.includes(code));
        return special.length
            ? special
            : allExams.filter(e => e.subject === subj && e.students.length === 0);
    };

    const hasAnySpecial = Array.from(selectedSubjects).some(subj =>
        allExams.some(e => e.subject === subj && e.students.includes(code))
    );

    return (
        <div>
            {ackSubmitted && (
                <div className="min-h-screen p-8 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
                    <div
                        className="max-w-7xl mx-auto bg-white bg-opacity-70 backdrop-blur-md rounded-2xl p-6 space-y-6">

                        {view === 'select' && (
                            <>
                                <div className="text-center space-y-3">
                                    <h1 className="text-4xl font-bold text-indigo-700 mt-2">Exam Timetable
                                        Beautifier</h1>
                                    <h2 className="text-xl font-semibold text-indigo-700">Nithan from SC IT commitee,
                                        enjoy!</h2>
                                    <div className="flex justify-center gap-4 mb-4">
                                        {['igcse', 'asal'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    setCategory(cat);
                                                    fetchExams(cat);
                                                    // restore their previous ticks for this category:
                                                    const ss = localStorage.getItem(`selectedSubjects_${cat}`);
                                                    setSelected(ss ? new Set(JSON.parse(ss)) : new Set());
                                                    const et = localStorage.getItem(`etSelected_${cat}`);
                                                    setEtSelected(et ? JSON.parse(et) : {});
                                                }}
                                                className={`px-4 py-2 rounded-sm ${
                                                    category === cat ? 'bg-indigo-600 text-white border-4 border-indigo-200' : 'bg-gray-200 text-black'
                                                }`}
                                            >
                                                {cat.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                                        <input
                                            type="text"
                                            placeholder="Your candidate number"
                                            value={code}
                                            onChange={e => setCode(e.target.value)}
                                            className="w-64 px-4 py-2 bg-white text-gray-800 placeholder-gray-600 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">*Candidate number used for exam
                                        clashes</p>
                                </div>

                                {allExams.length > 0 && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-xl font-semibold text-gray-800">Select
                                            Your {category.toUpperCase()} Exams</h3>
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
                                                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
                                                Show Schedule
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
                                <h3 className="text-2xl font-semibold text-gray-800">Your Exam Cards</h3>
                                <div ref={cardsRef} className="grid grid-cols-3 gap-6 p-4">
                                    {Array.from(selectedSubjects).flatMap(subj =>
                                            getExams(subj).map(ex => {
                                                const special = ex.students.includes(code);
                                                const hasET = !!ex.etFinish;
                                                const finish = etSelected[ex.id] && hasET ? ex.etFinish : ex.finish;
                                                return (
                                                    <div key={ex.id + subj}
                                                         className="flex flex-col justify-between w-full bg-white rounded-lg shadow-lg p-5 border-l-4"
                                                         style={{borderColor: special ? '#e11d48' : '#6366f1'}}>
                                                        <div>
                                                            <h4 className="text-lg font-bold text-indigo-600 mb-2">{ex.subject}</h4>
                                                            <p className="text-sm text-gray-700 flex items-center mb-1">
                                                                <Calendar
                                                                    className="w-4 h-4 mr-1 text-indigo-600"/>{new Date(ex.date).toLocaleDateString('en-GB')}
                                                            </p>
                                                            <p className="text-sm text-gray-700 flex items-center mb-1">
                                                                <Clock
                                                                    className="w-4 h-4 mr-1 text-indigo-600"/>{ex.start} – {finish}
                                                            </p>
                                                            <p className="text-sm text-gray-700 flex items-center mb-1">
                                                                <MapPin className="w-4 h-4 mr-1 text-indigo-600"/>{ex.venue}
                                                            </p>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-4">
                                                            {special && (
                                                                <span
                                                                    className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                            Updated Clash Time
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
                                            })
                                    )}
                                </div>
                                {hasAnySpecial &&
                                    <p className="mt-6 text-red-600 font-bold">*Your updated exam time due to clashes -
                                        check
                                        emails for FCS details though.</p>}
                                <p className="text-orange-500 font-bold">Even if there shouldn't be any mistakes, I
                                    don't take
                                    any responsibility for any errors in the data. Please verify all details are fully
                                    correct.</p>
                                <div className="mt-6 flex justify-center gap-4">
                                    {/* Replace your old button with this anchor */}
                                    <a
                                        href="/subscribe"
                                        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Add to Calendar
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!ackSubmitted && (
                <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-amber-200">Before you continue…</h2>
                    <label className="inline-flex items-center space-x-2 mb-4">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={e => setAcknowledged(e.target.checked)}
                            className="h-5 w-5 text-indigo-600"
                        />
                        <span className="text-gray-800">
                    I confirm I’ve verified all details and understand this is my responsibility.
                </span>
                    </label>
                    <button
                        onClick={() => {
                            setAckSubmitted(true)
                            localStorage.setItem('acknowledged', 'true')
                        }}
                        disabled={!acknowledged}
                        className={`px-6 py-2 rounded ${
                            acknowledged
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        Proceed
                    </button>
                </div>
            )}
        </div>
    );
}
