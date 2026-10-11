import { useEffect } from 'react';
export default function LoginPage() {
    useEffect(() => { window.location.replace('/login?product=mlynq'); }, []);
    return <p role="status" style={{padding:32}}>Opening Mlynq email sign-in…</p>;
}
