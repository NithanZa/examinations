// pages/print.js
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import 'tailwindcss/tailwind.css'

export default function Print() {
    const { query } = useRouter()
    const code      = query.code || ''
    const [exams, setExams] = useState([])

    useEffect(() => {
        if (!code) return
        fetch(`/api/exams?all=true&studentCode=${code}`)
            .then(r => r.json())
            .then(setExams)
    }, [code])

    return (
        <div className="p-8 bg-white">
            <h1 className="text-2xl font-bold mb-6">Your Exam Cards</h1>
            <div className="grid grid-cols-3 gap-6">
                {exams.map(ex => {
                    const special = ex.students.includes(code)
                    const finish  = /* same ET logic */
                    return (
                        <div
                            key={ex.id}
                            className="relative w-full bg-white rounded-lg shadow-lg p-5 border-l-4"
                            style={{ borderColor: special ? '#e11d48' : '#6366f1' }}
                        >
                            {special && (
                                <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                  Updated Time
                </span>
                            )}
                            <h3 className="text-lg font-bold text-indigo-600 mb-2">{ex.subject}</h3>
                            <p className="text-sm text-gray-700 mb-1">
                                {new Date(ex.date).toLocaleDateString('en-GB')}
                            </p>
                            <p className="text-sm text-gray-700 mb-1">
                                {ex.start} – {finish}
                            </p>
                            <p className="text-sm text-gray-700 mb-1">
                                Session: {ex.session||'-'}
                            </p>
                            <p className="text-sm text-gray-700">{ex.venue}</p>
                            {ex.etFinish && (
                                <div className="absolute bottom-3 right-3 inline-flex items-center text-gray-800">
                                    <input type="checkbox" checked readOnly className="h-4 w-4 mr-1" />
                                    <span>Extra Time</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
