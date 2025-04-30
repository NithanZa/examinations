// pages/admin.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { useState } from "react";

export async function getServerSideProps({ req, res }) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return {
            redirect: {
                destination: "/api/auth/signin?callbackUrl=/admin",
                permanent: false,
            },
        };
    }
    return { props: {} };
}

export default function Admin() {
    const [msg, setMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        setMsg(data.message);
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-indigo-400 p-10 rounded-4xl">
                <h1 className="text-2xl justify-self-start m-2">Upload Exams XLSX</h1>
                <form onSubmit={handleSubmit} encType="multipart/form-data" style={{flexDirection: 'column', display: 'flex', gap: '8px'}}>
                    <label>
                        Category:
                        <select name="category" style={{ marginLeft: 8 }}>
                            <option value="igcse">IGCSE</option>
                            <option value="asal">AS/AL</option>
                        </select>
                    </label>
                    <input type="file" name="file" accept=".xlsx" required className="bg-blue-600 rounded-lg p-1" />
                    <button type="submit" className="bg-violet-600 rounded-lg p-1">
                        Upload
                    </button>
                </form>
                {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
            </div>
        </div>
    );
}
