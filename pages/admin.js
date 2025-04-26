// /pages/admin.js
import { useState } from 'react';

export default function Admin() {
    const [msg, setMsg] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        const file = e.target.file.files[0];
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const body = await res.json();
        setMsg(body.message);
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Upload Exams XLSX</h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <input type="file" name="file" accept=".xlsx" required />
                <button type="submit" style={{ marginLeft: 10 }}>Upload</button>
            </form>
            {msg && <p>{msg}</p>}
        </div>
    );
}
