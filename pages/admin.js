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
        <div style={{ padding: 20 }}>
            <h1>Upload Exams XLSX</h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <label>
                    Category:
                    <select name="category" style={{ marginLeft: 8 }}>
                        <option value="asal">AS/AL</option>
                        <option value="igcse">IGCSE</option>
                    </select>
                </label>
                <input type="file" name="file" accept=".xlsx" required />
                <button type="submit" style={{ marginLeft: 10 }}>
                    Upload
                </button>
            </form>
            {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
        </div>
    );
}
