// pages/subscribe.js
import { useState, useEffect } from 'react';

export default function Subscribe() {
    const [apiUrl, setApiUrl] = useState('');

    useEffect(() => {
        // Only run in the browser
        if (typeof window === 'undefined') return;

        // Grab everything we stored before
        const code    = localStorage.getItem('candidateCode') || '';
        const category = localStorage.getItem('examCategory') || 'asal';
        const subjects = JSON.parse(
            localStorage.getItem(`selectedSubjects_${category}`) || '[]'
        );
        const etMap   = JSON.parse(
            localStorage.getItem(`etSelected_${category}`) || '{}'
        );

        // Construct the ICS-API URL
        const base = window.location.origin;
        const url =
            `${base}/api/export.ics?` +
            `code=${encodeURIComponent(code)}` +
            `&category=${encodeURIComponent(category)}` +
            `&subjects=${encodeURIComponent(JSON.stringify(subjects))}` +
            `&et=${encodeURIComponent(JSON.stringify(etMap))}`;

        setApiUrl(url);
    }, []);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(apiUrl);
            alert('Calendar URL copied!');
        } catch {
            alert('Copy failed');
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-purple-50 text-indigo-900">
            <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4">Add Exams to Calendar</h1>

                <div className="mb-6">
                    <a
                        href={apiUrl}
                        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                        download="exams.ics"
                    >
                        Download ICS File
                    </a>
                </div>

                <section className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Google Calendar (Import)</h2>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Open Google Calendar on desktop.</li>
                        <li>Settings → Import & export → choose the downloaded <code>exams.ics</code>.</li>
                        <li>Select “Import” and pick which calendar to add to.</li>
                    </ol>
                </section>

                <section className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">macOS Calendar (Subscribe)</h2>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Open the Calendar app.</li>
                        <li>File → New Calendar Subscription…</li>
                        <li>Paste the ICS URL below and click “Subscribe.”</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-2">iPhone / iPad (Subscribe)</h2>
                    <ol className="list-decimal list-inside space-y-1 mb-3">
                        <li>Settings → Calendar → Accounts → Add Account → Other.</li>
                        <li>Tap “Add Subscribed Calendar.”</li>
                        <li>Paste the ICS URL below → Next → Save.</li>
                    </ol>
                    <div className="flex max-w-xl">
                        <input
                            type="text"
                            readOnly
                            value={apiUrl}
                            className="flex-1 px-3 py-2 border rounded-l"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="bg-gray-200 px-4 rounded-r hover:bg-gray-300"
                        >
                            Copy
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
