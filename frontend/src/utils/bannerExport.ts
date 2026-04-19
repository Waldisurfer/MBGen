import html2canvas from 'html2canvas';

export async function exportBannerAsPng(
  el: HTMLElement,
  filename: string,
  scale = 4,
): Promise<void> {
  await document.fonts.ready;
  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  });
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export async function exportBannersToZip(
  entries: Array<{ el: HTMLElement; filename: string }>,
  zipName: string,
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  await document.fonts.ready;

  const zip = new JSZip();
  for (const { el, filename } of entries) {
    const canvas = await html2canvas(el, {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    zip.file(filename, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.download = zipName;
  a.href = URL.createObjectURL(content);
  a.click();
  URL.revokeObjectURL(a.href);
}
