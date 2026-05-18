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


def dept_cell() -> str:
    """คอลัมน์ส่วนงาน — ช่องสี่เหลี่ยม + RB/OP/BU/QC ตามต้นฉบับ"""
    return (
        '<td class="c-dept">'
        '<span class="chk-sq" aria-hidden="true"></span> RB/OP/BU/QC'
        "</td>"
    )


def side_cell(letter: str, desc: str) -> str:
    if not letter and not desc:
        return (
            '<td class="c-letter"></td>'
            '<td class="c-desc" colspan="4"></td>'
            '<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
            '<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
            '<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
            + dept_cell()
        )
    cls = item_class(letter, desc)
    if letter in CHECKABLE_SECTIONS:
        return (
            f'<td class="c-letter">{esc(letter)}</td>'
            f'<td class="c-desc sec" colspan="4">{esc(desc)}</td>'
            f'<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
            f'<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
            f'<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
            + dept_cell()
        )
    if cls == "sec":
        return (
            f'<td class="c-letter">{esc(letter)}</td>'
            f'<td class="c-desc sec" colspan="8">{esc(desc)}</td>'
        )
    return (
        f'<td class="c-letter">{esc(letter)}</td>'
        f'<td class="c-desc {cls}" colspan="4">{esc(desc)}</td>'
        f'<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
        f'<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
        f'<td class="c-box"><span class="chk-sq" aria-hidden="true"></span></td>'
        + dept_cell()
    )


def body_rows() -> str:
    n = max(len(LEFT_ITEMS), len(RIGHT_ITEMS))
    lines: list[str] = []
    for i in range(n):
        l = LEFT_ITEMS[i] if i < len(LEFT_ITEMS) else ("", "")
        r = RIGHT_ITEMS[i] if i < len(RIGHT_ITEMS) else ("", "")
        lines.append(f"<tr>{side_cell(*l)}{side_cell(*r)}</tr>")
    return "\n".join(lines)


CSS = """
    @page { size: 210mm 297mm; margin: 0; }
    * { box-sizing: border-box; }
    html {
      font-size: 11pt;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    body {
      margin: 0;
      font-family: "TH Sarabun New", Sarabun, "Segoe UI", sans-serif;
      font-size: 1rem;
      line-height: 1.22;
      color: #000;
      background: #fff;
    }
    @media screen { body { background: #e2e8f0; padding: 10px; } }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 5mm 6mm 6mm;
      background: #fff;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12);
    }
    @media print {
      html, body { margin: 0; padding: 0; background: #fff; }
      .a4-page { box-shadow: none; padding: 5mm 6mm 6mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    table.form {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.form td, table.form th {
      border: 1px solid #000;
      padding: 1px 2px;
      vertical-align: middle;
      font-weight: 400;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    /* สัดส่วนจาก Excel 647pt ต่อครึ่ง */
    col.c1 { width: 3.6%; }
    col.c2 { width: 22.4%; }
    col.c3 { width: 17.8%; }
    col.c4 { width: 11.4%; }
    col.c5 { width: 10.4%; }
    col.c6 { width: 6.2%; }
    col.c7 { width: 6.2%; }
    col.c8 { width: 6.2%; }
    col.c9 { width: 15.8%; }
    .h-project {
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.3;
      vertical-align: middle;
      text-align: left;
      padding: 6px 8px;
      white-space: pre-line;
    }
    .h-logo-wrap {
      text-align: center;
      vertical-align: middle;
      padding: 4px 6px 3px;
    }
    .h-logos {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .h-logos img {
      display: block;
      height: 34px;
      width: auto;
      max-width: 30%;
      object-fit: contain;
    }
    .h-jv {
      font-size: 0.68rem;
      font-weight: 700;
      line-height: 1.1;
      margin-top: 3px;
      text-align: center;
    }
    .h-title-en,
    .h-title-th {
      font-weight: 700;
      text-align: center;
      vertical-align: middle;
      padding: 4px 6px;
    }
    .h-title-en { font-size: 1rem; line-height: 1.2; }
    .h-title-th { font-size: 0.95rem; line-height: 1.2; }
    .meta-label { font-weight: 700; white-space: nowrap; padding: 2px 5px; }
    .meta-val,
    .remarks-area,
    .grade-val {
      padding: 1px 5px 3px;
      min-height: 1.15em;
      vertical-align: bottom;
      border-bottom: 1px dotted #000;
    }
    .meta-date { white-space: nowrap; }
    .thead-label { font-weight: 700; text-align: left; padding: 2px 4px; }
    .thead-h { font-weight: 700; text-align: center; font-size: 0.92rem; }
    .thead-h.th-dept { font-size: 0.7rem; line-height: 1.05; padding: 2px 1px; }
    .c-letter { text-align: center; font-weight: 700; font-size: 0.95rem; }
    .c-desc { text-align: left; padding: 0 3px; font-size: 0.9rem; line-height: 1.12; }
    .c-desc.sec { font-weight: 700; font-size: 0.95rem; }
    .c-desc.sub { padding-left: 6px; }
    .c-box { text-align: center; vertical-align: middle; padding: 0; }
    .c-dept {
      text-align: center;
      font-size: 0.62rem;
      line-height: 1.05;
      padding: 0 1px;
      white-space: nowrap;
    }
    .c-dept .chk-sq {
      width: 9px;
      height: 9px;
      margin-right: 1px;
    }
    .chk-sq {
      display: inline-block;
      width: 9px;
      height: 9px;
      border: 1px solid #000;
      vertical-align: middle;
      margin: 0 1px;
      background: #fff;
    }
    .foot-legend { font-size: 0.78rem; line-height: 1.3; padding: 3px 4px; }
    .foot-label { font-weight: 700; white-space: nowrap; }
    .foot-remarks td { vertical-align: middle; padding: 3px 4px; }
    .foot-remarks .remarks-area { min-height: 1.4em; }
    .foot-unit { white-space: nowrap; }
    .sign-cell { padding: 4px 8px 6px; vertical-align: top; font-size: 1rem; }
    table.sign-inner { width: 100%; border-collapse: collapse; }
    table.sign-inner td { border: none; padding: 2px 0; vertical-align: bottom; }
    .sign-role { font-weight: 700; }
    .sign-line-row { padding: 4px 0 2px; }
    .sign-line-row .u {
      display: inline-block;
      min-width: 10em;
      border-bottom: 1px dotted #000;
      height: 1em;
      vertical-align: bottom;
      margin: 0 0.25em;
    }
    .sign-line-row .u-unit { float: right; white-space: nowrap; }
    .sign-par { text-align: center; padding: 8px 0 4px; }
    .sign-par .u-wide {
      display: inline-block;
      min-width: 14em;
      border-bottom: 1px dotted #000;
      height: 1em;
      vertical-align: bottom;
    }
    .sign-pos { text-align: center; padding-top: 2px; }
    .foot-doc-h {
      background: #d9d9d9;
      font-weight: 700;
      text-align: center;
      font-size: 0.9rem;
      padding: 3px;
    }
    .foot-doc-d { text-align: center; font-size: 0.9rem; padding: 3px; }
"""

HTML = f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Check List Before Concrete Placement</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet" />
  <style>{CSS}</style>
</head>
<body>
  <div class="a4-page" data-print-doc="checklist">
    <table class="form" aria-label="F-INS-ST-DC3-01">
      <colgroup>
        <col class="c1" /><col class="c2" /><col class="c3" /><col class="c4" />
        <col class="c5" /><col class="c6" /><col class="c7" /><col class="c8" /><col class="c9" />
        <col class="c1" /><col class="c2" /><col class="c3" /><col class="c4" />
        <col class="c5" /><col class="c6" /><col class="c7" /><col class="c8" /><col class="c9" />
      </colgroup>
      <tbody>
        <tr>
          <td colspan="9" rowspan="3" class="h-project">{{{{clientName}}}}</td>
          <td colspan="9" class="h-logo-wrap">
            <div class="h-logos">
              <img src="/templates/cst-report-logo-2.png" alt="" />
              <img src="/templates/cst-report-logo-1.png" alt="" />
              <img src="/templates/cst-report-logo-3.png" alt="" />
            </div>
            <div class="h-jv">กิจการร่วมค้า ซีเคเอสที ดีซี3</div>
          </td>
        </tr>
        <tr>
          <td colspan="9" class="h-title-en">CHECK LIST BEFORE CONCRETE PLACEMENT</td>
        </tr>
        <tr>
          <td colspan="9" class="h-title-th">แบบฟอร์มตรวจสอบก่อนเทคอนกรีต</td>
        </tr>
        <tr>
          <td colspan="2" class="meta-label">ชื่องาน :</td>
          <td colspan="7" class="meta-val">{{{{workName}}}}</td>
          <td colspan="2" class="meta-label">ชนิดโครงสร้าง :</td>
          <td colspan="7" class="meta-val">{{{{structureType}}}}</td>
        </tr>
        <tr>
          <td colspan="2" class="meta-label">หมายเลขโครงสร้าง :</td>
          <td colspan="7" class="meta-val">{{{{structureNo}}}}</td>
          <td colspan="2" class="meta-label">สถานที่/ กม. :</td>
          <td colspan="7" class="meta-val">{{{{locationText}}}}</td>
        </tr>
        <tr>
          <td colspan="2" class="meta-label">เทคอนกรีตครั้งที่ :</td>
          <td colspan="7" class="meta-val">{{{{pourSequence}}}}</td>
          <td colspan="2" class="meta-label">ชั้นที่ :</td>
          <td colspan="2" class="meta-val">{{{{floorLevel}}}}</td>
          <td class="meta-label">วันที่ :</td>
          <td colspan="4" class="meta-val meta-date">{{{{requestDate}}}}</td>
        </tr>
        <tr>
          <td colspan="2" class="thead-label">รายการตรวจสอบ</td>
          <td colspan="3"></td>
          <td class="thead-h">NA</td>
          <td class="thead-h">C</td>
          <td class="thead-h">NC</td>
          <td class="thead-h th-dept">ส่วนงาน</td>
          <td colspan="2" class="thead-label">รายการตรวจสอบ</td>
          <td colspan="3"></td>
          <td class="thead-h">NA</td>
          <td class="thead-h">C</td>
          <td class="thead-h">NC</td>
          <td class="thead-h th-dept">ส่วนงาน</td>
        </tr>
{body_rows()}
        <tr>
          <td colspan="18" class="foot-legend">NA : Not Applicable &nbsp;&nbsp;&nbsp;&nbsp; C : Conformed &nbsp;&nbsp;&nbsp;&nbsp; NC : Non Conformed &nbsp;&nbsp;&nbsp;&nbsp; RB : Railway Bridge &nbsp;&nbsp;&nbsp;&nbsp; OP : Overpass Bridge &nbsp;&nbsp;&nbsp;&nbsp; BU : Building Works &nbsp;&nbsp;&nbsp;&nbsp; QC : Quality Control</td>
        </tr>
        <tr class="foot-remarks">
          <td colspan="2" class="foot-label">Remarks :</td>
          <td colspan="2" class="foot-label">Concrete Grade :</td>
          <td colspan="3" class="meta-val grade-val">{{{{concreteGradeDisplay}}}}</td>
          <td colspan="2" class="foot-unit">(Ksc. Cylinder)</td>
          <td colspan="9" class="meta-val remarks-area">{{{{remarks}}}}</td>
        </tr>
        <tr>
          <td colspan="9" class="sign-cell">
            <table class="sign-inner">
              <tr><td class="sign-role">ผู้รับจ้าง :</td></tr>
              <tr><td class="sign-line-row">ผู้ตรวจ :<span class="u"></span><span class="u-unit">{{{{contractorUnit}}}}</span></td></tr>
              <tr><td class="sign-par">( <span class="u-wide"></span> )</td></tr>
              <tr><td class="sign-pos">วิศวกรควบคุมงาน</td></tr>
            </table>
          </td>
          <td colspan="9" class="sign-cell">
            <table class="sign-inner">
              <tr><td class="sign-role">ที่ปรึกษา :</td></tr>
              <tr><td class="sign-line-row">ผู้ตรวจ :<span class="u"></span><span class="u-unit">{{{{consultantUnit}}}}</span></td></tr>
              <tr><td class="sign-par">( <span class="u-wide"></span> )</td></tr>
              <tr><td class="sign-pos">ผู้ควบคุมงาน</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="foot-doc-h">Document No.</td>
          <td colspan="8" class="foot-doc-h">Release/Amendment</td>
          <td colspan="6" class="foot-doc-h">Page No.</td>
        </tr>
        <tr>
          <td colspan="4" class="foot-doc-d">{{{{documentNo}}}}</td>
          <td colspan="8" class="foot-doc-d">{{{{issueNo}}}} &nbsp; Date : {{{{issueDate}}}}</td>
          <td colspan="6" class="foot-doc-d">{{{{pageCurrent}}}} of {{{{pageTotal}}}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
"""

HTML = HTML.replace("{{{{", "{{").replace("}}}}", "}}")


if __name__ == "__main__":
    OUT.write_text(HTML, encoding="utf-8")
    print("Wrote", OUT, len(HTML), "bytes", "rows", max(len(LEFT_ITEMS), len(RIGHT_ITEMS)))
