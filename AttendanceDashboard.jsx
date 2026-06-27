import React, { useState, useEffect } from 'react';
import { calculateAttendanceMetrics } from '../utils/attendanceEngine';
import collegeBgImage from '../assets/college.jpg'; 

export default function AttendanceDashboard() {
  const CONSTANT_TOTAL_CLASSES = 450;
  const API_BASE_URL = 'https://mca-attendance-backend.onrender.com/api';
  // 🏛️ DYNAMIC STATE HOOKS CONNECTED TO BACKEND
  const [students, setStudents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');

  // 🔄 FETCH ALL RECORDS FROM BACKEND ENGINE ON COMPONENT MOUNT
  const fetchStudentsFromBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error("❌ Failed streaming backend dataset:", err);
    }
  };

  useEffect(() => {
    fetchStudentsFromBackend();
  }, []);

  // 🔒 AUTH HANDLER VIA BACKEND ENDPOINT
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.success) {
        setIsAdmin(true);
        setShowLoginModal(false);
        setLoginError('');
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.error || '❌ Invalid Credentials!');
      }
    } catch (err) {
      setLoginError('❌ Auth server unreachable!');
    }
  };

  // ＋ ADD PROFILE VIA POST BACKEND CHANNEL
  const addStudent = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (response.ok) {
        fetchStudentsFromBackend(); // Live reload data sync
        setNewName('');
      }
    } catch (err) {
      console.error("❌ Add profile request failed:", err);
    }
  };

  // 📝 OVERWRITE ATTENDANCE RECORD VIA PUT CHANNEL
  const updateStudentAttendance = async (id, value) => {
    const numericValue = Math.max(0, parseInt(value) || 0);
    const cappedAttended = numericValue > CONSTANT_TOTAL_CLASSES ? CONSTANT_TOTAL_CLASSES : numericValue;

    // Optimistic local state UI updates instantly
    setStudents(students.map(s => s.id === id ? { ...s, attended: cappedAttended } : s));

    try {
      await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: cappedAttended })
      });
    } catch (err) {
      console.error("❌ Attendance logging overwrite failed:", err);
    }
  };

  // ✕ REMOVE STUDENT FROM DISK LOGS VIA DELETE CHANNEL
  const removeStudent = async (id) => {
    if (window.confirm("Are you sure you want to delete this student profile from database?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchStudentsFromBackend(); // Live clean reload
        }
      } catch (err) {
        console.error("❌ Delete operation tracking failed:", err);
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#0f172a', padding: '0 0 40px 0', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 🏛️ ULTRA STABLE HEADER */}
      <div style={{ width: '100%', height: '260px', backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.9)), url(${collegeBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center 35%', display: 'flex', alignItems: 'flex-end', padding: '0 30px 30px 30px', boxSizing: 'border-box', marginBottom: '35px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '32px', fontWeight: '800', textShadow: '0 3px 8px rgba(0,0,0,0.7)', letterSpacing: '-0.5px' }}>📊 MCA Attendance Management Portal</h1>
            <p style={{ color: '#cbd5e1', margin: '0', fontSize: '15px', fontWeight: '500', textShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>
              Current Context: <strong style={{ color: isAdmin ? '#34d399' : '#60a5fa' }}>{isAdmin ? "⚡ ADMIN OPERATIONAL MODE" : "👤 STUDENT GENERAL VIEW (Read Only)"}</strong>
            </p>
          </div>
          {isAdmin ? (
            <button onClick={() => setIsAdmin(false)} style={{ background: '#f87171', color: '#7f1d1d', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}>🔒 Log Out Admin</button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>🔑 Admin Login</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', padding: '30px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
          
          <div style={{ marginBottom: '25px' }}>
            <input type="text" placeholder="🔍 Instant Filter Student profile roster by Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '14px 20px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', fontSize: '15px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {isAdmin && (
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Management</h4>
              <form onSubmit={addStudent} style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter Full Student Name..." value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: '12px 16px', flex: '1', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', fontSize: '14px', color: '#ffffff' }} />
                <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>＋ Add Profile</button>
              </form>
            </div>
          )}

          <h3 style={{ color: '#ffffff', marginBottom: '18px', fontWeight: '700', fontSize: '18px' }}>📈 Master Attendance Analytics Sheet</h3>
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.25)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#f8fafc', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '18px' }}>Student Name</th>
                  <th style={{ padding: '18px', width: '180px' }}>Classes Attended</th>
                  <th style={{ padding: '18px', width: '180px' }}>Total Classes (Fixed)</th>
                  <th style={{ padding: '18px', width: '130px' }}>Percentage</th>
                  <th style={{ padding: '18px', width: '150px' }}>Status</th>
                  <th style={{ padding: '18px' }}>75% Metric Target Prediction</th>
                  {isAdmin && <th style={{ padding: '18px', textAlign: 'center', width: '80px' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: '35px', textAlign: 'center', color: '#94a3b8' }}>No records streamed from backend memory server.</td></tr>
                ) : (
                  filteredStudents.map((s) => {
                    const currentTotal = s.total || CONSTANT_TOTAL_CLASSES;
                    const m = calculateAttendanceMetrics(s.attended, currentTotal);
                    const badgeStyle = m.status === 'SAFE' ? { bg: 'rgba(16, 185, 129, 0.18)', text: '#34d399', border: '1px solid rgba(16,185,129,0.25)' } : m.status === 'CONDONATION' ? { bg: 'rgba(245, 158, 11, 0.18)', text: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' } : { bg: 'rgba(239, 68, 68, 0.18)', text: '#f87171', border: '1px solid rgba(239,68,68,0.25)' };

                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(255, 255, 255, 0.005)' }}>
                        <td style={{ padding: '18px', color: '#ffffff', fontWeight: '600' }}>{s.name}</td>
                        <td style={{ padding: '18px' }}>
                          {isAdmin ? (
                            <input type="number" value={s.attended} max={CONSTANT_TOTAL_CLASSES} onChange={e => updateStudentAttendance(s.id, e.target.value)} style={{ width: '100px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '14px', fontWeight: '700', color: '#ffffff', textAlign: 'center' }} />
                          ) : (
                            <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{s.attended} Periods</span>
                          )}
                        </td>
                        <td style={{ padding: '18px', fontWeight: '600', color: '#94a3b8' }}>{CONSTANT_TOTAL_CLASSES} Classes</td>
                        <td style={{ padding: '18px', fontWeight: '800', color: m.currentPercentage >= 75 ? '#34d399' : '#f87171', fontSize: '16px' }}>{m.currentPercentage}%</td>
                        <td style={{ padding: '18px' }}><span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', background: badgeStyle.bg, color: badgeStyle.text, border: badgeStyle.border }}>{m.status}</span></td>
                        <td style={{ padding: '18px', fontSize: '14px', fontWeight: '600' }}>
                          {m.status === 'SAFE' ? (
                            <span style={{ color: '#34d399' }}>🟩 Safe: Can bunk next <strong>{m.allowedAbsencesBuffer}</strong> classes.</span>
                          ) : (
                            <span style={{ color: '#f87171' }}>⚠️ Shortage: Must attend next <strong>{m.safeClassesRequired}</strong> periods.</span>
                          )}
                        </td>
                        {isAdmin && <td style={{ padding: '18px', textAlign: 'center' }}><button onClick={() => removeStudent(s.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}>✕</button></td>}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Login Authentication Gateway Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '380px' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#ffffff' }}>🔐 Admin Authorization</h3>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="User ID" required style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff' }} />
              {loginError && <p style={{ color: '#f87171', fontSize: '13px', margin: '0', fontWeight: 'bold' }}>{loginError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowLoginModal(false); setLoginError(''); }} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Verify</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}