"""Extract checklist rows from Excel HTML export."""
import re
import sys
from pathlib import Path

SHEET = Path(r"c:/Users/User/Desktop/Check Sheet_F-INS-ST-DC3-01_files/sheet001.htm")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    html = SHEET.read_bytes().decode("cp874")

    start = html.find("รายการตรวจสอบ")
    end = html.find("NA : Not Applicable")
    chunk = html[start:end]
    print("chunk len", len(chunk))

    rows_out: list[dict] = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", chunk, re.DOTALL | re.I):
        tr = re.sub(r"<!--\[if[\s\S]*?\<!\[endif\]-->", "", tr)
        tr = re.sub(r"<v:[\s\S]*?</v:\w+>", "", tr)
        if "gfxdata" in tr:
            continue
        cells: list[tuple[int, str, str]] = []
        for m in re.finditer(r"<td([^>]*)>(.*?)</td>", tr, re.DOTALL | re.I):
            attrs, body = m.group(1), m.group(2)
            colspan = int(re.search(r"colspan=(\d+)", attrs).group(1)) if "colspan=" in attrs else 1
            cls = re.search(r"class=([^\s>]+)", attrs)
            cls_name = cls.group(1) if cls else ""
            t = re.sub(r"<[^>]+>", "", body).replace("&nbsp;", " ")
            t = re.sub(r"\s+", " ", t).strip()
            if len(t) > 250:
                t = ""
            cells.append((colspan, t, cls_name))

        if not cells:
            continue

        # split into left/right 9 columns each
        def width(cells_list: list[tuple[int, str, str]]) -> int:
            return sum(c for c, _, _ in cells_list)

        left, right = [], []
        cur, side = [], "left"
        for item in cells:
            w = width(cur) + item[0]
            if side == "left" and w > 9:
                side = "right"
            if side == "right" and width(cur) + item[0] > 18:
                break
            cur.append(item)
            if width(cur) == 9:
                if side == "left":
                    left = cur
                    cur = []
                    side = "right"
                else:
                    right = cur
                    cur = []
                    break
        if cur and not right:
            if side == "left" or not left:
                left = cur
            else:
                right = cur

        if not left and not right:
            continue

        rows_out.append({"left": left, "right": right})

    for i, r in enumerate(rows_out):
        lt = [(c, t) for c, t, _ in r["left"] if t]
        rt = [(c, t) for c, t, _ in r["right"] if t]
        if lt or rt:
            print(f"{i+1} L={lt}")
            print(f"   R={rt}")


if __name__ == "__main__":
    main()
