# -*- coding: utf-8 -*-
"""Build checklist HTML from F-INS-ST-DC3-01 PDF / Excel structure."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/templates/checklist-before-concrete-placement.html"

# Each item: (letter, description) — letter empty for sub-items
LEFT_ITEMS: list[tuple[str, str]] = [
    ("ก.", "สำรวจ (Survey)"),
    ("", "- ตำแหน่ง/ พิกัด (Location)"),
    ("", "- ระดับ (Elevation)"),
    ("", "- ขนาด/ มิติ (Dimension)"),
    ("", "- ทิศทาง (Direction)"),
    ("", "- ดิ่ง (Vertical line)"),
    ("ข.", "การเตรียมผิวหรือรอยต่อ (Surface Preparation)"),
    ("ค.", "งานไม้แบบ (Formwork)"),
    ("", "- ขนาด/ มิติ (Dimension)"),
    ("", "- ความมั่นคงแข็งแรงของไม้แบบ (Stability)"),
    ("", "- ความมั่นคงแข็งแรงของโครงสร้างรับแบบ (Falsework)"),
    ("", "- ความสะอาดของไม้แบบ (Formwork Surfaces)"),
    ("", "- การจัด Blockout ( incl. Bearing and exp.Joints )"),
    ("", "- การป้องกันฝน (Rain Protection)"),
    ("", "- การทาน้ำยาทาแบบ (Formwork Oil)"),
    ("", "- การติดตั้งบัวลบมุม (Chamfer Strips)"),
    ("", "- ความสะอาดครั้งสุดท้ายก่อนเท (Cleanliness)"),
    ("ง.", "งานเหล็กเสริม (Reinforcement)"),
    ("", "- ขนาด (Size)"),
    ("", "- ตำแหน่ง (Location)"),
    ("", "- ระยะห่าง (Spacing)"),
    ("", "- ระยะทาบ (Laps)"),
    ("", "- การมัดลวด (Tie Wires)"),
    ("", "- กำหนดระยะคอนกรีตหุ้มเหล็ก (Chairs and Spacers)"),
    ("", "- การงอเหล็ก (Hooks)"),
    ("จ.", "วัสดุที่ฝังอยู่ในคอนกรีต (Permanent Embedments)"),
    ("", "- สมอสลักเกลียว (Anchor Bolts)"),
    ("", "- เหล็กฝัง (Embedded Steel)"),
    ("", "- เหล็กฝังเพื่อติดตั้งไม้แบบ (Embedded for Formwork)"),
    ("", "- สมอยึดลวด (Anchorage Block)"),
    ("ฉ.", "แผ่นเหล็กพืดชั่วคราวในงานขุด (Temporary Sheet Pile for Excavation)"),
    ("", "ใช้"),
    ("", "ไม่ใช้"),
]

RIGHT_ITEMS: list[tuple[str, str]] = [
    ("ช.", "คอนกรีตอัดแรงกำลังสูง (Post - Tensioning)"),
    ("", "- ขนาดลวดอัดแรง (Size strands)"),
    ("", "- ตำแหน่ง จำนวนและแนวการจัดวางลวด Strand"),
    ("", "- การติดตั้งอุปกรณ์ต่างๆ ในระบบ Post - Tensioning"),
    ("", "- เหล็กเสริมกันระเบิดของหัวสมอยึด (Anchorage)"),
    ("", "- การจัดแนวท่อชีท (Corrugated Galvanized Sheath)"),
    ("", "- การติดตั้ง Spiral บริเวณหัว Anchorage"),
    ("", "- ไม่มีสิ่งกีดขวาง (Clear of Obstruction)"),
    ("ซ.", "การต่อลงดินของระบบไฟฟ้า (Earthing and Bonding System)"),
    ("", "- หลักดินในเสาเข็มเจาะ (earthing bar of bored pile)"),
    ("", "- การติดตั้งและให้เครื่องหมาย (installed & marked)"),
    ("", "- หลักดินในฐานราก (earthing bar of footing)"),
    ("", "- หลักดินในตอม่อ (earthing bar of pier)"),
    ("", "- การเชื่อมหลักดินเป็นไปตามแบบกำหนด (welding)"),
    ("", "- ขั้วต่อกราวด์ (Earthing Terminal)"),
    ("ณ.", "กล่องและแผงไฟ (Electrical Boxes & Panels)"),
    ("", "- ขนาด (Size)"),
    ("", "- ตำแหน่ง (Location)"),
    ("", "- จุดรองรับเพียงพอ (Adequate Support)"),
    ("", "- การยาแนวกับคอนกรีต (Sealed against Concrete)"),
    ("ญ.", "วัสดุกันซึม (Water Stop)"),
    ("", "- ขนาด/ ชนิด/ ตำแหน่ง (Size / Type / Location)"),
    ("ฎ.", "ท่อระบายน้ำ (Drainage Pipes)"),
    ("", "- ขนาด/ ชนิด/ ตำแหน่ง (Size / Type / Location)"),
    ("ฏ.", "ชุดขยายข้อต่อ (Expansion Joints)"),
    ("", "- ขนาด/ ชนิด/ ตำแหน่ง (Size / Type / Location)"),
    ("ฐ.", "แผ่นยางรองคอสะพาน (Bearing Pad)"),
    ("", "- ขนาด/ ชนิด/ ตำแหน่ง (Size / Type / Location)"),
    ("ฑ.", "อื่นๆ (Other Features (list))"),
    ("", "- การบดอัดทราย (Compacted Sand)"),
    ("", "- การเทลีน (Lean Concrete)"),
    ("", "- เหล็กเดือย (Dowel Bar)"),
    ("", "- สภาพหัวเสาเข็ม (Pile Head Condition)"),
    ("", "- ประเด็นเรื่องความปลอดภัยต่างๆ (Safety Issue)"),
]

# หัวข้อที่มีตัวอักษรและช่องติ๊กในบรรทัดเดียว (ไม่ใช่ colspan ทั้งครึ่ง)
CHECKABLE_SECTIONS = frozenset({"ข."})


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def item_class(letter: str, desc: str) -> str:
    if letter:
        return "sec"
    if desc.startswith("-") or desc in ("ใช้", "ไม่ใช้"):
        return "sub"
    if desc:
        return "sec"
    return "sub"


BOX_CELL = '<td class="c-box"></td>'


def section_title(letter: str, desc: str) -> str:
    letter = letter.strip()
    if letter:
        return f"{letter} {desc}".strip()
    return desc


def dept_cell() -> str:
    """คอลัมน์ส่วนงาน"""
    return '<td class="c-dept">RB/OP/BU/QC</td>'


def side_cell(letter: str, desc: str) -> str:
    if not letter and not desc:
        return (
            '<td class="c-desc" colspan="4"></td>'
            f"{BOX_CELL}{BOX_CELL}{BOX_CELL}"
            + dept_cell()
        )
    cls = item_class(letter, desc)
    if letter in CHECKABLE_SECTIONS:
        return (
            f'<td class="c-desc sec sec-head" colspan="4">{esc(section_title(letter, desc))}</td>'
            f"{BOX_CELL}{BOX_CELL}{BOX_CELL}"
            + dept_cell()
        )
    if cls == "sec":
        return (
            f'<td class="c-desc sec sec-head" colspan="8">{esc(section_title(letter, desc))}</td>'
        )
    return (
        f'<td class="c-desc {cls}" colspan="4">{esc(desc)}</td>'
        f"{BOX_CELL}{BOX_CELL}{BOX_CELL}"
        + dept_cell()
    )


def sign_pane(
    party: str,
    role_title: str,
    unit_key: str,
    date_key: str,
    *,
    pane_end: bool = False,
) -> str:
    pane_cls = " sig-pane--left" if pane_end else ""
    return f"""          <div class="sig-pane{pane_cls}" aria-label="{esc(party)}">
            <p class="sig-party">{esc(party)}</p>
            <div class="sig-body">
              <div class="sig-pad" aria-hidden="true"></div>
              <p class="sig-role">{esc(role_title)}</p>
              <p class="sig-unit">{unit_key}</p>
              <p class="sig-date"><span class="sig-date-lbl">วันที่ :</span> <span class="sig-date-val">{date_key}</span></p>
            </div>
          </div>"""


def body_rows() -> str:
    n = max(len(LEFT_ITEMS), len(RIGHT_ITEMS))
    lines: list[str] = []
    for i in range(n):
        l = LEFT_ITEMS[i] if i < len(LEFT_ITEMS) else ("", "")
        r = RIGHT_ITEMS[i] if i < len(RIGHT_ITEMS) else ("", "")
        row_cls = ""
        if item_class(*l) == "sub" or item_class(*r) == "sub":
            row_cls = ' class="sub-row"'
        lines.append(f"<tr{row_cls}>{side_cell(*l)}{side_cell(*r)}</tr>")
    return "\n".join(lines)


CSS = """
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    :root {
      --chk-border: 1px solid #000;
      --chk-head-bg: #e2e8f0;
      --chk-head-color: #0f172a;
      --chk-head-border: 1px solid #000;
    }
    html {
      font-size: 9pt;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    body {
      margin: 0;
      font-family: Sarabun, "TH Sarabun New", "Segoe UI", system-ui, sans-serif;
      font-size: 1rem;
      line-height: 1.25;
      color: #111827;
      background: #fff;
    }
    @media screen { body { background: #e2e8f0; padding: 10px; } }
    .a4-page {
      box-sizing: border-box;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 8mm 10mm 7mm;
      background: #fff;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
    }
    .sheet {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    @media print {
      html, body { width: 210mm; margin: 0; padding: 0; background: #fff; }
      .a4-page {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        padding: 8mm 10mm 7mm;
        box-shadow: none;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .sheet-header {
      margin-bottom: 6px;
      border-bottom: var(--chk-border);
      padding-bottom: 5px;
    }
    .project-name {
      margin: 0 auto 4px;
      max-width: 100%;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.35;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: fit-content;
      margin: 0 auto 4px;
    }
    .logos {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .logos img {
      display: block;
      height: 26px;
      width: auto;
      object-fit: contain;
    }
    .org-line {
      margin: 3px 0 0;
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
    }
    .doc-title-en {
      margin: 0 0 2px;
      font-size: 1.02rem;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .doc-title-th {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      text-align: center;
    }
    .meta-block {
      border: none;
      background: #fff;
      overflow: hidden;
    }
    .meta-block table.bordered {
      border: none;
      margin: 0;
    }
    .checklist-block {
      border: none;
      background: #fff;
      overflow: hidden;
    }
    .checklist-block table.bordered {
      border: none;
      margin: 0;
    }
    .checklist-block table.form {
      margin-bottom: 0;
      border-bottom: none;
    }
    .checklist-block .foot-legend {
      margin-top: -1px;
      border: none;
      border-top: var(--chk-border);
      border-left: var(--chk-border);
      border-right: var(--chk-border);
    }
    .checklist-block .foot-notes {
      border: none;
      border-top: var(--chk-border);
      border-left: var(--chk-border);
      border-right: var(--chk-border);
    }
    .checklist-block .sign-block {
      border: none;
      border-top: var(--chk-border);
      border-left: var(--chk-border);
      border-right: var(--chk-border);
      border-bottom: var(--chk-border);
    }
    .doc-section.meta-block { margin-top: 0; }
    .doc-section.meta-block + .doc-section.checklist-block { margin-top: 8px; }
    .doc-section.checklist-block + .doc-section.sheet-footer { margin-top: 8px; }
    table.bordered {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: none;
      background: #fff;
    }
    table.bordered td,
    table.bordered th {
      border: var(--chk-border);
      padding: 3px 5px;
      vertical-align: middle;
      font-weight: 400;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .doc-section { margin-bottom: 0; }
    .doc-section + .doc-section { margin-top: 8px; }
    table.meta-table {
      margin-bottom: 0;
    }
    table.meta-table td {
      border-left: none;
      border-right: none;
      border-top: none;
      border-bottom: none;
    }
    table.meta-table td.pane-end {
      border-right: none;
    }
    table.form {
      margin-bottom: 0;
    }
    table.form thead td {
      padding: 4px 5px;
      border-top: var(--chk-border);
      border-bottom: var(--chk-border);
      background: #fff;
      color: #111827;
      font-weight: 700;
    }
    table.form tbody tr.sub-row td.c-desc.sub {
      background: #fff;
    }
    table.form tbody tr.sub-row td.c-box,
    table.form tbody tr.sub-row td.c-dept {
      background: #fff;
    }
    table.form td.sec-head {
      font-weight: 700;
      padding: 4px 6px;
      vertical-align: middle;
      font-size: 0.86rem;
      line-height: 1.25;
      letter-spacing: 0.01em;
      background: #fff;
      color: #111827;
      border-top: var(--chk-border);
      border-bottom: var(--chk-border);
    }
    table.form tbody tr:first-child td.sec-head {
      border-top: none;
    }
    /* แบ่งครึ่งซ้าย–ขวา (คอลัมน์ที่ 8 ของแต่ละครึ่ง) */
    .checklist-block td.pane-end,
    table.form td:nth-child(8) {
      border-right: var(--chk-border);
    }
    table.form td.c-box,
    table.form td.c-dept {
      padding: 2px;
    }
    /* 8 คอลัมน์ต่อครึ่ง — รายการ 62% | NA/C/NC 7% แต่ละช่อง | ส่วนงาน 17% */
    col.cw-desc { width: 15.5%; }
    col.cw-desc2 { width: 15.5%; }
    col.cw-desc3 { width: 15.5%; }
    col.cw-desc4 { width: 15.5%; }
    col.cw-na { width: 7%; }
    col.cw-c { width: 7%; }
    col.cw-nc { width: 7%; }
    col.cw-dept { width: 17%; }
    .meta-field {
      font-size: 0.86rem;
      line-height: 1.3;
      padding: 4px 6px;
      min-height: 1.35em;
      vertical-align: bottom;
      background: #fff;
      color: #111827;
    }
    .meta-field .meta-lbl {
      font-weight: 700;
      white-space: nowrap;
    }
    .meta-field .meta-val {
      font-weight: 400;
    }
    .meta-field.meta-date { white-space: nowrap; }
    .meta-field.meta-spacer {
      padding: 0;
      min-height: 0;
    }
    table.meta-table tr + tr td {
      border-top: none;
    }
    .thead-label {
      text-align: left;
      font-size: 0.86rem;
      padding-left: 6px;
    }
    .thead-h {
      text-align: center;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
    }
    .thead-h.th-dept {
      font-size: 0.7rem;
      line-height: 1.15;
      padding: 3px 2px;
      letter-spacing: 0;
    }
    .c-desc {
      text-align: left;
      padding: 2px 5px;
      font-size: 0.8rem;
      line-height: 1.2;
    }
    .c-desc.sub {
      padding-left: 10px;
      color: #1e293b;
    }
    .c-box {
      text-align: center;
      vertical-align: middle;
      padding: 1px;
      min-width: 6mm;
      min-height: 4.5mm;
    }
    .c-dept {
      text-align: center;
      font-size: 0.62rem;
      line-height: 1.1;
      padding: 2px 1px;
      color: #475569;
      font-weight: 600;
      white-space: nowrap;
    }
    .sheet-footer {
      flex-shrink: 0;
      margin-top: auto;
    }
    .doc-section.sheet-footer { margin-top: 8px; }
    .foot-legend {
      padding: 5px 10px;
      margin: 0;
      background: #fff;
    }
    .foot-legend-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 3px 12px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 0.68rem;
      line-height: 1.35;
      color: #334155;
    }
    .foot-legend-list abbr {
      font-weight: 700;
      font-style: normal;
      color: #0f172a;
      text-decoration: none;
      margin-right: 0.2em;
    }
    .foot-notes {
      display: flex;
      flex-direction: column;
      border: none;
      background: #fff;
      overflow: hidden;
      font-size: 0.88rem;
      line-height: 1.3;
    }
    .foot-field {
      display: grid;
      grid-template-columns: 7.5em minmax(0, 1fr);
      column-gap: 10px;
      align-items: baseline;
      padding: 7px 12px;
    }
    .foot-field--grade {
      background: #fff;
      border-bottom: var(--chk-border);
      min-height: 2.4em;
    }
    .foot-field--remarks {
      align-items: start;
      padding: 8px 12px 10px;
      min-height: 4.5em;
    }
    .foot-label {
      grid-column: 1;
      font-weight: 700;
      font-size: 0.84rem;
      color: #111827;
      white-space: nowrap;
    }
    .foot-value {
      grid-column: 2;
      min-width: 0;
    }
    .foot-value--grade {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 4px 8px;
    }
    .grade-val {
      font-weight: 600;
      font-size: 0.92rem;
      color: #0f172a;
    }
    .foot-field--remarks .foot-label {
      padding-top: 2px;
    }
    .foot-remarks-body {
      min-height: 3.2em;
      line-height: 1.4;
      font-size: 0.88rem;
      color: #111827;
      overflow-wrap: anywhere;
      word-break: normal;
      white-space: pre-wrap;
    }
    .sign-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: none;
      background: #fff;
      overflow: hidden;
    }
    .sig-pane {
      display: flex;
      flex-direction: column;
      min-height: 26mm;
      padding: 0;
      text-align: center;
    }
    .sig-pane--left {
      border-right: var(--chk-border);
    }
    .sig-party {
      margin: 0;
      padding: 4px 8px;
      font-size: 0.84rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--chk-head-color);
      background: var(--chk-head-bg);
      border-bottom: var(--chk-border);
    }
    .sig-body {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      width: 100%;
      padding: 6px 12px 8px;
      min-height: 0;
    }
    .sig-pad {
      flex: 1 1 auto;
      width: 72%;
      max-width: 58mm;
      min-height: 12mm;
      margin: 2px auto 8px;
      border-bottom: var(--chk-border);
    }
    .sig-role {
      margin: 0 0 2px;
      font-size: 0.86rem;
      font-weight: 700;
      line-height: 1.3;
      color: #111827;
    }
    .sig-unit {
      margin: 0 0 4px;
      font-size: 0.78rem;
      font-weight: 600;
      line-height: 1.25;
      color: #475569;
      letter-spacing: 0.01em;
    }
    .sig-date {
      margin: 0;
      width: 100%;
      font-size: 0.78rem;
      line-height: 1.25;
      color: #111827;
    }
    .sig-date-lbl {
      font-weight: 700;
    }
    .sig-date-val {
      font-weight: 400;
    }
    .doc-foot {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
      align-items: baseline;
      gap: 6px 10px;
      padding: 5px 10px 6px;
      border-top: var(--chk-border);
      background: #fff;
      font-size: 0.72rem;
      line-height: 1.35;
      color: #1e293b;
    }
    .doc-foot span { overflow-wrap: break-word; }
    .doc-foot-left { justify-self: start; font-weight: 600; }
    .doc-foot-center { justify-self: center; text-align: center; }
    .doc-foot-right { justify-self: end; text-align: right; font-weight: 600; }
"""

FOOTER_LEGEND = """
        <nav class="foot-legend" aria-label="คำอธิบายตัวย่อ">
          <ul class="foot-legend-list">
            <li><abbr title="Not Applicable">NA</abbr> Not Applicable</li>
            <li><abbr title="Conformed">C</abbr> Conformed</li>
            <li><abbr title="Non Conformed">NC</abbr> Non Conformed</li>
            <li><abbr title="Railway Bridge">RB</abbr> Railway Bridge</li>
            <li><abbr title="Overpass Bridge">OP</abbr> Overpass Bridge</li>
            <li><abbr title="Building Works">BU</abbr> Building Works</li>
            <li><abbr title="Quality Control">QC</abbr> Quality Control</li>
          </ul>
        </nav>
"""

COLGROUP = """
        <col class="cw-desc" /><col class="cw-desc2" /><col class="cw-desc3" /><col class="cw-desc4" />
        <col class="cw-na" /><col class="cw-c" /><col class="cw-nc" /><col class="cw-dept" />
        <col class="cw-desc" /><col class="cw-desc2" /><col class="cw-desc3" /><col class="cw-desc4" />
        <col class="cw-na" /><col class="cw-c" /><col class="cw-nc" /><col class="cw-dept" />
"""

HTML = f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Check List Before Concrete Placement</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>{CSS}</style>
</head>
<body>
  <div class="a4-page" data-print-doc="checklist">
    <div class="sheet" aria-label="F-INS-ST-DC3-01">
      <header class="sheet-header">
        <div class="header-brand">
          <div class="logos">
            <img src="/templates/cst-report-logo-2.png" alt="" />
            <img src="/templates/cst-report-logo-1.png" alt="" />
            <img src="/templates/cst-report-logo-3.png" alt="" />
          </div>
          <p class="org-line">กิจการร่วมค้า ซีเคเอสที ดีซี3</p>
        </div>
        <p class="project-name">{{{{clientName}}}}</p>
        <h1 class="doc-title-en">CHECK LIST BEFORE CONCRETE PLACEMENT</h1>
        <p class="doc-title-th">แบบฟอร์มตรวจสอบก่อนเทคอนกรีต</p>
      </header>

      <div class="meta-block doc-section" aria-label="ข้อมูลงาน">
      <table class="bordered meta-table" aria-label="ข้อมูลงาน">
        <colgroup>
{COLGROUP}
        </colgroup>
        <tbody>
          <tr>
            <td colspan="8" class="meta-field"><span class="meta-lbl">ชื่องาน :</span> <span class="meta-val">{{{{workName}}}}</span></td>
            <td colspan="5" class="meta-field"><span class="meta-lbl">ชนิดโครงสร้าง :</span> <span class="meta-val">{{{{structureType}}}}</span></td>
            <td colspan="3" class="meta-field meta-date"><span class="meta-lbl">วันที่ :</span> <span class="meta-val">{{{{requestDate}}}}</span></td>
          </tr>
          <tr>
            <td colspan="8" class="meta-field"><span class="meta-lbl">หมายเลขโครงสร้าง :</span> <span class="meta-val">{{{{structureNo}}}}</span></td>
            <td colspan="8" class="meta-field"><span class="meta-lbl">สถานที่/ กม. :</span> <span class="meta-val">{{{{locationText}}}}</span></td>
          </tr>
          <tr>
            <td colspan="8" class="meta-field"><span class="meta-lbl">เทคอนกรีตครั้งที่ :</span> <span class="meta-val">{{{{pourSequence}}}}</span></td>
            <td colspan="4" class="meta-field"><span class="meta-lbl">ชั้นที่ :</span> <span class="meta-val">{{{{floorLevel}}}}</span></td>
            <td colspan="4" class="meta-field meta-spacer" aria-hidden="true"></td>
          </tr>
        </tbody>
      </table>
      </div>

      <div class="checklist-block doc-section" aria-label="รายการตรวจสอบ">
      <table class="bordered form" aria-label="รายการตรวจสอบ">
        <colgroup>
{COLGROUP}
        </colgroup>
        <thead>
          <tr>
            <td colspan="4" class="thead-label">รายการตรวจสอบ</td>
            <td class="thead-h">NA</td>
            <td class="thead-h">C</td>
            <td class="thead-h">NC</td>
            <td class="thead-h th-dept">ส่วนงาน</td>
            <td colspan="4" class="thead-label">รายการตรวจสอบ</td>
            <td class="thead-h">NA</td>
            <td class="thead-h">C</td>
            <td class="thead-h">NC</td>
            <td class="thead-h th-dept">ส่วนงาน</td>
          </tr>
        </thead>
        <tbody>
{body_rows()}
        </tbody>
      </table>
{FOOTER_LEGEND}
        <div class="foot-notes" aria-label="เกรดคอนกรีตและหมายเหตุ">
          <div class="foot-field foot-field--grade">
            <span class="foot-label">Concrete Grade :</span>
            <div class="foot-value foot-value--grade">
              <span class="grade-val">{{{{concreteGradeDisplay}}}}</span>
            </div>
          </div>
          <div class="foot-field foot-field--remarks">
            <span class="foot-label">Remarks :</span>
            <div class="foot-remarks-body">{{{{remarks}}}}</div>
          </div>
        </div>

        <div class="sign-block" aria-label="ลายเซ็น">
{sign_pane("ผู้รับจ้าง", "วิศวกรควบคุมงาน", "{{{{contractorUnit}}}}", "{{{{signDate}}}}", pane_end=True)}
{sign_pane("ที่ปรึกษา", "ผู้ควบคุมงาน", "{{{{consultantUnit}}}}", "{{{{signDate}}}}")}
        </div>
      </div>

      <footer class="sheet-footer doc-section">
        <div class="doc-foot" role="contentinfo" aria-label="ข้อมูลเอกสาร">
          <span class="doc-foot-left">Document No. {{{{documentNo}}}}</span>
          <span class="doc-foot-center">{{{{issueNo}}}} &nbsp;·&nbsp; Date : {{{{issueDate}}}}</span>
          <span class="doc-foot-right">Page {{{{pageCurrent}}}} / {{{{pageTotal}}}}</span>
        </div>
      </footer>
    </div>
  </div>
</body>
</html>
"""

HTML = HTML.replace("{{{{", "{{").replace("}}}}", "}}")


if __name__ == "__main__":
    OUT.write_text(HTML, encoding="utf-8")
    print("Wrote", OUT, len(HTML), "bytes", "rows", max(len(LEFT_ITEMS), len(RIGHT_ITEMS)))
