# -*- coding: utf-8 -*-
"""Replace chk-tbl tbody with reference checksheet."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REF = Path(r"c:\Users\User\Desktop\ref-checksheet.html")
OUT = ROOT / "public/templates/checklist-before-concrete-placement.html"


def extract_tbody(html: str) -> str:
    chk = re.search(r'<table class="chk-tbl"[^>]*>(.*?)</table>', html, re.DOTALL)
    if not chk:
        raise SystemExit("chk-tbl not found in reference")
    m = re.search(r"<tbody>\s*(.*?)\s*</tbody>", chk.group(1), re.DOTALL)
    if not m:
        raise SystemExit("chk tbody not found")
    # Normalize: one row per line like generated output (optional)
    inner = m.group(1).strip()
    lines = []
    for row in re.findall(r"<tr[^>]*>.*?</tr>", inner, re.DOTALL):
        row = re.sub(r">\s+<", "><", row)
        row = row.replace("\n", "").strip()
        lines.append(row)
    return "\n".join(lines)


def main() -> None:
    ref_html = REF.read_text(encoding="utf-8")
    out_html = OUT.read_text(encoding="utf-8")
    ref_body = extract_tbody(ref_html)
    chk = re.search(r'(<table class="chk-tbl"[^>]*>.*?</table>)', out_html, re.DOTALL)
    if not chk:
        raise SystemExit("chk-tbl not found")
    chk_new = re.sub(
        r"(<tbody>)\s*.*?\s*(</tbody>)",
        lambda m: m.group(1) + "\n" + ref_body + "\n        " + m.group(2),
        chk.group(1),
        count=1,
        flags=re.DOTALL,
    )
    out_html = out_html.replace(chk.group(1), chk_new)
    OUT.write_text(out_html, encoding="utf-8")
    print("Wrote", OUT, len(ref_body.splitlines()), "rows")


if __name__ == "__main__":
    main()
