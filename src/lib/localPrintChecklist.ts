/** CSS สำหรับพรีวิวบนจอ — ให้เลื่อนดูเอกสาร A4 เต็มความสูงได้ */
export function injectPreviewScreenStyles(html: string): string {
  const fix = `<style id="cw-preview-screen-fix">
@media screen {
  html, body {
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    height: auto !important;
    min-height: 100%;
  }
  body {
    background: #fff !important;
    padding: 0 !important;
  }
  .a4-page {
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 2px 16px rgba(15, 23, 42, 0.1);
  }
}
</style>`

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${fix}</head>`)
  }
  return fix + html
}
