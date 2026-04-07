import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Film } from 'lucide-react';

/* ─── Film grain via canvas ─────────────────────────────────── */
const useFilmGrain = (ref) => {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let id;
    const tick = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const img  = ctx.createImageData(canvas.width, canvas.height);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 14;
      }
      ctx.putImageData(img, 0, 0);
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, []);
};

/* ─── Scrolling film strip ───────────────────────────────────── */
const FilmStrip = ({ pos }) => (
  <div style={{
    position:'absolute', [pos]:0, left:0, right:0, height:56,
    background:'#050508',
    borderTop:    pos==='bottom' ? '1px solid #1a1f2e' : 'none',
    borderBottom: pos==='top'    ? '1px solid #1a1f2e' : 'none',
    overflow:'hidden', zIndex:6,
  }}>
    <div style={{
      display:'flex', gap:10, alignItems:'center', height:'100%',
      padding:'0 10px',
      animation:'filmScroll 14s linear infinite',
      width:'max-content',
    }}>
      {[...Array(40)].map((_,i) => (
        <div key={i} style={{
          width:34, height:40, flexShrink:0,
          border:'1.5px solid #1e2535',
          borderRadius:3,
          background: i%7===0
            ? 'rgba(220,38,38,0.1)'
            : i%3===0
              ? 'rgba(255,255,255,0.015)'
              : 'transparent',
          boxShadow: i%7===0 ? 'inset 0 0 8px rgba(220,38,38,0.15)' : 'none',
        }} />
      ))}
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────── */
const NotFoundCinema = () => {
  const navigate   = useNavigate();
  const grainRef   = useRef(null);
  const [mounted, setMounted] = useState(false);
  useFilmGrain(grainRef);

  useEffect(() => {
    // Staggered mount for entrance animation
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight:'100vh',
      background:'#07090f',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden',
      fontFamily:"'Playfair Display', Georgia, serif",
      color:'#fff', textAlign:'center',
      padding:'80px 2rem',
    }}>

      {/* Grain */}
      <canvas ref={grainRef} style={{
        position:'absolute', inset:0,
        pointerEvents:'none', zIndex:2, opacity:0.55,
      }} />

      {/* Scanlines */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:2,
        backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 3px)',
      }} />

      {/* Vignette */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:3,
        background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
      }} />

      {/* Spotlight cone */}
      <div style={{
        position:'absolute', top:'-15%', left:'50%',
        transform:'translateX(-50%)',
        width:800, height:700,
        background:'radial-gradient(ellipse at top, rgba(200,30,30,0.18) 0%, rgba(150,10,10,0.06) 45%, transparent 72%)',
        pointerEvents:'none', zIndex:1,
      }} />

      {/* Side ambient glows */}
      <div style={{
        position:'absolute', left:'-10%', top:'30%',
        width:400, height:400,
        background:'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:1,
      }} />
      <div style={{
        position:'absolute', right:'-10%', top:'40%',
        width:400, height:400,
        background:'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:1,
      }} />

      <FilmStrip pos="top" />
      <FilmStrip pos="bottom" />

      {/* ── Content ── */}
      <div style={{
        position:'relative', zIndex:10,
        maxWidth:680, width:'100%',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition:'opacity 0.8s ease, transform 0.8s ease',
      }}>

        {/* Brand pill */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:999,
          padding:'5px 18px',
          marginBottom:'2.8rem',
          fontFamily:"'Courier New', monospace",
          fontSize:'0.68rem', letterSpacing:'0.28em',
          color:'#64748b', textTransform:'uppercase',
          backdropFilter:'blur(10px)',
        }}>
          <span style={{
            width:7, height:7, borderRadius:'50%',
            background:'#dc2626',
            boxShadow:'0 0 8px rgba(220,38,38,0.9)',
            display:'inline-block',
            animation:'dot 1.8s ease-in-out infinite',
          }} />
          <span><span style={{color:'#ef4444'}}>MCP</span> Cinema Systems</span>
        </div>

        {/* 404 block */}
        <div style={{ position:'relative', display:'inline-block', marginBottom:'0.5rem' }}>

          {/* Outline ghost */}
          <div style={{
            position:'absolute', top:6, left:6,
            fontSize:'clamp(110px,20vw,210px)',
            fontWeight:900, lineHeight:1, letterSpacing:'-0.04em',
            color:'transparent',
            WebkitTextStroke:'1.5px rgba(220,38,38,0.18)',
            userSelect:'none', pointerEvents:'none',
          }}>404</div>

          {/* Main number */}
          <h1 style={{
            margin:0,
            fontSize:'clamp(110px,20vw,210px)',
            fontWeight:900, lineHeight:1, letterSpacing:'-0.04em',
            background:'linear-gradient(165deg, #ffffff 20%, #9ca3af 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            position:'relative',
            animation:'flicker 9s ease-in-out infinite',
            filter:'drop-shadow(0 2px 40px rgba(255,255,255,0.06))',
          }}>404</h1>

          {/* ✂ CUT! */}
          <div style={{
            position:'absolute', top:-10, right:-28,
            background:'linear-gradient(135deg,#dc2626,#b91c1c)',
            color:'#fff',
            fontFamily:"'Courier New', monospace",
            fontWeight:900, fontSize:'0.85rem',
            letterSpacing:'0.12em',
            padding:'4px 13px',
            borderRadius:5,
            transform:'rotate(13deg)',
            boxShadow:'0 0 22px rgba(220,38,38,0.55), 0 4px 14px rgba(0,0,0,0.6)',
            animation:'badge 2.2s ease-in-out infinite',
            whiteSpace:'nowrap',
          }}>✂ CUT!</div>
        </div>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'1.4rem auto 2rem', maxWidth:260, justifyContent:'center' }}>
          <div style={{ flex:1, height:1, background:'linear-gradient(to right, transparent, rgba(220,38,38,0.6))' }} />
          <div style={{ width:4, height:4, borderRadius:'50%', background:'#dc2626', boxShadow:'0 0 6px #dc2626' }} />
          <div style={{ flex:1, height:1, background:'linear-gradient(to left, transparent, rgba(220,38,38,0.6))' }} />
        </div>

        {/* Heading */}
        <h2 style={{
          margin:'0 0 0.9rem',
          fontSize:'clamp(1.35rem, 3.5vw, 2rem)',
          fontWeight:700, lineHeight:1.3, letterSpacing:'-0.01em',
          color:'#f1f5f9',
        }}>
          ขออภัย! ฟิล์มขาดตอน
          <span style={{
            display:'inline-block', marginLeft:10,
            fontSize:'0.7em', fontWeight:400,
            color:'#475569', fontFamily:"'Courier New', monospace",
            letterSpacing:'0.05em',
          }}>(ไม่พบหน้านี้)</span>
        </h2>

        {/* Body text */}
        <p style={{
          fontFamily:"'Courier New', monospace",
          fontSize:'0.9rem', color:'#475569',
          lineHeight:1.85, maxWidth:480,
          margin:'0 auto 2.8rem',
          letterSpacing:'0.015em',
        }}>
          ดูเหมือนว่าฉากที่คุณกำลังตามหาจะถูก{' '}
          <span style={{color:'#f87171', fontStyle:'italic'}}>ตัดออกจากเวอร์ชันฉายจริง</span>{' '}
          หรือไม่เคยมีอยู่ในโปรแกรมของเราเลย<br/>
          กลับไปเริ่มต้นใหม่ที่หน้าหลักกันเถอะครับ
        </p>

        {/* Buttons */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Btn primary onClick={() => navigate('/')} icon={<Home size={16}/>} label="กลับหน้าหลัก" />
          <Btn onClick={() => navigate('/movies')} icon={<Film size={16} style={{color:'#ef4444'}}/>} label="เช็ครอบหนังวันนี้" />
        </div>

        {/* Metadata bar */}
        <div style={{
          marginTop:'3.5rem',
          display:'flex', gap:24, justifyContent:'center',
          fontFamily:"'Courier New', monospace",
          fontSize:'0.6rem', letterSpacing:'0.18em',
          color:'#1e293b', textTransform:'uppercase',
          userSelect:'none',
        }}>
          {['ERR: 404','REEL: NULL','FRAME: ∅','STATUS: CUT'].map((t,i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes dot     { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(220,38,38,.9)} 50%{opacity:.35;box-shadow:0 0 3px rgba(220,38,38,.4)} }
        @keyframes flicker { 0%,93%,100%{opacity:1} 94%{opacity:.82} 95%{opacity:1} 97%{opacity:.65} 98%{opacity:1} }
        @keyframes badge   { 0%,100%{transform:rotate(13deg) scale(1)} 50%{transform:rotate(13deg) scale(1.07)} }
        @keyframes filmScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
};

/* ─── Reusable button ────────────────────────────────────────── */
const Btn = ({ primary, onClick, icon, label }) => {
  const [hov, setHov] = useState(false);
  const base = {
    display:'flex', alignItems:'center', gap:8,
    padding:'13px 28px',
    fontFamily:"'Courier New', monospace",
    fontWeight:700, fontSize:'0.85rem',
    letterSpacing:'0.1em', textTransform:'uppercase',
    borderRadius:4, cursor:'pointer',
    transition:'all 0.22s ease',
    transform: hov ? 'translateY(-3px)' : 'translateY(0)',
  };
  const style = primary ? {
    ...base,
    background: hov ? '#ef4444' : '#dc2626',
    color:'#fff', border:'none',
    boxShadow: hov
      ? '0 0 40px rgba(220,38,38,0.6), 0 8px 20px rgba(0,0,0,0.4)'
      : '0 0 24px rgba(220,38,38,0.35), 0 4px 12px rgba(0,0,0,0.3)',
  } : {
    ...base,
    background: hov ? 'rgba(255,255,255,0.07)' : 'transparent',
    color:'#cbd5e1', border:'1px solid',
    borderColor: hov ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
    boxShadow: hov ? '0 8px 20px rgba(0,0,0,0.3)' : 'none',
    backdropFilter:'blur(8px)',
  };
  return (
    <button style={style} onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      {icon}{label}
    </button>
  );
};

export default NotFoundCinema;