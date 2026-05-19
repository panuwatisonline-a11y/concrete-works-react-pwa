# -*- coding: utf-8 -*-
"""Patch chk-tbl tbody only; restore meta-tbl if corrupted."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from build_dc3_checklist_html import body_rows

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/templates/checklist-before-concrete-placement.html"


def main() -> None:
    html = OUT.read_text(encoding="utf-8")
    head = subprocess.check_output(
        ["git", "show", "HEAD:public/templates/checklist-before-concrete-placement.html"],
        encoding="utf-8",
    )
    meta_m = re.search(r'(<table class="meta-tbl".*?</table>)', head, re.DOTALL)
    if not meta_m:
        raise SystemExit("meta-tbl not found in HEAD")
    html = re.sub(
        r'<table class="meta-tbl".*?</table>',
        meta_m.group(1),
        html,
        count=1,
        flags=re.DOTALL,
    )

    tbody = body_rows()
    chk_m = re.search(r'(<table class="chk-tbl".*?</table>)', html, re.DOTALL)
    if not chk_m:
        raise SystemExit("chk-tbl not found")
    chk = chk_m.group(1)
    chk_new = re.sub(
        r"(<tbody>)\s*.*?\s*(</tbody>)",
        lambda m: m.group(1) + "\n" + tbody + "\n        " + m.group(2),
        chk,
        count=1,
        flags=re.DOTALL,
    )
    html = html.replace(chk_m.group(1), chk_new)

    if "c-box--pad::before" not in html:
        html = html.replace(
            "    .c-box::before {",
            "    table.chk-tbl .c-box.c-box--pad::before { content: none; }\n"
            "    .c-box::before {",
        )

    OUT.write_text(html, encoding="utf-8")
    print("Patched", OUT, len(tbody.splitlines()), "chk rows")


if __name__ == "__main__":
    main()
