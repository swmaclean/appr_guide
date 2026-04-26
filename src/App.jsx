import { useState, useRef, useEffect, useCallback } from "react";
import { useDrive } from "./useDrive.js";

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0a1628;--sky:#2563eb;--accent:#f59e0b;--green:#10b981;
  --red:#ef4444;--white:#f8fafc;--muted:#94a3b8;
  --card:rgba(255,255,255,0.06);--border:rgba(255,255,255,0.1);
}
body{background:var(--navy);font-family:'DM Sans',sans-serif;color:var(--white);
  min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:20px}
.phone{width:390px;min-height:844px;
  background:linear-gradient(160deg,#0d1f3c 0%,#0a1628 60%,#06101e 100%);
  border-radius:48px;overflow:hidden;position:relative;
  box-shadow:0 40px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.08)}
.status-bar{height:44px;display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;font-size:12px;font-weight:500;position:relative}
.notch{width:120px;height:34px;background:#000;border-radius:0 0 20px 20px;
  position:absolute;top:0;left:50%;transform:translateX(-50%)}
.screen{padding:0 20px 100px;overflow-y:auto;max-height:780px}

/* shared */
.hero{padding:24px 0 20px;text-align:center}
.hero-icon{width:64px;height:64px;background:linear-gradient(135deg,var(--sky),#1e40af);
  border-radius:20px;display:flex;align-items:center;justify-content:center;
  margin:0 auto 16px;font-size:28px;box-shadow:0 8px 24px rgba(37,99,235,.4)}
.hero h1{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px}
.hero p{font-size:13px;color:var(--muted);line-height:1.5}
.sec-label{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--muted);
  letter-spacing:1.5px;text-transform:uppercase;margin:20px 0 10px}
.tip{background:linear-gradient(135deg,rgba(37,99,235,.2),rgba(16,185,129,.1));
  border:1px solid rgba(37,99,235,.3);border-radius:16px;padding:14px 16px;margin-bottom:12px;
  display:flex;align-items:flex-start;gap:10px}
.tip .ti{font-size:18px;flex-shrink:0}
.tip p{font-size:12px;line-height:1.5;color:#bfdbfe}
.tip strong{color:var(--white)}
.warn-box{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);
  border-radius:14px;padding:12px 14px;margin:10px 0;display:flex;gap:10px}
.warn-box p{font-size:12px;color:#fcd34d;line-height:1.5}
.info-box{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);
  border-radius:14px;padding:12px 14px;margin:10px 0;display:flex;gap:10px}
.info-box p{font-size:12px;color:#6ee7b7;line-height:1.5}
.dh{padding:16px 0 20px;display:flex;align-items:center;gap:12px}
.back{width:36px;height:36px;background:var(--card);border:1px solid var(--border);
  border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;flex-shrink:0}
.dt{font-family:'Syne',sans-serif;font-size:18px;font-weight:800}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;margin-top:6px}
.b-amber{background:rgba(245,158,11,.2);color:var(--accent)}
.b-green{background:rgba(16,185,129,.2);color:var(--green)}
.b-red{background:rgba(239,68,68,.2);color:var(--red)}
.b-blue{background:rgba(37,99,235,.2);color:#60a5fa}
.b-purple{background:rgba(139,92,246,.2);color:#a78bfa}

/* sit cards */
.sit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
.sit-card{background:var(--card);border:1px solid var(--border);border-radius:20px;
  padding:18px 14px;cursor:pointer;transition:all .2s;text-align:left}
.sit-card:active{transform:scale(.96)}
.sit-card:hover{background:rgba(255,255,255,.1)}
.sit-icon{font-size:26px;margin-bottom:10px;display:block}
.sit-card h3{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:4px;line-height:1.3}
.sit-card p{font-size:11px;color:var(--muted);line-height:1.4}
.sit-card.fw{grid-column:1/-1;display:flex;align-items:center;gap:14px}
.sit-card.fw .sit-icon{margin:0;font-size:30px}

/* steps */
.step-c{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;
  margin-bottom:10px;display:flex;gap:14px;align-items:flex-start}
.step-n{width:28px;height:28px;background:linear-gradient(135deg,var(--sky),#1e40af);
  border-radius:10px;display:flex;align-items:center;justify-content:center;
  font-family:'Syne',sans-serif;font-size:13px;font-weight:800;flex-shrink:0}
.step-t h4{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:4px}
.step-t p{font-size:12px;color:var(--muted);line-height:1.6}

/* comp table */
.comp-t{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin:12px 0}
.comp-h{padding:12px 16px;background:linear-gradient(90deg,rgba(37,99,235,.3),rgba(37,99,235,.1));
  font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#93c5fd;border-bottom:1px solid var(--border)}
.comp-r{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;
  border-bottom:1px solid var(--border);font-size:12px}
.comp-r:last-child{border-bottom:none}
.comp-r .lbl{color:var(--muted);flex:1}
.comp-r .amt{font-family:'Syne',sans-serif;font-weight:700;color:var(--accent);font-size:14px}

/* buttons */
.btn{width:100%;padding:16px;background:linear-gradient(135deg,var(--sky),#1e40af);border:none;
  border-radius:16px;color:white;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;
  cursor:pointer;margin-top:16px;box-shadow:0 8px 24px rgba(37,99,235,.35);transition:transform .15s}
.btn:active{transform:scale(.97)}
.btn.sec{background:var(--card);border:1px solid var(--border);box-shadow:none;margin-top:8px;font-size:13px}
.btn.red{background:linear-gradient(135deg,#dc2626,#991b1b);box-shadow:0 8px 24px rgba(220,38,38,.35)}
.btn.green{background:linear-gradient(135deg,var(--green),#059669);box-shadow:0 8px 24px rgba(16,185,129,.35)}
.btn.amber{background:linear-gradient(135deg,var(--accent),#d97706);box-shadow:0 8px 24px rgba(245,158,11,.35)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

/* tab bar */
.tab-bar{position:absolute;bottom:0;left:0;right:0;height:84px;background:rgba(10,22,40,.95);
  border-top:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-around;
  padding-top:10px;backdrop-filter:blur(20px)}
.tab{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
  padding:4px 6px;border-radius:12px;min-width:46px}
.tab .ti2{font-size:20px}
.tab .tl{font-size:9px;color:var(--muted);font-weight:500}
.tab.active .tl{color:var(--sky)}

/* checklist */
.chk-item{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;background:var(--card);
  border:1px solid var(--border);border-radius:14px;margin-bottom:8px;cursor:pointer}
.chk-item.done{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.25)}
.chk-box{width:22px;height:22px;border-radius:8px;border:2px solid var(--border);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:12px}
.chk-item.done .chk-box{background:var(--green);border-color:var(--green)}
.chk-item p{font-size:13px;line-height:1.5}
.chk-item.done p{color:var(--muted);text-decoration:line-through}
.prog-wrap{height:4px;background:rgba(255,255,255,.08);border-radius:4px;margin:8px 0 16px;overflow:hidden}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--sky),var(--green));border-radius:4px;transition:width .4s}

/* airline links */
.al-block{margin-bottom:18px}
.al-hdr{display:flex;align-items:center;gap:10px;padding:11px 14px;
  background:linear-gradient(90deg,rgba(37,99,235,.22),rgba(37,99,235,.06));
  border:1px solid rgba(37,99,235,.28);border-radius:14px 14px 0 0;border-bottom:none}
.al-logo{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;font-family:'Syne',sans-serif;flex-shrink:0}
.l-ac{background:linear-gradient(135deg,#cc0000,#8b0000)}
.l-wj{background:linear-gradient(135deg,#00447c,#002a50)}
.l-po{background:linear-gradient(135deg,#374151,#1f2937)}
.al-name{font-family:'Syne',sans-serif;font-size:15px;font-weight:800}
.al-sz{margin-left:auto;font-size:9px;font-weight:700;padding:3px 7px;border-radius:8px;
  background:rgba(16,185,129,.18);color:var(--green)}
.al-links{background:rgba(255,255,255,.025);border:1px solid rgba(37,99,235,.28);border-radius:0 0 14px 14px;overflow:hidden}
.cl-row{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;
  border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s}
.cl-row:last-child{border-bottom:none}
.cl-row:hover{background:rgba(255,255,255,.05)}
.cl-left{display:flex;align-items:center;gap:10px}
.cl-ico{width:28px;height:28px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.ci-d{background:rgba(245,158,11,.15)} .ci-b{background:rgba(37,99,235,.15)}
.ci-x{background:rgba(239,68,68,.15)} .ci-g{background:rgba(16,185,129,.15)}
.cl-lbl{font-size:12px;font-weight:500;line-height:1.3}
.cl-sub{font-size:10px;color:var(--muted);margin-top:1px}
.cl-arr{font-size:11px;color:var(--muted)}
.disc{background:rgba(148,163,184,.07);border:1px solid rgba(148,163,184,.12);border-radius:12px;
  padding:10px 12px;margin:14px 0 4px;font-size:11px;color:var(--muted);line-height:1.5;text-align:center}

/* flight lookup */
.fl-input-wrap{display:flex;gap:8px;margin-bottom:16px}
.fl-input{flex:1;background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:14px;
  padding:14px 16px;color:var(--white);font-family:'DM Sans',sans-serif;font-size:15px;
  font-weight:600;letter-spacing:2px;text-transform:uppercase;outline:none}
.fl-input::placeholder{color:var(--muted);letter-spacing:1px;font-weight:400;text-transform:none}
.fl-input:focus{border-color:var(--sky);background:rgba(37,99,235,.1)}
.fl-btn{background:linear-gradient(135deg,var(--sky),#1e40af);border:none;border-radius:14px;
  padding:14px 18px;color:white;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;
  cursor:pointer;white-space:nowrap}
.fl-btn:disabled{opacity:.4;cursor:not-allowed}
.fl-card{background:linear-gradient(135deg,rgba(37,99,235,.15),rgba(16,185,129,.08));
  border:1px solid rgba(37,99,235,.3);border-radius:20px;padding:18px;margin-bottom:14px}
.fl-airline{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--muted);
  text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
.fl-flight-no{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-1px;margin-bottom:4px}
.fl-status{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;
  font-size:11px;font-weight:700;margin-bottom:16px}
.fl-status.active{background:rgba(16,185,129,.2);color:var(--green)}
.fl-status.delayed{background:rgba(245,158,11,.2);color:var(--accent)}
.fl-status.landed{background:rgba(148,163,184,.15);color:var(--muted)}
.fl-status.unknown{background:rgba(148,163,184,.1);color:var(--muted)}
.status-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.fl-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.fl-detail-item{background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px}
.fl-detail-item .dlbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
.fl-detail-item .dval{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}
.fl-links{display:flex;gap:8px;margin-top:12px}
.fl-link-btn{flex:1;padding:10px;background:rgba(255,255,255,.06);border:1px solid var(--border);
  border-radius:12px;color:var(--white);font-family:'Syne',sans-serif;font-size:11px;font-weight:700;
  cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}
.fl-link-btn:hover{background:rgba(255,255,255,.1)}
.fl-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.1);border-top-color:var(--sky);
  border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
.fl-empty{text-align:center;padding:30px 0}
.fl-empty .em-icon{font-size:36px;margin-bottom:10px}
.fl-empty p{font-size:13px;color:var(--muted);line-height:1.5}
.rf-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--card);
  border:1px solid var(--border);border-radius:14px;margin-bottom:8px;cursor:pointer}
.rf-item:hover{background:rgba(255,255,255,.1)}
.rf-badge{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;padding:6px 10px;
  background:linear-gradient(135deg,rgba(37,99,235,.3),rgba(37,99,235,.1));border-radius:10px;
  letter-spacing:1px;flex-shrink:0;min-width:72px;text-align:center}
.rf-info h4{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}
.rf-info p{font-size:11px;color:var(--muted)}
.rf-arrow{margin-left:auto;font-size:12px;color:var(--muted)}

/* evidence */
.ev-tabs{display:flex;gap:8px;margin-bottom:16px}
.ev-tab{flex:1;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:12px;
  text-align:center;cursor:pointer;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--muted)}
.ev-tab.active{background:linear-gradient(135deg,rgba(37,99,235,.3),rgba(37,99,235,.1));
  border-color:rgba(37,99,235,.4);color:var(--white)}
.rec-center{display:flex;flex-direction:column;align-items:center;padding:10px 0 20px}
.rec-btn{width:88px;height:88px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:32px;transition:all .2s}
.rec-btn.idle{background:linear-gradient(135deg,var(--red),#991b1b);box-shadow:0 8px 28px rgba(220,38,38,.4)}
.rec-btn.recording{background:linear-gradient(135deg,#dc2626,#7f1d1d);
  animation:recpulse 1.2s ease-out infinite}
@keyframes recpulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.6)}70%{box-shadow:0 0 0 20px rgba(220,38,38,0)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}}
.rec-time{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:2px;margin-top:14px}
.rec-label{font-size:12px;color:var(--muted);margin-top:4px}
.rec-wave{display:flex;align-items:center;gap:3px;height:24px;margin:12px 0}
.rec-wave span{display:inline-block;width:3px;background:var(--red);border-radius:2px}
.rec-wave.live span{animation:wave .8s ease-in-out infinite}
.rec-wave.live span:nth-child(2){animation-delay:.1s}
.rec-wave.live span:nth-child(3){animation-delay:.2s}
.rec-wave.live span:nth-child(4){animation-delay:.3s}
.rec-wave.live span:nth-child(5){animation-delay:.2s}
.rec-wave.live span:nth-child(6){animation-delay:.1s}
.rec-wave.idle span{background:rgba(255,255,255,.15);height:4px}
@keyframes wave{0%,100%{height:4px}50%{height:20px}}
.ev-meta{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:12px}
.ev-meta label{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px}
.ev-meta input{width:100%;background:rgba(255,255,255,.05);border:1px solid var(--border);
  border-radius:10px;padding:10px 12px;color:var(--white);font-family:'DM Sans',sans-serif;font-size:13px;outline:none}
.ev-meta input:focus{border-color:var(--sky);background:rgba(37,99,235,.1)}
.mt-8{margin-top:8px}

/* drive auth banner */
.drive-auth{border-radius:16px;padding:16px;margin-bottom:14px;text-align:center}
.drive-auth.disconnected{background:rgba(255,255,255,.04);border:1px solid var(--border)}
.drive-auth.connected{background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(16,185,129,.04));
  border:1px solid rgba(16,185,129,.3)}
.drive-auth.checking{background:rgba(255,255,255,.03);border:1px dashed var(--border)}
.drive-user{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.drive-avatar{width:36px;height:36px;border-radius:50%;border:2px solid rgba(16,185,129,.4)}
.drive-user-info h4{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}
.drive-user-info p{font-size:11px;color:var(--muted)}
.drive-folder{font-size:11px;color:#6ee7b7;margin-top:6px;display:flex;align-items:center;gap:5px}

/* evidence items */
.ev-item{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px}
.ev-item-hdr{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.ev-type-badge{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.ev-type-audio{background:rgba(239,68,68,.15)}
.ev-type-photo{background:rgba(37,99,235,.15)}
.ev-item-meta h4{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}
.ev-item-meta p{font-size:11px;color:var(--muted);margin-top:1px}
.ev-item-actions{display:flex;gap:6px;margin-top:10px}
.ev-act-btn{flex:1;padding:8px;background:rgba(255,255,255,.05);border:1px solid var(--border);
  border-radius:10px;color:var(--white);font-family:'Syne',sans-serif;font-size:11px;font-weight:700;
  cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;transition:all .15s}
.ev-act-btn:hover{background:rgba(255,255,255,.1)}
.ev-act-btn.drive{border-color:rgba(16,185,129,.3);color:var(--green);background:rgba(16,185,129,.08)}
.ev-act-btn.drive.uploading{opacity:.7;cursor:not-allowed}
.ev-act-btn.drive.done{border-color:rgba(16,185,129,.5);background:rgba(16,185,129,.15)}
.ev-act-btn.drive.error{border-color:rgba(239,68,68,.3);color:var(--red);background:rgba(239,68,68,.06)}
.ev-act-btn.dl{border-color:rgba(37,99,235,.3);color:#60a5fa;background:rgba(37,99,235,.08)}
.ev-act-btn.del{border-color:rgba(239,68,68,.2);color:var(--red);background:rgba(239,68,68,.06)}
.audio-wrap{background:rgba(255,255,255,.04);border-radius:10px;padding:10px;margin-top:8px}
.audio-wrap audio{width:100%;height:32px}
.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.photo-thumb{aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid var(--border);position:relative}
.photo-thumb img{width:100%;height:100%;object-fit:cover}
.photo-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:6px;font-size:9px;color:var(--muted)}
.photo-add{aspect-ratio:1;border-radius:12px;border:2px dashed var(--border);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer}
.photo-add:hover{border-color:var(--sky);background:rgba(37,99,235,.08)}
.photo-add span{font-size:24px}
.photo-add p{font-size:11px;color:var(--muted)}
.photo-input{display:none}

/* drive file list */
.df-item{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);
  border:1px solid var(--border);border-radius:14px;margin-bottom:8px;cursor:pointer}
.df-item:hover{background:rgba(255,255,255,.08)}
.df-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.df-audio{background:rgba(239,68,68,.15)} .df-photo{background:rgba(37,99,235,.15)}
.df-info h4{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;line-height:1.3}
.df-info p{font-size:10px;color:var(--muted);margin-top:2px}
.df-arrow{margin-left:auto;font-size:11px;color:var(--muted)}

.rights-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px}
.rights-card h3{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;margin-bottom:8px}
.rights-card p{font-size:12px;color:var(--muted);line-height:1.6}
`;

/* ─── data ─── */
const SITUATIONS = [
  {id:"denied",icon:"🚫",title:"Denied Boarding",desc:"Bumped involuntarily",badge:{txt:"Up to $2,400",cls:"b-amber"}},
  {id:"delay", icon:"⏱️",title:"Flight Delayed", desc:"Departure or arrival", badge:{txt:"Up to $1,000",cls:"b-green"}},
  {id:"baggage",icon:"🧳",title:"Baggage Issues", desc:"Lost, delayed, damaged",badge:{txt:"Up to $2,400",cls:"b-blue"}},
  {id:"cancel",icon:"❌",title:"Flight Cancelled",desc:"Total cancellation",  badge:{txt:"Up to $1,000",cls:"b-red"}},
];
const AIRLINES = [
  {id:"ac",name:"Air Canada",   logoClass:"l-ac",logoLabel:"AC",links:[
    {icon:"⏱️",cls:"ci-d",label:"Flight Delay / Cancellation Claim",sub:"Check eligibility & submit",url:"https://www.aircanada.com/ca/en/aco/home/fly/flight-information/flight-disruptions.html"},
    {icon:"🧳",cls:"ci-b",label:"Delayed or Damaged Baggage",       sub:"Report & submit expenses", url:"https://www.aircanada.com/ca/en/aco/home/plan/baggage/delayed-damaged-baggage.html"},
    {icon:"🚫",cls:"ci-x",label:"Denied Boarding Claim",            sub:"Via Customer Relations",   url:"https://accc-prod.microsoftcrmportals.com/en-CA/air-canada-contact-us/"},
  ]},
  {id:"wj",name:"WestJet",      logoClass:"l-wj",logoLabel:"WJ",links:[
    {icon:"⏱️",cls:"ci-d",label:"Flight Delay / Cancellation Claim",sub:"APPR compensation form",      url:"https://www.westjet.com/en-ca/interruptions/compensation-claims"},
    {icon:"🧳",cls:"ci-b",label:"Delayed or Damaged Baggage",       sub:"Report & reimbursement",       url:"https://www.westjet.com/en-ca/baggage/lost-delayed-damaged"},
    {icon:"🚫",cls:"ci-x",label:"Denied Boarding Info & Claim",     sub:"Rights & compensation",        url:"https://www.westjet.com/en-ca/interruptions/denied-boarding"},
  ]},
  {id:"po",name:"Porter Airlines",logoClass:"l-po",logoLabel:"PO",links:[
    {icon:"⏱️",cls:"ci-d",label:"Flight Delay / Cancellation Claim",sub:"Eligibility check & form",     url:"https://www.flyporter.com/en/customer-service/help-contact/claims/compensation-eligibility-check/compensation-claim"},
    {icon:"🧳",cls:"ci-b",label:"Delayed / Lost Baggage Claim",     sub:"Baggage reimbursement form",    url:"https://www.flyporter.com/en/customer-service/help-contact/baggage-service-centre/reimbursement-claim"},
    {icon:"🔨",cls:"ci-b",label:"Damaged Baggage Report",           sub:"File within 7 days",            url:"https://www.flyporter.com/en-us/customer-service/help-contact/baggage-service-centre/damaged-baggage-report"},
    {icon:"🚫",cls:"ci-x",label:"Denied Boarding Policy & Claim",   sub:"Compensation & recourse",       url:"https://www.flyporter.com/en-us/travel-information/travel-disruptions/denied-boarding"},
  ]},
];
const CONTENT = {
  denied:{title:"Denied Boarding",icon:"🚫",
    intro:"Airlines must first ask for volunteers. If denied involuntarily, you have strong rights under the APPR.",
    steps:[
      {title:"Ask the reason",body:"Request in writing why you're being denied. Involuntary denial triggers full APPR rights."},
      {title:"Don't volunteer under pressure",body:"You lose mandatory APPR rights if you volunteer. Negotiate any offer carefully first."},
      {title:"Confirm compensation",body:"Compensation is based on arrival delay at final destination, regardless of alternate flights offered."},
      {title:"Get rebooked or refunded",body:"Entitled to a confirmed seat on the next available flight, or a full refund plus return flight."},
      {title:"Record the interaction",body:"Use the Evidence tab to record your conversation with airline staff and photograph any notices."},
      {title:"File a claim",body:"Airlines have 30 days to respond. Escalate to the CTA if unsatisfied."},
    ],
    comp:{label:"Compensation by delay at destination",rows:[
      {label:"0–6 hours delay",amount:"$900"},
      {label:"6–9 hours delay",amount:"$1,800"},
      {label:"9+ hours delay",amount:"$2,400"},
    ]},
    warnings:["Compensation owed within 48 hours.","Don't accept a voucher without confirming cash amount — you always have the right to choose cash."],
    info:["Entitled to meals if waiting 3+ hours, free hotel if overnight, and free transport to/from hotel."],
  },
  delay:{title:"Flight Delay",icon:"⏱️",
    intro:"Your entitlements depend on the cause and length of the delay. The airline must explain the reason in plain language.",
    steps:[
      {title:"Identify the cause",body:"Within airline's control (maintenance)? Outside control (weather)? Safety? Each triggers different rights."},
      {title:"Track delay length",body:"2 hours: status updates. 3 hours: food/drink. 9 hours: overnight accommodation (if within control)."},
      {title:"Claim standard of treatment",body:"3+ hours within-control: demand food, drink, communications, and rebooking or refund."},
      {title:"Claim compensation",body:"Within airline's control (not safety): cash compensation based on delay length."},
      {title:"Request rebooking or refund",body:"3+ hours: full refund or rebooking on the next available flight — even a competitor's."},
      {title:"Document and claim",body:"Photograph receipts. Use the Evidence tab to record interactions. Submit claim in writing."},
    ],
    comp:{label:"Compensation (within airline's control, not safety)",rows:[
      {label:"3–6 hours delay",amount:"$400"},
      {label:"6–9 hours delay",amount:"$700"},
      {label:"9+ hours delay",amount:"$1,000"},
    ]},
    warnings:["Weather/ATC delays don't trigger compensation, but standard of treatment still applies.","Always get written confirmation of the delay reason."],
    info:["Air Canada, WestJet, and Porter are all large airlines — maximum APPR compensation applies."],
  },
  baggage:{title:"Baggage Issues",icon:"🧳",
    intro:"Reporting deadlines are strict. Missing them may void your claim entirely.",
    steps:[
      {title:"Report at the airport immediately",body:"File a Property Irregularity Report (PIR) before leaving. Get a copy with a reference number."},
      {title:"Report in writing within deadlines",body:"Damaged: 7 days. Delayed: 21 days. Lost: 21 days from notification."},
      {title:"Photograph everything",body:"Use the Evidence tab to photograph your bag, contents, and any damage before leaving."},
      {title:"Claim interim expenses",body:"Essential items (toiletries, clothing) can be claimed. Keep all receipts."},
      {title:"Calculate liability",body:"Up to ~$2,400 CAD (1,519 SDR) for checked baggage. Declare higher value at check-in."},
      {title:"Escalate if rejected",body:"Escalate to the CTA within one year of the incident."},
    ],
    comp:{label:"Baggage liability limits",rows:[
      {label:"Checked baggage (max)",amount:"~$2,400"},
      {label:"Carry-on baggage (max)",amount:"~$1,200"},
      {label:"Interim expenses",amount:"Reasonable"},
    ]},
    warnings:["Missing the deadline may void your claim.","Electronics and fragile items may have sub-limits."],
    info:["If delayed 24+ hours, most airlines provide an advance for essentials before full claim resolution."],
  },
  cancel:{title:"Flight Cancelled",icon:"❌",
    intro:"Cancellations within the airline's control trigger strong rights. Understand the cause before accepting any offer.",
    steps:[
      {title:"Determine the cause",body:"Within-control (commercial), outside-control (weather), or safety? This determines compensation."},
      {title:"Request standard of treatment",body:"3+ hour wait: entitled to food, drink, and communications regardless of cause."},
      {title:"Choose rebooking or refund",body:"Must be offered rebooking on next available flight (any carrier) or full refund."},
      {title:"Claim cash compensation",body:"Within-control (not safety): claim compensation on top of rebooking/refund."},
      {title:"Claim hotel if overnight",body:"Within-control overnight: airline must provide hotel plus transport."},
      {title:"Submit formally",body:"Written claim to airline. If unresolved in 30 days, file with the CTA."},
    ],
    comp:{label:"Compensation (within control, not safety)",rows:[
      {label:"3–6 hours delay to dest.",amount:"$400"},
      {label:"6–9 hours delay to dest.",amount:"$700"},
      {label:"9+ hours delay to dest.",amount:"$1,000"},
    ]},
    warnings:["Accepting a meal voucher does NOT waive your right to cash compensation.","Safety-related cancellations don't trigger compensation, but the airline must still rebook you."],
    info:["Even outside-control cancellations require the airline to rebook you or give a full refund."],
  },
};
const CHECKLIST = [
  "Photo of departure board showing delay/cancellation",
  "Reason for disruption in writing from airline",
  "Property Irregularity Report for baggage issues",
  "All boarding passes and ticket confirmation",
  "Receipts (food, hotel, transport, clothing)",
  "Names of airline staff you speak with",
  "Screenshots of app notifications from airline",
  "Confirmation number for any promises made",
];

/* ─── helpers ─── */
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const airlineName = code => ({AC:"Air Canada",WS:"WestJet",PD:"Porter Airlines",
  UA:"United",AA:"American",DL:"Delta",BA:"British Airways"}[code]||code);

async function lookupFlight(fn) {
  const clean = fn.trim().toUpperCase().replace(/\s+/g,"");
  try {
    const r = await fetch("https://opensky-network.org/api/states/all",{signal:AbortSignal.timeout(8000)});
    if (r.ok) {
      const {states=[]} = await r.json();
      const m = states.find(s=>(s[1]||"").trim().toUpperCase().replace(/\s/g,"")=== clean);
      if (m) {
        const airline = clean.match(/^([A-Z]{2,3})/)?.[1]||"";
        return {flightNo:clean,airline:airlineName(airline),status:m[8]?"On Ground":"Active / Airborne",
          country:m[2],lat:m[6],lon:m[5],velocity:m[9]?`${Math.round(m[9]*1.944)} kts`:"—",
          squawk:m[14]||"—",source:"OpenSky Network (live)",found:true};
      }
    }
  } catch {}
  const airline = clean.match(/^([A-Z]{2,3})/)?.[1]||"";
  return {flightNo:clean,airline:airlineName(airline)||clean,
    status:"Not currently airborne",source:"Not found in live data — use links below",found:false};
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function APPRApp() {
  const [screen, setScreen] = useState("home");
  const [active,  setActive]  = useState("home");
  const [detail,  setDetail]  = useState(null);
  const [checked, setChecked] = useState({});

  // flight
  const [flightInput,   setFlightInput]   = useState("");
  const [flightData,    setFlightData]    = useState(null);
  const [flightLoading, setFlightLoading] = useState(false);
  const [recentFlights, setRecentFlights] = useState([]);

  // evidence
  const [evTab,     setEvTab]     = useState("audio");
  const [recording, setRecording] = useState(false);
  const [recSecs,   setRecSecs]   = useState(0);
  const [evidence,  setEvidence]  = useState([]);
  const [recLabel,  setRecLabel]  = useState("");
  const [recFlight, setRecFlight] = useState("");
  const [photoLabel,  setPhotoLabel]  = useState("");
  const [photoFlight, setPhotoFlight] = useState("");

  const mediaRecRef  = useRef(null);
  const chunksRef    = useRef([]);
  const timerRef     = useRef(null);
  const photoInputRef = useRef(null);

  // Google Drive
  const drive = useDrive();

  const goTo = s => { setActive(s); setScreen(s); setDetail(null); };
  const openUrl = u => window.open(u,"_blank","noopener,noreferrer");
  const toggleCheck = i => setChecked(p=>({...p,[i]:!p[i]}));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  /* flight search */
  const searchFlight = useCallback(async () => {
    if (!flightInput.trim()) return;
    setFlightLoading(true); setFlightData(null);
    const r = await lookupFlight(flightInput);
    setFlightData(r); setFlightLoading(false);
    setRecentFlights(p=>[r,...p.filter(f=>f.flightNo!==r.flightNo)].slice(0,5));
  }, [flightInput]);

  /* recording */
  const startRec = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mr = new MediaRecorder(stream,{mimeType:"audio/webm"});
      chunksRef.current = [];
      mr.ondataavailable = e => { if(e.data.size>0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current,{type:"audio/webm"});
        const url  = URL.createObjectURL(blob);
        const ts   = new Date();
        const flight  = recFlight || flightData?.flightNo || "";
        const airline = flightData?.airline || "";
        const label   = recLabel || `Recording ${ts.toLocaleTimeString()}`;
        const fname   = `APPR_Audio_${flight?flight+"_":""}${airline?airline.replace(/\s/g,"")+"_":""}${ts.toISOString().slice(0,19).replace(/:/g,"-")}.webm`;
        setEvidence(p=>[{id:Date.now(),type:"audio",url,blob,label,flight,airline,fname,ts:ts.toLocaleString(),duration:fmt(recSecs)},...p]);
        stream.getTracks().forEach(t=>t.stop());
      };
      mr.start(1000);
      mediaRecRef.current = mr;
      setRecording(true); setRecSecs(0);
      timerRef.current = setInterval(()=>setRecSecs(s=>s+1),1000);
    } catch { alert("Microphone access required. Please allow in browser settings."); }
  },[recLabel,recFlight,recSecs,flightData]);

  const stopRec = useCallback(() => {
    mediaRecRef.current?.state !== "inactive" && mediaRecRef.current.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  },[]);

  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  /* photo */
  const handlePhoto = useCallback(e => {
    Array.from(e.target.files).forEach(file => {
      const url  = URL.createObjectURL(file);
      const ts   = new Date();
      const flight  = photoFlight || flightData?.flightNo || "";
      const airline = flightData?.airline || "";
      const label   = photoLabel || file.name;
      const fname   = `APPR_Photo_${flight?flight+"_":""}${airline?airline.replace(/\s/g,"")+"_":""}${ts.toISOString().slice(0,19).replace(/:/g,"-")}_${file.name}`;
      setEvidence(p=>[{id:Date.now()+Math.random(),type:"photo",url,file,label,flight,airline,fname,ts:ts.toLocaleString()},...p]);
    });
    e.target.value="";
  },[photoLabel,photoFlight,flightData]);

  /* download */
  const downloadEv = useCallback(ev => {
    const a = document.createElement("a");
    a.href = ev.url; a.download = ev.fname; a.click();
  },[]);

  /* drive upload */
  const handleDriveUpload = useCallback(async ev => {
    if (drive.authState !== "authenticated") {
      alert("Please connect Google Drive first (tap the Drive setup banner above).");
      return;
    }
    try {
      const result = await drive.uploadToDrive(ev);
      if (result.webViewLink) {
        // optionally open the file in Drive
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  },[drive]);

  const deleteEv = useCallback(id => setEvidence(p=>p.filter(e=>e.id!==id)),[]);

  const d  = detail ? CONTENT[detail] : null;
  const sc = flightData ? (flightData.status.toLowerCase().includes("active")?"active":
             flightData.status.toLowerCase().includes("ground")?"landed":"unknown") : "unknown";

  /* drive button label */
  const driveLabel = (id) => {
    const s = drive.uploads[id];
    if (s==="uploading") return "⏳ Uploading…";
    if (s==="done")      return "✅ On Drive";
    if (s==="error")     return "❌ Retry";
    return "☁️ Drive";
  };

  return (<>
    <style>{css}</style>
    <div className="phone">
      <div className="status-bar">
        <span>9:41</span><div className="notch"/><span>⚡ 100%</span>
      </div>
      <div className="screen">

        {/* ══ HOME ══ */}
        {screen==="home" && <>
          <div className="hero">
            <div className="hero-icon">✈️</div>
            <h1>Know Your Rights</h1>
            <p>Air Passenger Protection Regulations<br/>Canada — APPR Guide</p>
          </div>
          <div className="tip"><span className="ti">💡</span>
            <p><strong>Pro tip:</strong> Always ask for the reason for any disruption in writing. The cause determines what you're owed.</p>
          </div>
          <p className="sec-label">What happened?</p>
          <div className="sit-grid">
            {SITUATIONS.map(s=>(
              <div key={s.id} className="sit-card" onClick={()=>{setDetail(s.id);setScreen("detail")}}>
                <span className="sit-icon">{s.icon}</span>
                <h3>{s.title}</h3><p>{s.desc}</p>
                <span className={`badge ${s.badge.cls}`}>{s.badge.txt}</span>
              </div>
            ))}
          </div>
          <p className="sec-label">Tools</p>
          {[
            {id:"flight",  icon:"🛫",title:"Flight Lookup",  desc:"Live status via OpenSky",       badge:{txt:"Live data",    cls:"b-purple"}},
            {id:"evidence",icon:"🎙️",title:"Evidence Capture",desc:"Voice + photos → Google Drive",badge:{txt:`${evidence.length} items`,cls:"b-red"}},
            {id:"claims",  icon:"🔗",title:"File a Claim",   desc:"Air Canada, WestJet, Porter",   badge:{txt:"3 airlines",  cls:"b-amber"}},
            {id:"checklist",icon:"✅",title:"Checklist",     desc:"Document at the airport",        badge:{txt:`${checkedCount}/${CHECKLIST.length}`,cls:"b-blue"}},
            {id:"rights",  icon:"📖",title:"Know the Rules", desc:"APPR basics & CTA complaints",  badge:null},
          ].map(t=>(
            <div key={t.id} className="sit-card fw" style={{marginTop:8}} onClick={()=>goTo(t.id)}>
              <span className="sit-icon">{t.icon}</span>
              <div><h3>{t.title}</h3><p>{t.desc}</p>
                {t.badge&&<span className={`badge ${t.badge.cls}`}>{t.badge.txt}</span>}
              </div>
            </div>
          ))}
        </>}

        {/* ══ DETAIL ══ */}
        {screen==="detail" && d && <>
          <div className="dh">
            <div className="back" onClick={()=>{setScreen("home");setDetail(null)}}>←</div>
            <div className="dt">{d.icon} {d.title}</div>
          </div>
          <div className="tip"><span className="ti">ℹ️</span><p>{d.intro}</p></div>
          <p className="sec-label">Step-by-step guide</p>
          {d.steps.map((s,i)=>(
            <div key={i} className="step-c">
              <div className="step-n">{i+1}</div>
              <div className="step-t"><h4>{s.title}</h4><p>{s.body}</p></div>
            </div>
          ))}
          <p className="sec-label">Compensation</p>
          <div className="comp-t">
            <div className="comp-h">{d.comp.label}</div>
            {d.comp.rows.map((r,i)=>(
              <div key={i} className="comp-r"><span className="lbl">{r.label}</span><span className="amt">{r.amount}</span></div>
            ))}
          </div>
          {d.warnings.map((w,i)=><div key={i} className="warn-box"><span>⚠️</span><p>{w}</p></div>)}
          {d.info.map((w,i)=><div key={i} className="info-box"><span>✅</span><p>{w}</p></div>)}
          <button className="btn" onClick={()=>goTo("evidence")}>Record Evidence 🎙️</button>
          <button className="btn sec" onClick={()=>goTo("claims")}>File a Claim →</button>
          <button className="btn sec" onClick={()=>openUrl("https://otc-cta.gc.ca/eng/air-travel-complaints")}>File CTA Complaint ↗</button>
        </>}

        {/* ══ FLIGHT LOOKUP ══ */}
        {screen==="flight" && <>
          <div className="dh">
            <div className="back" onClick={()=>goTo("home")}>←</div>
            <div className="dt">🛫 Flight Lookup</div>
          </div>
          <div className="tip"><span className="ti">📡</span>
            <p>Enter a flight number (e.g. <strong>AC123</strong>) to query live OpenSky data. Deep links to FlightAware and Flightradar24 are also provided.</p>
          </div>
          <div className="fl-input-wrap">
            <input className="fl-input" placeholder="e.g. AC123"
              value={flightInput} maxLength={8}
              onChange={e=>setFlightInput(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter"&&searchFlight()}/>
            <button className="fl-btn" onClick={searchFlight} disabled={flightLoading||!flightInput.trim()}>
              {flightLoading?"…":"Search"}
            </button>
          </div>
          {flightLoading && <div style={{textAlign:"center",padding:"30px 0"}}><div className="fl-spinner"/><p style={{fontSize:13,color:"var(--muted)"}}>Querying live data…</p></div>}
          {flightData && !flightLoading && (
            <div className="fl-card">
              <div className="fl-airline">{flightData.airline}</div>
              <div className="fl-flight-no">{flightData.flightNo}</div>
              <div><span className={`fl-status ${sc}`}>
                {sc==="active"&&<span className="status-dot"/>}{flightData.status}
              </span></div>
              {flightData.found && (
                <div className="fl-detail-grid">
                  {flightData.country&&<div className="fl-detail-item"><div className="dlbl">Country</div><div className="dval">{flightData.country}</div></div>}
                  {flightData.velocity&&flightData.velocity!=="—"&&<div className="fl-detail-item"><div className="dlbl">Speed</div><div className="dval">{flightData.velocity}</div></div>}
                  {flightData.lat&&<div className="fl-detail-item"><div className="dlbl">Position</div><div className="dval">{flightData.lat?.toFixed(1)}° {flightData.lon?.toFixed(1)}°</div></div>}
                  {flightData.squawk&&<div className="fl-detail-item"><div className="dlbl">Squawk</div><div className="dval">{flightData.squawk}</div></div>}
                </div>
              )}
              {!flightData.found&&<p style={{fontSize:12,color:"var(--muted)",marginTop:8,lineHeight:1.5}}>Flight may not be airborne or callsign format differs. Use the links below for full schedule data.</p>}
              <div className="fl-links">
                <button className="fl-link-btn" onClick={()=>openUrl(`https://flightaware.com/live/flight/${flightData.flightNo}`)}>🌐 FlightAware</button>
                <button className="fl-link-btn" onClick={()=>openUrl(`https://www.flightradar24.com/data/flights/${flightData.flightNo.toLowerCase()}`)}>📡 Radar24</button>
                <button className="fl-link-btn" onClick={()=>openUrl(`https://flighty.app`)}>📱 Flighty</button>
              </div>
              <div style={{fontSize:10,color:"var(--muted)",marginTop:10,textAlign:"center"}}>Source: {flightData.source}</div>
            </div>
          )}
          {!flightData&&!flightLoading&&recentFlights.length===0&&(
            <div className="fl-empty"><div className="em-icon">✈️</div><p>Enter a flight number above to check live status.</p></div>
          )}
          {recentFlights.length>0&&<>
            <p className="sec-label">Recent searches</p>
            {recentFlights.map((f,i)=>(
              <div key={i} className="rf-item" onClick={()=>{setFlightInput(f.flightNo);setFlightData(f)}}>
                <div className="rf-badge">{f.flightNo}</div>
                <div className="rf-info"><h4>{f.airline}</h4><p>{f.status}</p></div>
                <span className="rf-arrow">→</span>
              </div>
            ))}
          </>}
        </>}

        {/* ══ EVIDENCE CAPTURE ══ */}
        {screen==="evidence" && <>
          <div className="dh">
            <div className="back" onClick={()=>goTo("home")}>←</div>
            <div className="dt">🎙️ Evidence Capture</div>
          </div>

          {/* Drive auth banner */}
          {drive.authState==="checking" && (
            <div className="drive-auth checking"><p style={{fontSize:12,color:"var(--muted)"}}>Checking Google Drive connection…</p></div>
          )}
          {drive.authState==="idle" && (
            <div className="drive-auth disconnected">
              <p style={{fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:8}}>☁️ Connect Google Drive</p>
              <p style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>Sign in to automatically upload all evidence files to a dedicated <strong style={{color:"var(--white)"}}>APPR Evidence</strong> folder on your Drive, named and tagged by flight for litigation.</p>
              <button className="btn green" style={{marginTop:0}} onClick={drive.login}>Sign in with Google →</button>
            </div>
          )}
          {drive.authState==="authenticated" && (
            <div className="drive-auth connected">
              <div className="drive-user">
                {drive.user?.picture&&<img className="drive-avatar" src={drive.user.picture} alt=""/>}
                <div className="drive-user-info">
                  <h4>{drive.user?.name}</h4>
                  <p>{drive.user?.email}</p>
                </div>
                <button onClick={drive.logout} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:12}}>Sign out</button>
              </div>
              <div className="drive-folder">📁 Files saved to: <strong>APPR Evidence</strong></div>
              <button className="btn sec" style={{marginTop:10,fontSize:12}} onClick={()=>{drive.fetchDriveFiles();setEvTab("library")}}>View Drive Files →</button>
            </div>
          )}

          <div className="ev-tabs">
            <div className={`ev-tab ${evTab==="audio"?"active":""}`} onClick={()=>setEvTab("audio")}>🎙️ Voice</div>
            <div className={`ev-tab ${evTab==="photo"?"active":""}`} onClick={()=>setEvTab("photo")}>📷 Photos</div>
            <div className={`ev-tab ${evTab==="library"?"active":""}`} onClick={()=>setEvTab("library")}>📁 Library ({evidence.length})</div>
          </div>

          {/* AUDIO */}
          {evTab==="audio" && <>
            <div className="ev-meta">
              <label>Flight Number</label>
              <input placeholder="e.g. AC123" value={recFlight} onChange={e=>setRecFlight(e.target.value.toUpperCase())} maxLength={8}/>
              <label style={{marginTop:10}}>Label / Description</label>
              <input className="mt-8" placeholder="e.g. Denied boarding conversation at Gate 12" value={recLabel} onChange={e=>setRecLabel(e.target.value)}/>
            </div>
            <div className="rec-center">
              <button className={`rec-btn ${recording?"recording":"idle"}`} onClick={recording?stopRec:startRec}>
                {recording?"⏹":"🎙"}
              </button>
              <div className="rec-time">{fmt(recSecs)}</div>
              <div className="rec-label">{recording?"Recording — tap to stop":"Tap to start recording"}</div>
              <div className={`rec-wave ${recording?"live":"idle"}`}>
                {[...Array(6)].map((_,i)=><span key={i}/>)}
              </div>
            </div>
            <div className="warn-box"><span>⚖️</span>
              <p>In most Canadian provinces, <strong>one-party consent</strong> applies — a participant may record a conversation without notifying others. Consult legal advice if unsure of jurisdiction.</p>
            </div>
          </>}

          {/* PHOTO */}
          {evTab==="photo" && <>
            <div className="ev-meta">
              <label>Flight Number</label>
              <input placeholder="e.g. AC123" value={photoFlight} onChange={e=>setPhotoFlight(e.target.value.toUpperCase())} maxLength={8}/>
              <label style={{marginTop:10}}>Label / Description</label>
              <input className="mt-8" placeholder="e.g. Damaged luggage at YYZ carousel" value={photoLabel} onChange={e=>setPhotoLabel(e.target.value)}/>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple capture="environment" className="photo-input" onChange={handlePhoto}/>
            <div className="photo-grid">
              {evidence.filter(e=>e.type==="photo").slice(0,5).map(ev=>(
                <div key={ev.id} className="photo-thumb">
                  <img src={ev.url} alt={ev.label}/>
                  <div className="photo-overlay">{ev.label}</div>
                </div>
              ))}
              <div className="photo-add" onClick={()=>photoInputRef.current?.click()}>
                <span>📷</span><p>Tap to capture</p>
              </div>
            </div>
            <button className="btn amber" onClick={()=>photoInputRef.current?.click()}>📷 Take / Add Photos</button>
            <div className="tip" style={{marginTop:12}}>
              <span className="ti">💡</span>
              <p>Photograph: departure boards, boarding pass, damaged bags, receipts, and any written notices from the airline.</p>
            </div>
          </>}

          {/* LIBRARY */}
          {evTab==="library" && <>
            {/* Drive files section */}
            {drive.authState==="authenticated" && drive.driveFiles.length>0 && <>
              <p className="sec-label">On Google Drive</p>
              {drive.driveFiles.map((f,i)=>{
                const isAudio = f.mimeType?.includes("audio")||f.name?.includes("Audio");
                return (
                  <div key={i} className="df-item" onClick={()=>openUrl(f.webViewLink)}>
                    <div className={`df-icon ${isAudio?"df-audio":"df-photo"}`}>{isAudio?"🎙️":"📷"}</div>
                    <div className="df-info">
                      <h4>{f.name}</h4>
                      <p>{f.properties?.flight&&`${f.properties.flight} · `}{new Date(f.createdTime).toLocaleDateString()}</p>
                    </div>
                    <span className="df-arrow">↗</span>
                  </div>
                );
              })}
            </>}

            {/* Local items */}
            <p className="sec-label">{drive.driveFiles.length>0?"Local (not yet uploaded)":"Local Evidence"}</p>
            {evidence.length===0?(
              <div className="fl-empty"><div className="em-icon">📁</div><p>No evidence captured yet.<br/>Use Voice and Photos tabs to start building your record.</p></div>
            ):(
              evidence.map(ev=>(
                <div key={ev.id} className="ev-item">
                  <div className="ev-item-hdr">
                    <div className={`ev-type-badge ev-type-${ev.type}`}>{ev.type==="audio"?"🎙️":"📷"}</div>
                    <div className="ev-item-meta">
                      <h4>{ev.label}</h4>
                      <p>{ev.ts}{ev.flight?` · ${ev.flight}`:""}{ev.airline?` · ${ev.airline}`:""}{ev.duration?` · ${ev.duration}`:""}</p>
                    </div>
                  </div>
                  {ev.type==="audio"&&<div className="audio-wrap"><audio controls src={ev.url}/></div>}
                  {ev.type==="photo"&&<div style={{borderRadius:10,overflow:"hidden",marginTop:6,maxHeight:160}}><img src={ev.url} alt={ev.label} style={{width:"100%",objectFit:"cover",maxHeight:160}}/></div>}
                  <div className="ev-item-actions">
                    <button
                      className={`ev-act-btn drive ${drive.uploads[ev.id]||""}`}
                      onClick={()=>handleDriveUpload(ev)}
                      disabled={drive.uploads[ev.id]==="uploading"}>
                      {driveLabel(ev.id)}
                    </button>
                    <button className="ev-act-btn dl" onClick={()=>downloadEv(ev)}>⬇️ Save</button>
                    <button className="ev-act-btn del" onClick={()=>deleteEv(ev.id)}>🗑</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:6}}>📄 {ev.fname}</div>
                </div>
              ))
            )}
          </>}
        </>}

        {/* ══ CLAIMS ══ */}
        {screen==="claims" && <>
          <div className="dh">
            <div className="back" onClick={()=>goTo("home")}>←</div>
            <div className="dt">🔗 File a Claim</div>
          </div>
          <div className="tip"><span className="ti">⚡</span>
            <p>All three are <strong>large airlines</strong> — maximum APPR compensation applies. Tap any link to open the official claim page.</p>
          </div>
          {AIRLINES.map(al=>(
            <div key={al.id} className="al-block">
              <div className="al-hdr">
                <div className={`al-logo ${al.logoClass}`}>{al.logoLabel}</div>
                <span className="al-name">{al.name}</span>
                <span className="al-sz">LARGE AIRLINE</span>
              </div>
              <div className="al-links">
                {al.links.map((lk,i)=>(
                  <div key={i} className="cl-row" onClick={()=>openUrl(lk.url)}>
                    <div className="cl-left">
                      <div className={`cl-ico ${lk.cls}`}>{lk.icon}</div>
                      <div><div className="cl-lbl">{lk.label}</div><div className="cl-sub">{lk.sub}</div></div>
                    </div>
                    <span className="cl-arr">↗</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="sec-label">Escalate to regulator</p>
          <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(37,99,235,.28)",borderRadius:14,overflow:"hidden",marginBottom:6}}>
            <div className="cl-row" onClick={()=>openUrl("https://otc-cta.gc.ca/eng/air-travel-complaints")}>
              <div className="cl-left"><div className="cl-ico ci-g">⚖️</div>
                <div><div className="cl-lbl">Canadian Transportation Agency</div><div className="cl-sub">File if airline doesn't respond in 30 days</div></div>
              </div><span className="cl-arr">↗</span>
            </div>
          </div>
          <div className="disc">Links verified Feb 2025.</div>
        </>}

        {/* ══ CHECKLIST ══ */}
        {screen==="checklist" && <>
          <div className="dh">
            <div className="back" onClick={()=>goTo("home")}>←</div>
            <div className="dt">✅ Evidence Checklist</div>
          </div>
          <div className="tip"><span className="ti">📋</span><p>Tap each item as you complete it.</p></div>
          <div className="prog-wrap"><div className="prog-fill" style={{width:`${(checkedCount/CHECKLIST.length)*100}%`}}/></div>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>{checkedCount} of {CHECKLIST.length} items</p>
          {CHECKLIST.map((item,i)=>(
            <div key={i} className={`chk-item ${checked[i]?"done":""}`} onClick={()=>toggleCheck(i)}>
              <div className="chk-box">{checked[i]?"✓":""}</div><p>{item}</p>
            </div>
          ))}
          <button className="btn" style={{marginTop:16}} onClick={()=>goTo("evidence")}>Open Evidence Capture 🎙️</button>
        </>}

        {/* ══ RIGHTS ══ */}
        {screen==="rights" && <>
          <div className="dh">
            <div className="back" onClick={()=>goTo("home")}>←</div>
            <div className="dt">📖 Know the Rules</div>
          </div>
          <div className="tip"><span className="ti">⚖️</span>
            <p>The APPR gives you <strong>mandatory minimum rights</strong>. Airlines cannot offer you less.</p>
          </div>
          {[
            {title:"✈️ All Three Are Large Airlines",content:"Air Canada, WestJet, and Porter are all large airlines — maximum APPR compensation applies to all three."},
            {title:"⚖️ Filing a Complaint",content:"If your airline doesn't respond within 30 days, file with the Canadian Transportation Agency at otc-cta.gc.ca. You have one year from the incident."},
            {title:"🌍 International Flights",content:"APPR applies to flights departing from Canada. For flights covered by the Montreal Convention, international rules may also apply."},
            {title:"🎙️ Recording Interactions",content:"In most Canadian provinces, one-party consent applies — a participant may record a conversation. Recording without participation may require all-party consent. Seek legal advice for your specific situation."},
            {title:"📋 Regulatory Basis",content:"Air Passenger Protection Regulations (SOR/2019-150) under the Canada Transportation Act. Airlines cannot waive or reduce these minimum rights."},
          ].map((r,i)=>(
            <div key={i} className="rights-card"><h3>{r.title}</h3><p>{r.content}</p></div>
          ))}
          <div className="comp-t">
            <div className="comp-h">Large airline compensation at a glance</div>
            <div className="comp-r"><span className="lbl">Denied boarding (0–6h delay)</span><span className="amt">$900</span></div>
            <div className="comp-r"><span className="lbl">Denied boarding (9+h delay)</span><span className="amt">$2,400</span></div>
            <div className="comp-r"><span className="lbl">Delay/cancel in-control (3–6h)</span><span className="amt">$400</span></div>
            <div className="comp-r"><span className="lbl">Delay/cancel in-control (9+h)</span><span className="amt">$1,000</span></div>
            <div className="comp-r"><span className="lbl">Checked baggage liability</span><span className="amt">~$2,400</span></div>
          </div>
          <button className="btn" onClick={()=>goTo("claims")}>File a Claim →</button>
        </>}

      </div>

      <div className="tab-bar">
        {[
          {id:"home",    icon:"🏠",label:"Home"},
          {id:"flight",  icon:"🛫",label:"Flight"},
          {id:"evidence",icon:"🎙️",label:"Evidence"},
          {id:"claims",  icon:"🔗",label:"Claims"},
          {id:"rights",  icon:"📖",label:"Rights"},
        ].map(t=>(
          <div key={t.id} className={`tab ${active===t.id?"active":""}`} onClick={()=>goTo(t.id)}>
            <span className="ti2">{t.icon}</span>
            <span className="tl">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  </>);
}
