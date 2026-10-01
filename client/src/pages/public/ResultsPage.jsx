import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaSearch, FaGraduationCap, FaPhoneAlt, FaHashtag,
  FaSpinner, FaTimesCircle, FaListOl, FaPrint, FaFilePdf,
} from 'react-icons/fa'
import api from '../../services/api'
import LOGO from '../../assets/logo.js'

const TABS = [
  { key:'phone',  label:'Phone Number', Icon:FaPhoneAlt, ph:'e.g. 9812345678 or +977...' },
  { key:'symbol', label:'Symbol No',    Icon:FaHashtag,  ph:'e.g. S001 or 23456' },
  { key:'roll',   label:'Roll No',      Icon:FaListOl,   ph:'e.g. 12' },
]
const EXAMS = ['1st Terminal','2nd Terminal','3rd Terminal','1st Term','2nd Term','Mid Term','Final Term','Annual','SEE Mock','Unit Test']

function generateYears() {
  const currentBS = new Date().getFullYear() + 57
  const years = []
  for (let y = currentBS + 1; y >= currentBS - 8; y--) years.push(String(y))
  return years
}
const YEARS = generateYears()

const GRADE_COLOR = {
  'A+':'#16a34a','A':'#22c55e','B+':'#2563eb','B':'#3b82f6',
  'C+':'#d97706','C':'#f59e0b','D+':'#ea580c','D':'#f97316',
  'E':'#dc2626','NG':'#ef4444','N':'#6b7280',
}

/* ════════════════════════════════════════════
   STANDARD MARKSHEET HTML (existing classes)
════════════════════════════════════════════ */
function buildStandardPrintHTML(result, logoSrc) {
  const pct    = result.percentage || 0
  const passed = result.passed !== false && pct >= 28
  const barCol = pct>=80?'#16a34a':pct>=60?'#2563eb':pct>=40?'#d97706':'#ef4444'
  const today  = new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})

  const subjectRows = (result.subjects || []).map((s, i) => {
    const fm=s.fm!=null?Number(s.fm):100, pm=s.pm!=null?Number(s.pm):40
    const th=s.th!=null?Number(s.th):0, pr=s.pr!=null?Number(s.pr):0
    const obt=s.total!=null?Number(s.total):th+pr
    const subPass=obt>=pm
    const gc=GRADE_COLOR[s.grade]||'#64748b'
    const bg=i%2===0?'#fff':'#f6fdf2'
    return `<tr style="background:${bg}">
      <td style="text-align:center;color:#666">${i+1}</td>
      <td style="text-align:left;font-weight:600">${s.name}</td>
      <td>${fm}</td><td>${pm}</td><td>${th}</td><td>${pr}</td>
      <td style="font-weight:700;color:${subPass?'#16a34a':'#ef4444'}">${obt}</td>
      <td><span style="background:${gc};color:#fff;padding:1px 5px;border-radius:3px;font-size:7.5px;font-weight:900">${s.grade||'—'}</span></td>
      <td style="color:${subPass?'#16a34a':'#ef4444'}">${subPass?'Pass':'Fail'}</td>
    </tr>`
  }).join('')

  const summaryBoxes = [
    ['Result',passed?'PASS':'FAIL',passed?'#16a34a':'#ef4444'],
    ['Percentage',`${pct}%`,barCol],
    ['Division',result.division||'—','#2563eb'],
    ['GPA',`${Number(result.gpa||0).toFixed(1)}`,'#54B435'],
  ].map(([l,v,c])=>`<div style="border:1px solid #e5e5e5;border-radius:8px;padding:6px 4px;text-align:center;flex:1">
    <div style="font-size:7px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">${l}</div>
    <div style="font-size:13px;font-weight:900;color:${c}">${v}</div>
  </div>`).join('')

  return `<!DOCTYPE html><html><head>
    <title>Marksheet – ${result.studentName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      @page{size:A5 portrait;margin:8mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Inter',sans-serif;background:#fff;color:#111;font-size:9.5px}
      .sheet{width:148mm;min-height:210mm}
      .lh{display:flex;align-items:center;gap:10px;margin-bottom:6px}
      .lh img{height:44px}
      .school-name{font-size:17px;font-weight:900;letter-spacing:-.3px}
      .school-sub{font-size:8.5px;color:#555}
      .divider{border-bottom:2px solid #222;margin-bottom:6px;padding-bottom:5px}
      .badge-wrap{text-align:center;margin-bottom:8px}
      .badge{display:inline-block;border:1.5px solid #222;border-radius:2px;padding:3px 14px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;margin-bottom:8px}
      .info-row{display:flex;gap:4px;border-bottom:1px dashed #ddd;padding-bottom:3px;font-size:8.5px}
      .info-lbl{font-weight:700;color:#555;min-width:72px;flex-shrink:0}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th,td{border:1px solid #bbb;padding:3px 4px;font-size:8px;text-align:center}
      th{background:#54B435;color:#fff;font-weight:700}
      .total-row td{background:#eafade;font-weight:900;font-size:8.5px}
      .summary{display:flex;gap:5px;margin-bottom:6px}
      .bar-bg{height:5px;border-radius:10px;background:#eee;overflow:hidden;margin-bottom:6px}
      .bar-fill{height:100%;border-radius:10px;background:${barCol};width:${Math.min(pct,100)}%}
      .remarks-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:5px 8px;margin-bottom:6px;font-size:8px}
      .sig{display:flex;justify-content:center;border-top:1px solid #ccc;padding-top:8px;margin-top:10px}
      .sig-inner{text-align:center;min-width:140px}
      .sig-line{border-top:1.5px solid #555;margin-top:22px;padding-top:3px}
      .sig-name{font-size:9px;font-weight:700;color:#333}
      .sig-sub{font-size:7.5px;color:#888}
      .footer{text-align:center;font-size:7px;color:#aaa;border-top:1px dashed #ddd;padding-top:4px;margin-top:6px}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style>
  </head><body>
  <div class="sheet">
    <div class="divider">
      <div class="lh"><img src="${logoSrc}" alt="Kidland School"/>
        <div><div class="school-name">Kidland School</div>
          <div class="school-sub">Kusunti, Lalitpur-13, Nepal</div>
          <div class="school-sub">Phone: 9841404920 / 01-5430237 | kidlandmontessori@gmail.com</div>
        </div>
      </div>
      <div class="badge-wrap"><span class="badge">${result.examType} Examination — ${result.academicYear} | Mark Sheet</span></div>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-lbl">Name:</span><span style="font-weight:600">${result.studentName}</span></div>
      <div class="info-row"><span class="info-lbl">Class:</span><span style="font-weight:600">${result.class}${result.section?' – Sec '+result.section:''}</span></div>
      <div class="info-row"><span class="info-lbl">Roll No:</span><span>${result.rollNo||'—'}</span></div>
      <div class="info-row"><span class="info-lbl">Symbol No:</span><span>${result.symbolNo||'—'}</span></div>
      <div class="info-row"><span class="info-lbl">Date:</span><span>${today}</span></div>
      <div class="info-row"><span class="info-lbl">Academic Year:</span><span>${result.academicYear}</span></div>
    </div>
    <table>
      <thead><tr><th>S.N.</th><th>Subjects</th><th>FM</th><th>PM</th><th>Theory</th><th>Practical</th><th>Obtained</th><th>Grade</th><th>Remarks</th></tr></thead>
      <tbody>${subjectRows}
        <tr class="total-row">
          <td colspan="2" style="text-align:center">TOTAL</td><td>${result.totalMarks||0}</td>
          <td colspan="3"></td><td style="color:#54B435">${result.obtainedMarks||0}</td><td colspan="2"></td>
        </tr>
      </tbody>
    </table>
    <div class="summary">${summaryBoxes}</div>
    <div style="display:flex;justify-content:space-between;font-size:7px;color:#888;margin-bottom:2px"><span>Overall Performance</span><span>${pct}% — ${result.grade||'—'}</span></div>
    <div class="bar-bg"><div class="bar-fill"></div></div>
    ${result.remarks?`<div class="remarks-box"><strong style="color:#92400e">Remarks:</strong> <span style="color:#b45309">${result.remarks}</span></div>`:''}
    <div class="sig"><div class="sig-inner"><div class="sig-line"><div class="sig-name">Principal</div><div class="sig-sub">Signature & Stamp</div></div></div></div>
    <div class="footer">This is a computer-generated marksheet. Kidland School, Kusunti, Lalitpur-13, Nepal</div>
  </div></body></html>`
}

/* ════════════════════════════════════════════
   SECONDARY (Grade 6–10) PROGRESS REPORT CARD
   Matches the Kidland School physical marksheet
════════════════════════════════════════════ */
function buildSecondaryPrintHTML(result, logoSrc) {
  const today = new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})
  const att   = result.attendance || {}
  const acts  = result.activities || []

  // Subject rows — up to 12 rows (fill with empty if fewer)
  const subs = [...(result.subjects||[])]
  while (subs.length < 9) subs.push(null)

  const subRows = subs.map((s,i)=>{
    if (!s||!s.name) return `<tr>
      <td style="color:#aaa">${i+1}</td>
      <td></td><td style="color:#999">4.0</td>
      <td></td><td></td><td></td><td></td>
    </tr>`
    const gc = GRADE_COLOR[s.finalGrade]||'#64748b'
    return `<tr style="background:${i%2===0?'#fff':'#f0fbff'}">
      <td>${i+1}</td>
      <td style="text-align:left;font-weight:600;padding-left:4px">${s.name}</td>
      <td style="color:#555">4.0</td>
      <td style="font-weight:700">${s.theoryGrade||'—'}</td>
      <td style="font-weight:700">${s.examGrade||'—'}</td>
      <td><span style="background:${gc};color:#fff;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:900">${s.finalGrade||'—'}</span></td>
      <td style="font-weight:700;font-family:monospace">${s.gradePoint!=null?Number(s.gradePoint).toFixed(2):'—'}</td>
    </tr>`
  }).join('')

  const avgGP = result.averageGP!=null?Number(result.averageGP).toFixed(3):'—'
  const avgGrade = result.averageGrade||'—'

  const actRows = [
    {topic:'Eng. Hand'},{topic:'Nep. Hand'},{topic:'ECA'},
    {topic:'Discipline'},{topic:'Neatness'},{topic:'Drawing'},
  ].map((def,i)=>{
    const act = acts.find(a=>a.topic===def.topic)||{}
    const gc  = GRADE_COLOR[act.grade]||'#aaa'
    return `<tr style="background:${i%2===0?'#fff':'#f8f8f8'}">
      <td style="color:#555;font-size:7.5px">${i+1}</td>
      <td style="text-align:left;padding-left:4px;font-size:7.5px">${def.topic}</td>
      <td>${act.grade?`<span style="background:${gc};color:#fff;padding:1px 4px;border-radius:3px;font-size:7.5px;font-weight:900">${act.grade}</span>`:''}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head>
    <title>Progress Report – ${result.studentName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      @page{size:A4 portrait;margin:8mm 8mm 6mm 8mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Inter',sans-serif;background:#fff;color:#111;font-size:8.5px}
      .sheet{width:100%;max-width:190mm}

      /* Header */
      .hdr{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px}
      .hdr img{height:50px}
      .hdr-emblem{width:50px;height:50px;display:flex;align-items:center;justify-content:center;
        border:2px solid #1a5c8a;border-radius:50%;font-size:7px;font-weight:900;color:#1a5c8a;text-align:center;padding:3px}
      .hdr-center{text-align:center;flex:1}
      .motto{font-size:8px;font-style:italic;color:#555;margin-bottom:1px}
      .school-name{font-size:22px;font-weight:900;color:#0a3d6b;letter-spacing:1px;line-height:1}
      .school-addr{font-size:7.5px;color:#555;margin-top:2px}
      .hdr-line{border-bottom:2.5px solid #0a3d6b;margin:4px 0}

      /* Exam title */
      .exam-title{text-align:center;font-size:12px;font-weight:700;color:#0a3d6b;margin-bottom:4px}
      .report-badge{text-align:center;margin-bottom:6px}
      .report-badge span{display:inline-block;background:#0a3d6b;color:#fff;padding:3px 20px;
        font-size:10px;font-weight:900;border-radius:2px;letter-spacing:.5px}

      /* Student info row */
      .stu-row{font-size:8.5px;margin-bottom:6px;border-bottom:1px solid #ccc;padding-bottom:4px}
      .stu-row span{font-weight:700}

      /* Two-column layout */
      .two-col{display:flex;gap:6px;align-items:flex-start}
      .col-left{flex:1.35}
      .col-right{width:130px;flex-shrink:0}

      /* Main subjects table */
      table.main-tbl{width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:0}
      table.main-tbl th{background:#0a3d6b;color:#fff;padding:3px 4px;border:1px solid #aaa;font-weight:700;font-size:7px;text-align:center}
      table.main-tbl td{border:1px solid #bbb;padding:2.5px 3px;text-align:center}
      .avg-row td{background:#e8f4fd;font-weight:900;border:1px solid #aaa}

      /* Grading system table */
      table.grade-tbl{width:100%;border-collapse:collapse;font-size:7px;margin-top:5px}
      table.grade-tbl caption{font-weight:900;font-size:8px;text-align:center;padding:3px;background:#ddd;border:1px solid #aaa}
      table.grade-tbl th{background:#eee;padding:2px 5px;border:1px solid #aaa;font-weight:700;text-align:center}
      table.grade-tbl td{padding:2px 5px;border:1px solid #bbb;text-align:center}

      /* Right column boxes */
      .box{border:1px solid #aaa;border-radius:2px;margin-bottom:5px}
      .box-title{background:#0a3d6b;color:#fff;font-weight:900;font-size:7.5px;text-align:center;padding:3px}
      table.att-tbl{width:100%;border-collapse:collapse;font-size:7.5px}
      table.att-tbl td{padding:2.5px 5px;border:1px solid #ddd}
      table.att-tbl td:first-child{color:#555}
      table.att-tbl td:last-child{font-weight:700;text-align:center;background:#f9f9f9}
      table.act-tbl{width:100%;border-collapse:collapse;font-size:7.5px}
      table.act-tbl th{background:#eee;padding:2px 4px;border:1px solid #ccc;font-size:7px;font-weight:700;text-align:center}
      table.act-tbl td{border:1px solid #ddd;padding:2px 4px;text-align:center}
      .comment-box{min-height:55px;padding:5px;font-style:italic;font-size:8px;color:#333;border-top:1px solid #eee}

      /* Signatures */
      .sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;border-top:1px solid #ccc;padding-top:6px}
      .sig-block{text-align:center;min-width:100px}
      .sig-line{border-top:1px solid #555;margin-top:20px;padding-top:3px;font-size:7.5px;font-weight:700}
      .note{text-align:center;font-size:7px;color:#888;margin-top:5px;font-style:italic}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style>
  </head><body>
  <div class="sheet">
    <!-- HEADER -->
    <div class="hdr">
      <img src="${logoSrc}" alt="Kidland School Logo"/>
      <div class="hdr-center">
        <div class="motto">"Duty, Honour, Country"</div>
        <div class="school-name">KIDLAND SCHOOL</div>
        <div class="school-addr">Ekantakuna, Lalitpur &nbsp;|&nbsp; Email: kidlandmontessori@gmail.com &nbsp;|&nbsp; Contact: 9841404920 / 01-5430237</div>
      </div>
      <div class="hdr-emblem">KIDLAND SCHOOL EST.</div>
    </div>
    <div class="hdr-line"></div>

    <div class="exam-title">${result.examType} Examination - ${result.academicYear}</div>
    <div class="report-badge"><span>Progress Report Card</span></div>

    <!-- Student Info -->
    <div class="stu-row">
      THE MARKED SECURED BY &nbsp;<span>${result.studentName}</span>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      CLASS &nbsp;<span>${result.class}</span>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      ROLL NO. &nbsp;<span>${result.rollNo||'—'}</span>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      ARE GIVEN BELOW :
    </div>

    <!-- Two-column body -->
    <div class="two-col">
      <!-- LEFT: Subjects table -->
      <div class="col-left">
        <table class="main-tbl">
          <thead>
            <tr>
              <th rowspan="2" style="width:18px">S.N.</th>
              <th rowspan="2" style="text-align:left;padding-left:4px">Subjects</th>
              <th rowspan="2">Total<br/>Grade</th>
              <th colspan="2">Obtained Grade</th>
              <th rowspan="2">Final<br/>Grade</th>
              <th rowspan="2">Grade<br/>Point</th>
            </tr>
            <tr>
              <th>Th</th><th>Ex</th>
            </tr>
          </thead>
          <tbody>
            ${subRows}
            <tr class="avg-row">
              <td colspan="6" style="text-align:right;padding-right:6px">Average Grade Point</td>
              <td style="color:#0a3d6b">${avgGP}</td>
            </tr>
            <tr class="avg-row">
              <td colspan="6" style="text-align:right;padding-right:6px">Average Grade</td>
              <td>${avgGrade?`<span style="background:${GRADE_COLOR[avgGrade]||'#555'};color:#fff;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:900">${avgGrade}</span>`:''}</td>
            </tr>
          </tbody>
        </table>

        <!-- Grading System table -->
        <table class="grade-tbl">
          <caption>Grading System</caption>
          <thead><tr><th>Grade</th><th>Percentage</th><th>Grade</th><th>Percentage</th></tr></thead>
          <tbody>
            <tr><td>A+</td><td>Above 90 %</td><td>C</td><td>40 % - 49 %</td></tr>
            <tr><td>A</td><td>80 % - 89 %</td><td>D+</td><td>30 % - 39 %</td></tr>
            <tr><td>B+</td><td>70 % - 79 %</td><td>D</td><td>20 % - 29 %</td></tr>
            <tr><td>B</td><td>60 % - 69 %</td><td>E</td><td>1 % - 19 %</td></tr>
            <tr><td>C+</td><td>50 % - 59 %</td><td>N</td><td>0</td></tr>
          </tbody>
        </table>
      </div>

      <!-- RIGHT: Attendance + Activities + Comment -->
      <div class="col-right">
        <!-- Attendance -->
        <div class="box">
          <div class="box-title">Attendence</div>
          <table class="att-tbl">
            <tr><td>School Days</td><td>${att.schoolDays||'—'}</td></tr>
            <tr><td>Present Days</td><td>${att.presentDays||'—'}</td></tr>
            <tr><td>Absent Days</td><td>${att.absentDays||Math.max(0,(att.schoolDays||0)-(att.presentDays||0))}</td></tr>
          </table>
        </div>

        <!-- Additional Activities -->
        <div class="box">
          <div class="box-title">Additional Activities</div>
          <table class="act-tbl">
            <thead><tr><th>S.N</th><th>Topic</th><th>Grade</th></tr></thead>
            <tbody>${actRows}</tbody>
          </table>
        </div>

        <!-- Teacher's Comment -->
        <div class="box">
          <div class="box-title">Teacher's Comment</div>
          <div class="comment-box">${result.teacherComment||''}</div>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-block"><div class="sig-line">Class Teacher</div></div>
      <div style="font-size:7.5px;text-align:center;color:#444">
        Date of Issue: <strong>${result.dateOfIssue||today}</strong>
      </div>
      <div class="sig-block"><div class="sig-line">Principal</div></div>
    </div>
    <div class="note">Note: Please feel free to contact school's administration for any complaints regarding your marks.</div>
  </div>
  </body></html>`
}

/* ════════════════════════════════════════════
   STANDARD MARKSHEET COMPONENT
════════════════════════════════════════════ */
function StandardMarksheet({ result }) {
  const pct    = result.percentage || 0
  const passed = result.passed !== false && pct >= 28
  const barCol = pct>=80?'#16a34a':pct>=60?'#2563eb':pct>=40?'#d97706':'#ef4444'
  const today  = new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})
  const tdBase = 'border border-gray-300 text-center'

  const handlePrint = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const win=window.open('','_blank')
    win.document.write(buildStandardPrintHTML(result,logoSrc))
    win.document.close()
    setTimeout(()=>{win.focus();win.print();win.close()},600)
  }
  const handlePDF = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const html=buildStandardPrintHTML(result,logoSrc).replace('</body>',`<script>window.onload=function(){window.print()}<\/script></body>`)
    const blob=new Blob([html],{type:'text/html;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const win=window.open(url,'_blank')
    if(!win){const a=document.createElement('a');a.href=url;a.target='_blank';a.click()}
    setTimeout(()=>URL.revokeObjectURL(url),10000)
  }

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 w-full"
      style={{maxWidth:760,margin:'0 auto'}}>
      <div className="flex justify-end gap-2 px-4 pt-3 pb-0">
        <button onClick={handlePDF} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-0.5" style={{background:'#dc2626'}}>
          <FaFilePdf size={10}/> Download PDF
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-0.5" style={{background:'#54B435'}}>
          <FaPrint size={10}/> Print
        </button>
      </div>
      <div className="px-5 pt-3 pb-5" style={{fontSize:11}}>
        <div className="border-b-2 border-gray-800 pb-3 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <img src={LOGO} alt="Kidland School" style={{height:46,width:'auto',objectFit:'contain',flexShrink:0}}/>
            <div>
              <div className="font-black text-gray-900" style={{fontSize:17,letterSpacing:'-0.3px'}}>Kidland School</div>
              <div className="font-medium text-gray-600" style={{fontSize:9.5}}>Kusunti, Lalitpur-13, Nepal</div>
              <div className="text-gray-500" style={{fontSize:8.5}}>Phone: 9841404920 / 01-5430237 | kidlandmontessori@gmail.com</div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="inline-block border-2 border-gray-800 rounded px-5 py-1 font-black text-gray-900 uppercase tracking-wide" style={{fontSize:9.5}}>
              {result.examType} Examination — {result.academicYear} | Mark Sheet
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-3" style={{fontSize:9.5}}>
          {[['Name',result.studentName],['Class',`${result.class}${result.section?' – Sec '+result.section:''}`],
            ['Roll No',result.rollNo||'—'],['Symbol No',result.symbolNo||'—'],
            ['Date',today],['Academic Year',result.academicYear]].map(([l,v])=>(
            <div key={l} className="flex gap-2 border-b border-dashed border-gray-200 pb-1">
              <span className="font-bold text-gray-500 shrink-0" style={{minWidth:72}}>{l}:</span>
              <span className="font-semibold text-gray-900">{v}</span>
            </div>
          ))}
        </div>
        <table className="w-full border-collapse border border-gray-400 mb-3" style={{fontSize:8.5}}>
          <thead>
            <tr style={{background:'#54B435'}}>
              {['S.N.','Subjects','FM','PM','Theory','Practical','Obtained','Grade','Remarks'].map(h=>(
                <th key={h} className="border border-gray-300 text-white font-bold text-center" style={{padding:'3px 4px'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(result.subjects||[]).map((s,i)=>{
              const fm=s.fm!=null?Number(s.fm):100, pm=s.pm!=null?Number(s.pm):40
              const th=s.th!=null?Number(s.th):0, pr=s.pr!=null?Number(s.pr):0
              const obtained=s.total!=null?Number(s.total):th+pr
              const subPassed=obtained>=pm
              return (
                <tr key={i} style={{background:i%2===0?'#fff':'#f6fdf2'}}>
                  <td className={tdBase} style={{padding:'3px 4px',color:'#666'}}>{i+1}</td>
                  <td className="border border-gray-300 font-semibold text-gray-900" style={{padding:'3px 5px',textAlign:'left'}}>{s.name}</td>
                  <td className={tdBase} style={{padding:'3px 4px',color:'#374151'}}>{fm}</td>
                  <td className={tdBase} style={{padding:'3px 4px',color:'#374151'}}>{pm}</td>
                  <td className={tdBase} style={{padding:'3px 4px',color:'#374151'}}>{th}</td>
                  <td className={tdBase} style={{padding:'3px 4px',color:'#374151'}}>{pr}</td>
                  <td className={tdBase} style={{padding:'3px 4px',fontWeight:700,color:subPassed?'#16a34a':'#ef4444'}}>{obtained}</td>
                  <td className={tdBase} style={{padding:'3px 4px'}}>
                    <span className="font-black rounded px-1" style={{background:GRADE_COLOR[s.grade]||'#64748b',color:'#fff',fontSize:7.5}}>{s.grade||'—'}</span>
                  </td>
                  <td className={tdBase} style={{padding:'3px 4px',color:subPassed?'#16a34a':'#ef4444'}}>{subPassed?'Pass':'Fail'}</td>
                </tr>
              )
            })}
            <tr style={{background:'#eafade'}}>
              <td colSpan={2} className="border border-gray-400 text-center font-black text-gray-900" style={{padding:'3px 5px',fontSize:9}}>TOTAL</td>
              <td className="border border-gray-400 text-center font-black text-gray-900" style={{padding:'3px 4px',fontSize:9}}>{result.totalMarks??0}</td>
              <td colSpan={3} className="border border-gray-400" style={{padding:'3px 4px'}}/>
              <td className="border border-gray-400 text-center font-black" style={{padding:'3px 4px',color:'#54B435',fontSize:9}}>{result.obtainedMarks??0}</td>
              <td colSpan={2} className="border border-gray-400" style={{padding:'3px 4px'}}/>
            </tr>
          </tbody>
        </table>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[['Result',passed?'PASS':'FAIL',passed?'#16a34a':'#ef4444'],['Percentage',`${pct}%`,barCol],
            ['Division',result.division||'—','#2563eb'],['GPA',`${Number(result.gpa||0).toFixed(1)}`,'#54B435']].map(([l,v,col])=>(
            <div key={l} className="border border-gray-200 rounded-lg text-center" style={{padding:'5px 3px'}}>
              <div className="font-bold text-gray-400 uppercase" style={{fontSize:7,letterSpacing:.4,marginBottom:2}}>{l}</div>
              <div className="font-black" style={{fontSize:13,color:col}}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-gray-500 mb-1" style={{fontSize:8}}>
            <span>Overall Performance</span><span>{pct}% — {result.grade||'—'}</span>
          </div>
          <div className="rounded-full bg-gray-100 overflow-hidden" style={{height:5}}>
            <motion.div initial={{width:0}} animate={{width:`${Math.min(pct,100)}%`}} transition={{duration:1.2,ease:'easeOut'}}
              className="h-full rounded-full" style={{background:barCol}}/>
          </div>
        </div>
        {result.remarks&&(
          <div className="rounded-lg bg-amber-50 border border-amber-200 mb-3" style={{padding:'5px 8px',fontSize:8.5}}>
            <span className="font-bold text-amber-700">Remarks: </span>
            <span className="text-amber-600">{result.remarks}</span>
          </div>
        )}
        <div className="flex justify-center border-t border-gray-300 pt-3 mt-4">
          <div className="text-center" style={{minWidth:140}}>
            <div className="border-t-2 border-gray-700 mt-10 pt-1.5">
              <div className="font-bold text-gray-800" style={{fontSize:9}}>Principal</div>
              <div className="text-gray-400" style={{fontSize:7.5}}>Signature &amp; Stamp</div>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 border-t border-dashed border-gray-200 mt-3 pt-2" style={{fontSize:7.5}}>
          This is a computer-generated marksheet. Kidland School, Kusunti, Lalitpur-13, Nepal
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   SECONDARY MARKSHEET COMPONENT (Grade 6–10)
   Exact replica of the Kidland Progress Report Card
════════════════════════════════════════════ */
function SecondaryMarksheet({ result }) {
  const att  = result.attendance || {}
  const acts = result.activities || []

  const handlePrint = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const win=window.open('','_blank')
    win.document.write(buildSecondaryPrintHTML(result,logoSrc))
    win.document.close()
    setTimeout(()=>{win.focus();win.print();win.close()},600)
  }
  const handlePDF = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const html=buildSecondaryPrintHTML(result,logoSrc).replace('</body>',`<script>window.onload=function(){window.print()}<\/script></body>`)
    const blob=new Blob([html],{type:'text/html;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const win=window.open(url,'_blank')
    if(!win){const a=document.createElement('a');a.href=url;a.target='_blank';a.click()}
    setTimeout(()=>URL.revokeObjectURL(url),10000)
  }

  const TD = 'border border-gray-400 text-center'
  const avgGP   = result.averageGP!=null?Number(result.averageGP).toFixed(3):'—'
  const avgGrade = result.averageGrade||'—'

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 w-full"
      style={{maxWidth:880,margin:'0 auto'}}>

      {/* Print/PDF buttons */}
      <div className="flex justify-end gap-2 px-4 pt-3 pb-0">
        <button onClick={handlePDF} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:-translate-y-0.5 transition-all" style={{background:'#dc2626'}}>
          <FaFilePdf size={10}/> Download PDF
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:-translate-y-0.5 transition-all" style={{background:'#0a3d6b'}}>
          <FaPrint size={10}/> Print Report Card
        </button>
      </div>

      {/* ── Card Body ── */}
      <div className="px-5 pt-3 pb-5">

        {/* Header */}
        <div className="border-b-2 pb-2 mb-2" style={{borderColor:'#0a3d6b'}}>
          <div className="flex items-center justify-between gap-2">
            <img src={LOGO} alt="Kidland School" style={{height:50,width:'auto',objectFit:'contain',flexShrink:0}}/>
            <div className="text-center flex-1">
              <div className="italic text-gray-500" style={{fontSize:8}}>"Duty, Honour, Country"</div>
              <div className="font-black" style={{fontSize:20,color:'#0a3d6b',letterSpacing:1,lineHeight:1.1}}>KIDLAND SCHOOL</div>
              <div className="text-gray-500 mt-0.5" style={{fontSize:7.5}}>
                Ekantakuna, Lalitpur &nbsp;|&nbsp; Email: kidlandmontessori@gmail.com &nbsp;|&nbsp; Contact: 9841404920 / 01-5430237
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0" style={{borderColor:'#0a3d6b'}}>
              <span className="font-black text-center" style={{fontSize:7,color:'#0a3d6b',lineHeight:1.2}}>KIDLAND</span>
            </div>
          </div>
        </div>

        {/* Exam Title */}
        <div className="text-center font-bold mb-1" style={{fontSize:12,color:'#0a3d6b'}}>
          {result.examType} Examination - {result.academicYear}
        </div>
        <div className="text-center mb-3">
          <span className="inline-block text-white font-black px-8 py-1 rounded" style={{background:'#0a3d6b',fontSize:10,letterSpacing:.5}}>
            Progress Report Card
          </span>
        </div>

        {/* Student info row */}
        <div className="flex items-center gap-6 border-b border-gray-400 pb-2 mb-3" style={{fontSize:9}}>
          <span>THE MARKED SECURED BY &nbsp;<strong style={{borderBottom:'1px solid #333'}}>&nbsp;{result.studentName}&nbsp;</strong></span>
          <span>CLASS &nbsp;<strong style={{borderBottom:'1px solid #333'}}>&nbsp;{result.class}&nbsp;</strong></span>
          <span>ROLL NO. &nbsp;<strong style={{borderBottom:'1px solid #333'}}>&nbsp;{result.rollNo||'—'}&nbsp;</strong></span>
          <span style={{marginLeft:'auto'}}>ARE GIVEN BELOW :</span>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-3 items-start">

          {/* LEFT: Subjects table */}
          <div className="flex-1">
            <table className="w-full border-collapse border border-gray-400 mb-0" style={{fontSize:8}}>
              <thead>
                <tr style={{background:'#0a3d6b'}}>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px',width:22}} rowSpan={2}>S.N.</th>
                  <th className="border border-gray-300 text-white text-left" style={{padding:'3px 5px'}} rowSpan={2}>Subjects</th>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px',width:40}} rowSpan={2}>Total<br/>Grade</th>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px'}} colSpan={2}>Obtained Grade</th>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px',width:42}} rowSpan={2}>Final<br/>Grade</th>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px',width:48}} rowSpan={2}>Grade<br/>Point</th>
                </tr>
                <tr style={{background:'#0a3d6b'}}>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px',width:28}}>Th</th>
                  <th className="border border-gray-300 text-white" style={{padding:'3px 2px',width:28}}>Ex</th>
                </tr>
              </thead>
              <tbody>
                {/* Subject rows — always show at least 9 rows */}
                {Array.from({length:Math.max(9,result.subjects?.length||0)}).map((_,i)=>{
                  const s=(result.subjects||[])[i]
                  if(!s||!s.name) return (
                    <tr key={i} style={{background:i%2===0?'#fff':'#f0f8ff'}}>
                      <td className={TD} style={{padding:'3px 2px',color:'#aaa',fontSize:7}}>{i+1}</td>
                      <td className="border border-gray-300" style={{padding:'3px 5px',minWidth:80}}/>
                      <td className={TD} style={{padding:'3px 2px',color:'#aaa',fontSize:7}}>4.0</td>
                      <td className={TD} style={{padding:'3px 2px'}}/><td className={TD} style={{padding:'3px 2px'}}/>
                      <td className={TD} style={{padding:'3px 2px'}}/><td className={TD} style={{padding:'3px 2px'}}/>
                    </tr>
                  )
                  const gc=GRADE_COLOR[s.finalGrade]||'#64748b'
                  return (
                    <tr key={i} style={{background:i%2===0?'#fff':'#f0f8ff'}}>
                      <td className={TD} style={{padding:'3px 2px',color:'#555',fontSize:7}}>{i+1}</td>
                      <td className="border border-gray-300 font-semibold text-gray-900" style={{padding:'3px 5px',textAlign:'left'}}>{s.name}</td>
                      <td className={TD} style={{padding:'3px 2px',color:'#555',fontSize:7}}>4.0</td>
                      <td className={TD} style={{padding:'3px 2px',fontWeight:700}}>{s.theoryGrade||'—'}</td>
                      <td className={TD} style={{padding:'3px 2px',fontWeight:700}}>{s.examGrade||'—'}</td>
                      <td className={TD} style={{padding:'3px 2px'}}>
                        {s.finalGrade&&<span className="font-black rounded" style={{background:gc,color:'#fff',fontSize:7.5,padding:'1px 4px'}}>{s.finalGrade}</span>}
                      </td>
                      <td className={TD} style={{padding:'3px 2px',fontWeight:700,fontFamily:'monospace'}}>
                        {s.gradePoint!=null?Number(s.gradePoint).toFixed(2):'—'}
                      </td>
                    </tr>
                  )
                })}
                {/* Average rows */}
                <tr style={{background:'#e8f4fd'}}>
                  <td colSpan={6} className="border border-gray-400 text-right font-black pr-2" style={{padding:'3px 8px 3px 2px',fontSize:8}}>
                    Average Grade Point
                  </td>
                  <td className="border border-gray-400 text-center font-black" style={{padding:'3px 2px',color:'#0a3d6b',fontSize:8}}>{avgGP}</td>
                </tr>
                <tr style={{background:'#e8f4fd'}}>
                  <td colSpan={6} className="border border-gray-400 text-right font-black pr-2" style={{padding:'3px 8px 3px 2px',fontSize:8}}>
                    Average Grade
                  </td>
                  <td className="border border-gray-400 text-center" style={{padding:'3px 2px'}}>
                    {avgGrade&&<span className="font-black rounded" style={{background:GRADE_COLOR[avgGrade]||'#555',color:'#fff',fontSize:8,padding:'1px 6px'}}>{avgGrade}</span>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Grading System table */}
            <table className="w-full border-collapse border border-gray-400 mt-2" style={{fontSize:7.5}}>
              <caption className="font-black bg-gray-200 border border-gray-400 border-b-0" style={{fontSize:8,padding:'2px',captionSide:'top'}}>
                Grading System
              </caption>
              <thead style={{background:'#eee'}}>
                <tr><th className="border border-gray-400 px-2 py-1">Grade</th><th className="border border-gray-400 px-2 py-1">Percentage</th>
                    <th className="border border-gray-400 px-2 py-1">Grade</th><th className="border border-gray-400 px-2 py-1">Percentage</th></tr>
              </thead>
              <tbody>
                {[['A+','Above 90 %','C','40 % - 49 %'],['A','80 % - 89 %','D+','30 % - 39 %'],
                  ['B+','70 % - 79 %','D','20 % - 29 %'],['B','60 % - 69 %','E','1 % - 19 %'],
                  ['C+','50 % - 59 %','N','0']].map(([g1,p1,g2,p2],i)=>(
                  <tr key={i} style={{background:i%2===0?'#fff':'#f8f8f8'}}>
                    <td className="border border-gray-300 text-center font-bold" style={{padding:'2px 8px'}}>{g1}</td>
                    <td className="border border-gray-300 text-center" style={{padding:'2px 8px'}}>{p1}</td>
                    <td className="border border-gray-300 text-center font-bold" style={{padding:'2px 8px'}}>{g2}</td>
                    <td className="border border-gray-300 text-center" style={{padding:'2px 8px'}}>{p2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT: Attendance + Activities + Comment */}
          <div style={{width:150,flexShrink:0}}>
            {/* Attendance */}
            <div className="border border-gray-400 rounded mb-2">
              <div className="font-black text-white text-center py-1" style={{background:'#0a3d6b',fontSize:8}}>Attendence</div>
              <table className="w-full" style={{fontSize:8}}>
                {[['School Days',att.schoolDays||'—'],
                  ['Present Days',att.presentDays||'—'],
                  ['Absent Days',att.absentDays??Math.max(0,(att.schoolDays||0)-(att.presentDays||0))]].map(([l,v],i)=>(
                  <tr key={l} style={{background:i%2===0?'#fff':'#f8f8f8'}}>
                    <td className="border border-gray-200 px-2 py-1 text-gray-600">{l}</td>
                    <td className="border border-gray-200 px-2 py-1 text-center font-bold text-gray-800">{v}</td>
                  </tr>
                ))}
              </table>
            </div>

            {/* Additional Activities */}
            <div className="border border-gray-400 rounded mb-2">
              <div className="font-black text-white text-center py-1" style={{background:'#0a3d6b',fontSize:8}}>Additional Activities</div>
              <table className="w-full" style={{fontSize:7.5}}>
                <thead style={{background:'#f0f0f0'}}>
                  <tr><th className="border border-gray-300 px-1 py-1" style={{width:18}}>S.N</th>
                      <th className="border border-gray-300 px-1 py-1 text-left">Topic</th>
                      <th className="border border-gray-300 px-1 py-1">Grade</th></tr>
                </thead>
                <tbody>
                  {[{topic:'Eng. Hand'},{topic:'Nep. Hand'},{topic:'ECA'},{topic:'Discipline'},{topic:'Neatness'},{topic:'Drawing'}].map((def,i)=>{
                    const act=acts.find(a=>a.topic===def.topic)||{}
                    const gc=GRADE_COLOR[act.grade]||'#aaa'
                    return (
                      <tr key={i} style={{background:i%2===0?'#fff':'#f8f8f8'}}>
                        <td className="border border-gray-200 text-center text-gray-500" style={{padding:'2px 3px'}}>{i+1}</td>
                        <td className="border border-gray-200 text-left" style={{padding:'2px 4px'}}>{def.topic}</td>
                        <td className="border border-gray-200 text-center" style={{padding:'2px 3px'}}>
                          {act.grade&&<span className="font-black rounded" style={{background:gc,color:'#fff',fontSize:7,padding:'1px 3px'}}>{act.grade}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Teacher's Comment */}
            <div className="border border-gray-400 rounded">
              <div className="font-black text-white text-center py-1" style={{background:'#0a3d6b',fontSize:8}}>Teacher's Comment</div>
              <div className="p-2 italic text-gray-700" style={{fontSize:8,minHeight:55}}>
                {result.teacherComment||''}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex items-end justify-between border-t border-gray-400 pt-4 mt-4">
          <div className="text-center" style={{minWidth:120}}>
            <div className="border-t border-gray-600 mt-8 pt-1">
              <div className="font-bold text-gray-700" style={{fontSize:8.5}}>Class Teacher</div>
            </div>
          </div>
          <div className="text-center" style={{fontSize:8}}>
            <span className="text-gray-600">Date of Issue: &nbsp;</span>
            <strong className="text-gray-800">{result.dateOfIssue||new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})}</strong>
          </div>
          <div className="text-center" style={{minWidth:120}}>
            <div className="border-t border-gray-600 mt-8 pt-1">
              <div className="font-bold text-gray-700" style={{fontSize:8.5}}>Principal</div>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 mt-2" style={{fontSize:7,fontStyle:'italic'}}>
          Note: Please feel free to contact school's administration for any complaints regarding your marks.
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   PRE-PRIMARY REPORT CARD
   Playgroup / Infant / Toddler / Pre-School
════════════════════════════════════════════ */
const ACH_LABEL = { 4:'Outstanding', 3:'Good', 2:'Needs Improvement', 1:'Requires Support', 0:'Not Achieved' }
const ACH_COLOR = { 4:'#16a34a',     3:'#2563eb',  2:'#d97706',           1:'#ea580c',          0:'#dc2626' }

function buildPrePrimaryPrintHTML(result, logoSrc) {
  const att = result.attendance || {}
  const today = new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})
  const subRows = (result.subjects||[]).map((s,i)=>{
    const lv = Number(s.achievementLevel)||0
    const col = ACH_COLOR[lv]||'#6b7280'
    return `<tr style="background:${i%2===0?'#fff':'#f0fdf4'}">
      <td style="text-align:center;color:#666">${i+1}</td>
      <td style="text-align:left;font-weight:600;padding-left:5px">${s.name}</td>
      <td style="text-align:center">${s.assessment||0} / 50</td>
      <td style="text-align:center"><span style="background:${col};color:#fff;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:900">${lv} – ${ACH_LABEL[lv]||'—'}</span></td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head>
    <title>Report – ${result.studentName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      @page{size:A5 portrait;margin:8mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Inter',sans-serif;font-size:9px;background:#fff;color:#111}
      .hdr{display:flex;align-items:center;gap:10px;margin-bottom:4px}
      .hdr img{height:44px}
      .school-name{font-size:16px;font-weight:900;color:#1a4d0a}
      .badge{display:inline-block;background:#1a4d0a;color:#fff;padding:2px 14px;border-radius:2px;font-size:9px;font-weight:900;margin-bottom:6px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;margin-bottom:6px;border:1px solid #d1fae5;border-radius:6px;padding:5px 8px;background:#f0fdf4}
      .info-row{display:flex;gap:4px;font-size:8.5px;padding:1.5px 0}
      .lbl{font-weight:700;color:#555;min-width:70px;flex-shrink:0}
      table{width:100%;border-collapse:collapse;margin-bottom:7px}
      th,td{border:1px solid #ccc;padding:3px 4px;font-size:8px;text-align:center}
      th{background:#1a4d0a;color:#fff;font-weight:700}
      .sect-title{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;margin:5px 0 3px;color:#1a4d0a;border-left:3px solid #1a4d0a;padding-left:5px}
      .ach-table td{padding:2.5px 6px}
      .eval-row{display:flex;gap:10px;margin-bottom:7px}
      .eval-box{flex:1;border:1px solid #d1fae5;border-radius:6px;padding:5px 8px;text-align:center;background:#f0fdf4}
      .eval-label{font-size:7.5px;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:2px}
      .eval-val{font-size:14px;font-weight:900;color:#1a4d0a}
      .sig{display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:8px;margin-top:8px}
      .sig-block{text-align:center;min-width:90px}
      .sig-line{border-top:1px solid #555;margin-top:18px;padding-top:2px;font-size:8px;font-weight:700}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style>
  </head><body>
    <div class="hdr">
      <img src="${logoSrc}" alt="Kidland"/>
      <div>
        <div class="school-name">Kidland School</div>
        <div style="font-size:8px;color:#555">Kusunti, Lalitpur-13 | 9841404920 | kidlandmontessori@gmail.com</div>
      </div>
    </div>
    <div style="border-bottom:2px solid #1a4d0a;margin-bottom:5px"></div>
    <div style="text-align:center;margin-bottom:5px">
      <div style="font-size:11px;font-weight:700;color:#1a4d0a">${result.examType} Examination — ${result.academicYear}</div>
      <span class="badge">Pre-Primary Progress Report</span>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="lbl">Name:</span><strong>${result.studentName}</strong></div>
      <div class="info-row"><span class="lbl">Class:</span><strong>${result.class}</strong></div>
      <div class="info-row"><span class="lbl">Roll No:</span><span>${result.rollNo||'—'}</span></div>
      <div class="info-row"><span class="lbl">Age:</span><span>${result.studentAge||'—'}</span></div>
      <div class="info-row"><span class="lbl">Height:</span><span>${result.studentHeight||'—'} cm</span></div>
      <div class="info-row"><span class="lbl">Weight:</span><span>${result.studentWeight||'—'} kg</span></div>
      <div class="info-row"><span class="lbl">School Days:</span><span>${att.schoolDays||'—'}</span></div>
      <div class="info-row"><span class="lbl">Present Days:</span><span>${att.presentDays||'—'}</span></div>
    </div>
    ${result.subjects?.length ? `
    <div class="sect-title">Subject Assessment</div>
    <table>
      <thead><tr><th>S.N.</th><th>Subject</th><th>Score / 50</th><th>Achievement Level</th></tr></thead>
      <tbody>${subRows}</tbody>
    </table>` : ''}
    <div class="eval-row">
      <div class="eval-box"><div class="eval-label">Montessori Evaluation</div><div class="eval-val">${result.montessoriTotal||0}<span style="font-size:9px;font-weight:400;color:#666"> / 25</span></div></div>
      <div class="eval-box"><div class="eval-label">Extra Evaluation</div><div class="eval-val">${result.extraTotal||0}<span style="font-size:9px;font-weight:400;color:#666"> / 25</span></div></div>
    </div>
    <div class="sect-title">Achievement Level Key</div>
    <table class="ach-table" style="margin-bottom:6px">
      <thead><tr><th>Level</th><th>Description</th><th>Level</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td style="font-weight:900;color:#16a34a">4</td><td>Outstanding</td><td style="font-weight:900;color:#ea580c">1</td><td>Requires Support</td></tr>
        <tr><td style="font-weight:900;color:#2563eb">3</td><td>Good</td><td style="font-weight:900;color:#dc2626">0</td><td>Not Achieved</td></tr>
        <tr><td style="font-weight:900;color:#d97706">2</td><td>Needs Improvement</td><td></td><td></td></tr>
      </tbody>
    </table>
    ${result.remarks?`<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:5px;padding:4px 7px;font-size:8px;margin-bottom:6px"><strong>Remark:</strong> ${result.remarks}</div>`:''}
    <div class="sig">
      <div class="sig-block"><div class="sig-line">Class Teacher</div></div>
      <div style="font-size:7.5px;text-align:center;color:#444;align-self:flex-end">Date: <strong>${today}</strong></div>
      <div class="sig-block"><div class="sig-line">Principal</div></div>
    </div>
  </body></html>`
}

function PrePrimaryMarksheet({ result }) {
  const att = result.attendance || {}
  const handlePrint = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const win=window.open('','_blank'); win.document.write(buildPrePrimaryPrintHTML(result,logoSrc)); win.document.close(); setTimeout(()=>{win.focus();win.print();win.close()},600)
  }
  const handlePDF = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const html=buildPrePrimaryPrintHTML(result,logoSrc).replace('</body>',`<script>window.onload=function(){window.print()}<\/script></body>`)
    const blob=new Blob([html],{type:'text/html;charset=utf-8'}); const url=URL.createObjectURL(blob); window.open(url,'_blank'); setTimeout(()=>URL.revokeObjectURL(url),10000)
  }

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100 w-full"
      style={{maxWidth:720,margin:'0 auto'}}>
      <div className="flex justify-end gap-2 px-4 pt-3">
        <button onClick={handlePDF} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:-translate-y-0.5 transition-all" style={{background:'#dc2626'}}><FaFilePdf size={10}/> PDF</button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:-translate-y-0.5 transition-all" style={{background:'#1a4d0a'}}><FaPrint size={10}/> Print</button>
      </div>
      <div className="px-5 pb-5 pt-2">
        {/* Header */}
        <div className="border-b-2 pb-3 mb-3" style={{borderColor:'#1a4d0a'}}>
          <div className="flex items-center gap-3 mb-2">
            <img src={LOGO} alt="Kidland School" style={{height:44,objectFit:'contain',flexShrink:0}}/>
            <div>
              <div className="font-black" style={{fontSize:16,color:'#1a4d0a'}}>Kidland School</div>
              <div className="text-gray-500" style={{fontSize:8.5}}>Kusunti, Lalitpur-13 | 9841404920 | kidlandmontessori@gmail.com</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold mb-1" style={{fontSize:11,color:'#1a4d0a'}}>{result.examType} Examination — {result.academicYear}</div>
            <span className="inline-block text-white font-black px-6 py-1 rounded" style={{background:'#1a4d0a',fontSize:9}}>Pre-Primary Progress Report</span>
          </div>
        </div>

        {/* Student Info */}
        <div className="mb-4 rounded-xl border border-green-200 overflow-hidden bg-green-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-green-100 text-xs">
            <div className="p-2.5 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Student Name</span><span className="font-black text-gray-900 text-sm">{result.studentName}</span></div>
            <div className="p-2.5 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class / Roll No</span><span className="font-bold text-gray-800">{result.class} {result.rollNo ? `(Roll: ${result.rollNo})` : ''}</span></div>
            <div className="p-2.5 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Age / Height / Weight</span><span className="font-bold text-gray-800">{result.studentAge || '—'} | {result.studentHeight ? `${result.studentHeight}cm` : '—'} / {result.studentWeight ? `${result.studentWeight}kg` : '—'}</span></div>
            <div className="p-2.5 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">School Days</span><span className="font-bold text-gray-800">{att.schoolDays || '—'}</span></div>
            <div className="p-2.5 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Present Days</span><span className="font-bold text-green-700">{att.presentDays || '—'}</span></div>
            <div className="p-2.5 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Absent Days</span><span className="font-bold text-red-600">{att.absentDays ?? Math.max(0, (att.schoolDays || 0) - (att.presentDays || 0))}</span></div>
          </div>
        </div>

        {/* Subjects */}
        {result.subjects?.length>0&&(
          <>
            <div className="font-black uppercase text-green-800 border-l-4 border-green-600 pl-2 mb-2" style={{fontSize:9,letterSpacing:.4}}>Subject Assessment</div>
            <table className="w-full border-collapse border border-gray-400 mb-4" style={{fontSize:8.5}}>
              <thead><tr style={{background:'#1a4d0a'}}>
                {['S.N.','Subject','Score / 50','Achievement Level'].map(h=><th key={h} className="border border-gray-300 text-white font-bold text-center" style={{padding:'3px 5px'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {result.subjects.map((s,i)=>{
                  const lv=Number(s.achievementLevel)||0; const col=ACH_COLOR[lv]||'#6b7280'
                  return (
                    <tr key={i} style={{background:i%2===0?'#fff':'#f0fdf4'}}>
                      <td className="border border-gray-300 text-center text-gray-500" style={{padding:'3px 4px'}}>{i+1}</td>
                      <td className="border border-gray-300 font-semibold" style={{padding:'3px 6px',textAlign:'left'}}>{s.name}</td>
                      <td className="border border-gray-300 text-center font-bold" style={{padding:'3px 5px'}}>{s.assessment||0}<span className="text-gray-400 font-normal"> / 50</span></td>
                      <td className="border border-gray-300 text-center" style={{padding:'3px 5px'}}>
                        <span className="font-black rounded px-2 py-0.5 text-white" style={{background:col,fontSize:8}}>{lv} — {ACH_LABEL[lv]}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Eval boxes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[['Montessori Evaluation',result.montessoriTotal||0],['Extra Evaluation',result.extraTotal||0]].map(([l,v])=>(
            <div key={l} className="border border-green-200 rounded-xl text-center p-4 bg-green-50">
              <div className="font-bold text-green-800 uppercase mb-1" style={{fontSize:8}}>{l}</div>
              <div className="font-black" style={{fontSize:22,color:'#1a4d0a'}}>{v}<span className="text-gray-400 font-normal text-sm"> / 25</span></div>
            </div>
          ))}
        </div>

        {/* Achievement Key */}
        <div className="font-black uppercase text-green-800 border-l-4 border-green-600 pl-2 mb-2" style={{fontSize:9}}>Achievement Level Key</div>
        <table className="w-full border-collapse border border-gray-300 mb-4" style={{fontSize:8}}>
          <thead style={{background:'#eee'}}><tr><th className="border border-gray-300 px-3 py-1.5">Level</th><th className="border border-gray-300 px-3 py-1.5">Description</th><th className="border border-gray-300 px-3 py-1.5">Level</th><th className="border border-gray-300 px-3 py-1.5">Description</th></tr></thead>
          <tbody>
            {[['4','Outstanding','1','Requires Support'],['3','Good','0','Not Achieved'],['2','Needs Improvement','','']].map(([l1,d1,l2,d2],i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#f9f9f9'}}>
                <td className="border border-gray-300 text-center font-black py-1" style={{color:ACH_COLOR[Number(l1)]||'#333'}}>{l1}</td>
                <td className="border border-gray-300 px-3 py-1">{d1}</td>
                <td className="border border-gray-300 text-center font-black py-1" style={{color:ACH_COLOR[Number(l2)]||'#333'}}>{l2}</td>
                <td className="border border-gray-300 px-3 py-1">{d2}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {result.remarks&&<div className="bg-amber-50 border border-amber-200 rounded-lg mb-4 px-3 py-2" style={{fontSize:8.5}}><strong className="text-amber-700">Remark: </strong><span className="text-amber-600">{result.remarks}</span></div>}

        {/* Signatures */}
        <div className="flex items-end justify-between border-t border-gray-300 pt-4">
          <div className="text-center" style={{minWidth:100}}><div className="border-t border-gray-600 mt-10 pt-1 font-bold text-gray-700" style={{fontSize:8.5}}>Class Teacher</div></div>
          <div className="text-center" style={{fontSize:8}}><span className="text-gray-600">Date: </span><strong>{new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})}</strong></div>
          <div className="text-center" style={{minWidth:100}}><div className="border-t border-gray-600 mt-10 pt-1 font-bold text-gray-700" style={{fontSize:8.5}}>Principal</div></div>
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   PRIMARY REPORT CARD — Class 1–5
   Assessment(50) + Assignments(25) + ECA(25)
════════════════════════════════════════════ */
function buildPrimaryPrintHTML(result, logoSrc) {
  const att = result.attendance || {}
  const eca = result.eca || {}
  const today = new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})

  const subRows = (result.subjects||[]).map((s,i)=>{
    const asgn = s.assignmentTotal ?? ((Number(s.cwHw)||0)+(Number(s.subAttendance)||0)+(Number(s.projectWork)||0)+(Number(s.reading)||0)+(Number(s.learningAchievement)||0))
    const tot  = s.subjectTotal ?? ((Number(s.assessment)||0)+asgn)
    const pct  = tot/75*100
    const level = pct>=76?4:pct>=51?3:pct>=26?2:pct>=1?1:0
    const col   = ACH_COLOR[level]||'#6b7280'
    return `<tr style="background:${i%2===0?'#fff':'#f0fdf4'}">
      <td>${i+1}</td>
      <td style="text-align:left;font-weight:600;padding-left:4px">${s.name}</td>
      <td>${s.assessment||0}</td>
      <td>${s.cwHw||0}</td><td>${s.subAttendance||0}</td><td>${s.projectWork||0}</td><td>${s.reading||0}</td><td>${s.learningAchievement||0}</td>
      <td style="font-weight:700">${asgn}</td>
      <td style="font-weight:900;color:#1a4d0a">${tot}</td>
      <td><span style="background:${col};color:#fff;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:900">${level} – ${ACH_LABEL[level]||'—'}</span></td>
    </tr>`
  }).join('')

  const ecaItems=[['Dance',eca.dance||0,eca.danceDisc||0],['Music',eca.music||0,eca.musicDisc||0],['Karate',eca.karate||0,eca.karateDisc||0],['Handwriting',eca.handwriting||0,eca.handwritingDisc||0],['Creativity',eca.creativity||0,eca.creativityDisc||0]]
  const ecaRows=ecaItems.map(([l,a,d])=>`<td style="font-size:7.5px">${l}<br/><span style="font-weight:900">${a+d}/5</span></td>`).join('')

  return `<!DOCTYPE html><html><head>
    <title>Report Card – ${result.studentName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
      @page{size:A4 portrait;margin:7mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Inter',sans-serif;font-size:8px;background:#fff;color:#111}
      .hdr{display:flex;align-items:center;gap:10px;margin-bottom:4px}
      .hdr img{height:46px}
      .school-name{font-size:18px;font-weight:900;color:#1a4d0a}
      table{width:100%;border-collapse:collapse;margin-bottom:6px}
      th,td{border:1px solid #bbb;padding:2.5px 3px;font-size:7.5px;text-align:center}
      th{background:#1a4d0a;color:#fff;font-weight:700}
      .info-row{display:grid;grid-template-columns:repeat(4,1fr);gap:2px 10px;margin-bottom:6px;font-size:8px;background:#f0fdf4;padding:5px 8px;border-radius:5px;border:1px solid #d1fae5}
      .info-cell{display:flex;gap:4px}<br/>.info-lbl{font-weight:700;color:#555}
      .sect{font-size:9px;font-weight:900;text-transform:uppercase;color:#1a4d0a;border-left:3px solid #1a4d0a;padding-left:5px;margin:5px 0 3px}
      .sig{display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:6px;margin-top:8px}
      .sig-block{text-align:center;min-width:80px}
      .sig-line{border-top:1px solid #555;margin-top:16px;padding-top:2px;font-size:7.5px;font-weight:700}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style>
  </head><body>
    <div class="hdr"><img src="${logoSrc}" alt="Kidland"/>
      <div>
        <div class="school-name">Kidland School</div>
        <div style="font-size:8px;color:#555">Kusunti, Lalitpur-13 | 9841404920 | kidlandmontessori@gmail.com</div>
      </div>
    </div>
    <div style="border-bottom:2px solid #1a4d0a;margin-bottom:5px"></div>
    <div style="text-align:center;margin-bottom:5px">
      <div style="font-size:11px;font-weight:700;color:#1a4d0a">${result.examType} Examination — ${result.academicYear}</div>
      <span style="display:inline-block;background:#1a4d0a;color:#fff;padding:2px 16px;border-radius:2px;font-size:9px;font-weight:900">Progress Report Card — Class 1–5</span>
    </div>
    <div class="info-row">
      <div class="info-cell"><span class="info-lbl">Name:</span><strong>${result.studentName}</strong></div>
      <div class="info-cell"><span class="info-lbl">Class:</span><strong>${result.class}${result.section?' – Sec '+result.section:''}</strong></div>
      <div class="info-cell"><span class="info-lbl">Roll No:</span><span>${result.rollNo||'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">Age:</span><span>${result.studentAge||'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">Blood Group:</span><span>${result.studentBloodGroup||'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">Height:</span><span>${result.studentHeight?result.studentHeight+' cm':'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">Weight:</span><span>${result.studentWeight?result.studentWeight+' kg':'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">School Days:</span><span>${att.schoolDays||'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">Present Days:</span><span>${att.presentDays||'—'}</span></div>
      <div class="info-cell"><span class="info-lbl">Absent Days:</span><span>${att.absentDays??Math.max(0,(att.schoolDays||0)-(att.presentDays||0))}</span></div>
    </div>
    <div class="sect">Assessment (50) + Assignments (25) = 75 per subject</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">S.N.</th><th rowspan="2" style="text-align:left;padding-left:4px">Subject</th>
          <th rowspan="2">Assess<br/>(50)</th>
          <th colspan="5">Assignment Score (25)</th>
          <th rowspan="2">Total<br/>Asgn</th><th rowspan="2">Grand<br/>Total<br/>(75)</th><th rowspan="2">Level</th>
        </tr>
        <tr>
          <th>CW/HW<br/>(6)</th><th>Attend<br/>(4)</th><th>Project<br/>(5)</th><th>Reading<br/>(5)</th><th>L.Ach<br/>(5)</th>
        </tr>
      </thead>
      <tbody>${subRows}</tbody>
    </table>
    <div class="sect">ECA — Extra Curricular Activities (25 total)</div>
    <table style="margin-bottom:4px">
      <thead><tr><th>Activity</th><th>Marks /5</th><th>Activity</th><th>Marks /5</th><th>Activity</th><th>Marks /5</th><th>Activity</th><th>Marks /5</th><th>Activity</th><th>Marks /5</th><th>ECA Total /25</th></tr></thead>
      <tbody><tr>
        ${ecaItems.map(([l,a,d])=>`<td style="text-align:left;padding-left:4px">${l}</td><td style="font-weight:900;color:#1a4d0a">${a+d}</td>`).join('')}
        <td style="font-weight:900;font-size:12px;color:#1a4d0a">${eca.ecaTotal||ecaItems.reduce((s,[,a,d])=>s+a+d,0)}</td>
      </tr></tbody>
    </table>
    <table class="ach-key" style="width:auto;margin-bottom:6px">
      <caption style="font-weight:900;font-size:8px;text-align:left;padding:2px 0;color:#1a4d0a">Achievement Level Key</caption>
      <thead><tr><th style="width:30px">Level</th><th>Description</th><th style="width:30px">Level</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td style="color:#16a34a;font-weight:900">4</td><td>Outstanding (76–100%)</td><td style="color:#d97706;font-weight:900">2</td><td>Needs Improvement (26–50%)</td></tr>
        <tr><td style="color:#2563eb;font-weight:900">3</td><td>Good (51–75%)</td><td style="color:#ea580c;font-weight:900">1</td><td>Requires Support (1–25%)</td></tr>
      </tbody>
    </table>
    ${result.remarks?`<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;padding:3px 7px;font-size:8px;margin-bottom:5px"><strong>Remark:</strong> ${result.remarks}</div>`:''}
    </div>
  </body></html>`
}

function PrimaryMarksheet({ result }) {
  const att = result.attendance || {}
  const eca = result.eca || {}
  const ecaTotal = eca.ecaTotal ?? ((Number(eca.dance)||0)+(Number(eca.danceDisc)||0)+(Number(eca.music)||0)+(Number(eca.musicDisc)||0)+(Number(eca.karate)||0)+(Number(eca.karateDisc)||0)+(Number(eca.handwriting)||0)+(Number(eca.handwritingDisc)||0)+(Number(eca.creativity)||0)+(Number(eca.creativityDisc)||0))

  const handlePrint = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const win=window.open('','_blank'); win.document.write(buildPrimaryPrintHTML(result,logoSrc)); win.document.close(); setTimeout(()=>{win.focus();win.print();win.close()},600)
  }
  const handlePDF = () => {
    const logoSrc=(document.querySelector('img[alt="Kidland School"]'))?.src||''
    const html=buildPrimaryPrintHTML(result,logoSrc).replace('</body>',`<script>window.onload=function(){window.print()}<\/script></body>`)
    const blob=new Blob([html],{type:'text/html;charset=utf-8'}); const url=URL.createObjectURL(blob); window.open(url,'_blank'); setTimeout(()=>URL.revokeObjectURL(url),10000)
  }

  const TD='border border-gray-400 text-center'
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100 w-full"
      style={{maxWidth:880,margin:'0 auto'}}>
      <div className="flex justify-end gap-2 px-6 pt-4">
        <button onClick={handlePDF} className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-white hover:-translate-y-0.5 transition-all shadow-sm" style={{background:'#dc2626'}}><FaFilePdf size={11}/> Download PDF</button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-white hover:-translate-y-0.5 transition-all shadow-sm" style={{background:'#1a4d0a'}}><FaPrint size={11}/> Print Report Card</button>
      </div>
      <div className="px-6 pb-6 pt-2">
        {/* Header */}
        <div className="border-b-2 pb-4 mb-4" style={{borderColor:'#1a4d0a'}}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <img src={LOGO} alt="Kidland School" style={{height:52,objectFit:'contain',flexShrink:0}}/>
              <div>
                <div className="font-black" style={{fontSize:20,color:'#1a4d0a',letterSpacing:-0.3}}>Kidland School</div>
                <div className="text-gray-500 font-medium" style={{fontSize:9.5}}>Kusunti, Lalitpur-13 | 9841404920 | kidlandmontessori@gmail.com</div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-black text-green-900 uppercase tracking-wider">Official Marksheet</div>
              <div className="text-[10px] text-gray-400">Govt. Registered Institution</div>
            </div>
          </div>
          <div className="text-center mt-3">
            <div className="font-bold mb-1" style={{fontSize:13,color:'#1a4d0a'}}>{result.examType} Examination — {result.academicYear}</div>
            <span className="inline-block text-white font-black px-8 py-1.5 rounded-lg shadow-sm" style={{background:'#1a4d0a',fontSize:11,letterSpacing:0.5}}>Progress Report Card — Class 1–5</span>
          </div>
        </div>

        {/* Student Info */}
        <div className="mb-5 rounded-xl border border-green-200 overflow-hidden bg-green-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-green-100 text-xs">
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Student Name</span><span className="font-black text-gray-900 text-sm">{result.studentName}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class / Section</span><span className="font-bold text-gray-800 text-sm">{result.class}{result.section ? ` – Sec ${result.section}` : ''}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Roll No / Symbol</span><span className="font-bold text-gray-800">{result.rollNo || '—'} {result.symbolNo ? `(${result.symbolNo})` : ''}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Age / Blood Group</span><span className="font-bold text-gray-800">{result.studentAge || '—'} | {result.studentBloodGroup || '—'}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Height / Weight</span><span className="font-bold text-gray-800">{result.studentHeight ? `${result.studentHeight} cm` : '—'} / {result.studentWeight ? `${result.studentWeight} kg` : '—'}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">School Days</span><span className="font-bold text-gray-800">{att.schoolDays || '—'}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Present Days</span><span className="font-bold text-green-700">{att.presentDays || '—'}</span></div>
            <div className="p-3 bg-white"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Absent Days</span><span className="font-bold text-red-600">{att.absentDays ?? Math.max(0, (att.schoolDays || 0) - (att.presentDays || 0))}</span></div>
          </div>
        </div>

        {/* Subjects + Assignments table */}
        <div className="font-black uppercase text-green-800 border-l-4 border-green-600 pl-2 mb-2 text-xs">
          Assessment (50) + Assignments (25) = 75 per subject
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm mb-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse border border-gray-400 text-xs text-center" style={{ minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#1a4d0a' }}>
                <th className="border border-gray-300 text-white p-2.5" style={{ width: '4%' }} rowSpan={2}>S.N.</th>
                <th className="border border-gray-300 text-white text-left p-2.5" style={{ width: '22%', minWidth: 120 }} rowSpan={2}>Subject</th>
                <th className="border border-gray-300 text-white p-2.5" style={{ width: '10%' }} rowSpan={2}>Assess<br/>(50)</th>
                <th className="border border-gray-300 text-white p-1.5 text-center" colSpan={5}>Assignment Score (25)</th>
                <th className="border border-gray-300 text-white p-2.5" style={{ width: '9%' }} rowSpan={2}>Asgn<br/>Total</th>
                <th className="border border-gray-300 text-white p-2.5" style={{ width: '10%' }} rowSpan={2}>Grand<br/>Total (75)</th>
                <th className="border border-gray-300 text-white p-2.5" style={{ width: '15%' }} rowSpan={2}>Level</th>
              </tr>
              <tr style={{ background: '#2d6a1a' }}>
                {['CW/HW (6)', 'Attend (4)', 'Project (5)', 'Reading (5)', 'L.Ach (5)'].map(h => (
                  <th key={h} className="border border-gray-300 text-white p-1.5 text-center text-[10px]" style={{ width: '6%' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(result.subjects || []).map((s, i) => {
                const asgn = s.assignmentTotal ?? ((Number(s.cwHw) || 0) + (Number(s.subAttendance) || 0) + (Number(s.projectWork) || 0) + (Number(s.reading) || 0) + (Number(s.learningAchievement) || 0))
                const tot = s.subjectTotal ?? ((Number(s.assessment) || 0) + asgn)
                const pct = (tot / 75) * 100
                const level = pct >= 76 ? 4 : pct >= 51 ? 3 : pct >= 26 ? 2 : pct >= 1 ? 1 : 0
                const col = ACH_COLOR[level] || '#6b7280'
                const bg = i % 2 === 0 ? 'bg-white' : 'bg-green-50/40'
                return (
                  <tr key={i} className={`${bg} hover:bg-green-50/80 transition-colors`}>
                    <td className="border border-gray-300 text-center text-gray-500 p-2 font-medium">{i + 1}</td>
                    <td className="border border-gray-300 font-bold text-gray-900 text-left p-2.5 whitespace-nowrap">{s.name}</td>
                    <td className="border border-gray-300 text-center font-bold p-2 text-gray-800 bg-green-50/30">{s.assessment || 0}</td>
                    <td className="border border-gray-300 text-center p-2 text-gray-600">{s.cwHw || 0}</td>
                    <td className="border border-gray-300 text-center p-2 text-gray-600">{s.subAttendance || 0}</td>
                    <td className="border border-gray-300 text-center p-2 text-gray-600">{s.projectWork || 0}</td>
                    <td className="border border-gray-300 text-center p-2 text-gray-600">{s.reading || 0}</td>
                    <td className="border border-gray-300 text-center p-2 text-gray-600">{s.learningAchievement || 0}</td>
                    <td className="border border-gray-300 text-center font-bold p-2 text-gray-800">{asgn}</td>
                    <td className="border border-gray-300 text-center font-black p-2 text-green-800 text-sm bg-green-50/50">{tot}</td>
                    <td className="border border-gray-300 text-center p-2">
                      <span className="inline-block font-black rounded-md text-white text-[10px] px-2.5 py-1 whitespace-nowrap shadow-2xs" style={{ background: col }}>
                        {level} — {ACH_LABEL[level]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ECA */}
        <div className="font-black uppercase text-green-800 border-l-4 border-green-600 pl-2 mb-2" style={{fontSize:9}}>
          Extra Curricular Activities (ECA) — Total: {ecaTotal} / 25
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {[['Dance',eca.dance,eca.danceDisc],['Music',eca.music,eca.musicDisc],['Karate',eca.karate,eca.karateDisc],['Handwriting',eca.handwriting,eca.handwritingDisc],['Creativity',eca.creativity,eca.creativityDisc]].map(([l,a,d])=>{
            const t=(Number(a)||0)+(Number(d)||0)
            return (
              <div key={l} className="border border-green-200 rounded-xl text-center p-2.5 bg-green-50/80 shadow-2xs">
                <div className="font-bold text-green-800 mb-1" style={{fontSize:8.5}}>{l}</div>
                <div className="font-black" style={{fontSize:15,color:'#1a4d0a'}}>{t}<span className="text-gray-400 font-normal text-xs">/5</span></div>
                <div className="text-gray-500 mt-0.5" style={{fontSize:7.5}}>Act:{Number(a)||0} + Disc:{Number(d)||0}</div>
              </div>
            )
          })}
        </div>

        {/* Achievement Key */}
        <table className="w-full border-collapse border border-gray-300 mb-4" style={{fontSize:8}}>
          <thead style={{background:'#eee'}}><tr><th className="border border-gray-300 px-3 py-1.5">Level</th><th className="border border-gray-300 px-3 py-1.5">Description</th><th className="border border-gray-300 px-3 py-1.5">Level</th><th className="border border-gray-300 px-3 py-1.5">Description</th></tr></thead>
          <tbody>
            {[['4','Outstanding (76–100%)','2','Needs Improvement (26–50%)'],['3','Good (51–75%)','1','Requires Support (1–25%)']].map(([l1,d1,l2,d2],i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#f9f9f9'}}>
                <td className="border border-gray-300 text-center font-black py-1" style={{color:ACH_COLOR[Number(l1)]}}>{l1}</td>
                <td className="border border-gray-300 px-3 py-1">{d1}</td>
                <td className="border border-gray-300 text-center font-black py-1" style={{color:ACH_COLOR[Number(l2)]}}>{l2}</td>
                <td className="border border-gray-300 px-3 py-1">{d2}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {result.remarks&&<div className="bg-amber-50 border border-amber-200 rounded-lg mb-4 px-3 py-2" style={{fontSize:8.5}}><strong className="text-amber-700">Remark: </strong><span className="text-amber-600">{result.remarks}</span></div>}

        <div className="flex items-end justify-between border-t border-gray-300 pt-4">
          <div className="text-center" style={{minWidth:110}}><div className="border-t border-gray-600 mt-10 pt-1 font-bold text-gray-700" style={{fontSize:8.5}}>Class Teacher</div></div>
          <div className="text-center" style={{fontSize:8}}><span className="text-gray-600">Date: </span><strong>{new Date().toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'})}</strong></div>
          <div className="text-center" style={{minWidth:110}}><div className="border-t border-gray-600 mt-10 pt-1 font-bold text-gray-700" style={{fontSize:8.5}}>Principal</div></div>
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   AUTO-DETECT marksheet type and render
════════════════════════════════════════════ */
const PRE_PRIMARY_NAMES = ['Playgroup','Infant','Toddler','Pre-School','Nursery','LKG','UKG']
function SmartMarksheet({ result }) {
  const cls = result.class || ''
  const mType = result.marksheetType
  const n = parseInt(cls.replace(/[^0-9]/g,''))
  if (mType==='preprimary' || PRE_PRIMARY_NAMES.includes(cls)) return <PrePrimaryMarksheet result={result}/>
  if (mType==='primary'    || (n>=1&&n<=5))  return <PrimaryMarksheet result={result}/>
  if (mType==='secondary'  || (n>=6&&n<=10)) return <SecondaryMarksheet result={result}/>
  return <StandardMarksheet result={result}/>
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function ResultsPage() {
  const [tab,      setTab]      = useState('symbol')
  const [query,    setQuery]    = useState('')
  const [examType, setExamType] = useState('')
  const [year,     setYear]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [results,  setResults]  = useState(null)
  const [error,    setError]    = useState('')

  const search = async () => {
    if (!query.trim()) { setError('Please enter a value to search'); return }
    setError(''); setLoading(true); setResults(null)
    try {
      const params = {}
      if (examType) params.examType     = examType
      if (year)     params.academicYear = year
      if (tab==='phone')  params.phone    = query.trim().replace(/\D/g,'').replace(/^977/,'')
      if (tab==='symbol') params.symbolNo = query.trim()
      if (tab==='roll')   params.rollNo   = query.trim()
      const r = await api.get('/results/lookup', { params })
      const list = r?.data || []
      setResults(list)
      if (!list.length) setError('No results found. Please check your details.')
    } catch(e) {
      setError(e.response?.data?.message || e?.message || 'No results found. Please verify your details and try again.')
    }
    setLoading(false)
  }

  const handleKey = e => { if (e.key==='Enter') search() }

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{background:'linear-gradient(135deg,#0f2d06 0%,#1f6b0f 55%,#54B435 100%)',paddingTop:44,paddingBottom:44}}>
        <div style={{position:'absolute',top:-60,right:-60,width:280,height:280,borderRadius:'50%',background:'rgba(255,255,255,0.04)'}}/>
        <div style={{position:'absolute',bottom:-80,left:-40,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.03)'}}/>
        <motion.div className="text-center relative z-10" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h1 className="font-black text-white mb-2.5" style={{fontSize:'clamp(26px,4.8vw,42px)',letterSpacing:'-0.02em'}}>
            Check Your Result
          </h1>
          <p className="text-white/80 max-w-md mx-auto px-4" style={{fontSize:15}}>
            Enter your Phone number, Symbol number, or Roll number to view your official exam results
          </p>
        </motion.div>
      </div>

      <section className="py-9 min-h-screen" style={{background:'linear-gradient(180deg,#f0fde8 0%,#f8fef5 60%)'}}>
        <div style={{maxWidth:480,margin:'0 auto',padding:'0 14px'}}>

          {/* Lookup card */}
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="bg-white rounded-3xl overflow-hidden mb-5 border border-green-100"
            style={{boxShadow:'0 18px 50px rgba(84,180,53,0.12),0 4px 14px rgba(0,0,0,0.05)'}}>

            <div className="px-5 py-4 flex items-center gap-3" style={{background:'linear-gradient(135deg,#134e06,#54B435)'}}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{background:'rgba(255,255,255,0.2)'}}>
                <FaGraduationCap size={18} className="text-white"/>
              </div>
              <div>
                <div className="font-black text-white" style={{fontSize:16}}>Result Lookup</div>
                <div className="text-white/90 text-xs mt-0.5">Kidland School — Official Result Portal</div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Tabs */}
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2.5">Search By</p>
                <div className="grid grid-cols-3 gap-2">
                  {TABS.map(t=>(
                    <button key={t.key}
                      onClick={()=>{setTab(t.key);setQuery('');setResults(null);setError('')}}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-[11px] font-bold transition-all justify-center"
                      style={tab===t.key
                        ?{background:'linear-gradient(135deg,#276514,#54B435)',color:'#fff',boxShadow:'0 6px 16px rgba(84,180,53,0.32)'}
                        :{background:'#f7f7f7',color:'#777',border:'1.5px solid #ececec'}}>
                      <t.Icon size={11}/> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{color:'#276514'}}>
                  {TABS.find(t=>t.key===tab)?.label}
                </label>
                <div className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all" style={{border:'2px solid #e5e5e5'}}
                  onFocus={e=>e.currentTarget.style.borderColor='#54B435'} onBlur={e=>e.currentTarget.style.borderColor='#e5e5e5'}>
                  {(()=>{const T=TABS.find(t=>t.key===tab);return <T.Icon size={15} style={{color:'#54B435',flexShrink:0}}/>})()}
                  <input value={query} onChange={e=>{setQuery(e.target.value);setError('')}} onKeyDown={handleKey}
                    placeholder={TABS.find(t=>t.key===tab)?.ph}
                    className="flex-1 text-sm outline-none text-gray-800 bg-transparent placeholder-gray-400" autoComplete="off"/>
                  {query&&(<button onClick={()=>{setQuery('');setResults(null);setError('')}} className="text-gray-400 hover:text-gray-600"><FaTimesCircle size={13}/></button>)}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Exam Type</label>
                  <select value={examType} onChange={e=>setExamType(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none bg-white transition-colors"
                    onFocus={e=>e.target.style.borderColor='#54B435'} onBlur={e=>e.target.style.borderColor='#f3f4f6'}>
                    <option value="">All Exams</option>
                    {EXAMS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Academic Year</label>
                  <input
                    type="text"
                    list="client-academic-years"
                    value={year}
                    onChange={e=>setYear(e.target.value)}
                    placeholder="Type or select year (e.g. 2083)"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none bg-white transition-colors placeholder-gray-400"
                    onFocus={e=>e.target.style.borderColor='#54B435'} onBlur={e=>e.target.style.borderColor='#f3f4f6'}
                    autoComplete="off"
                  />
                  <datalist id="client-academic-years">
                    {YEARS.map(y=><option key={y} value={y}/>)}
                  </datalist>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error&&(
                  <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <FaTimesCircle size={14} className="shrink-0 mt-0.5"/>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search button */}
              <button onClick={search} disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-black text-white py-3.5 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 text-sm"
                style={{background:'linear-gradient(135deg,#276514,#54B435)',boxShadow:'0 6px 20px rgba(84,180,53,0.4)'}}>
                {loading?<><FaSpinner className="animate-spin"/>Searching…</>:<><FaSearch size={14}/>Check Result</>}
              </button>
            </div>
          </motion.div>

          {/* Marksheets */}
          <AnimatePresence>
            {results&&results.length>0&&(
              <div className="space-y-4">
                {results.length>1&&(
                  <div className="text-center text-sm font-semibold text-gray-500 py-2 px-4 bg-white rounded-xl border border-gray-100">
                    Found {results.length} result{results.length>1?'s':''} for this search
                  </div>
                )}
                {results.map((r,i)=><SmartMarksheet key={r._id||i} result={r}/>)}
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
