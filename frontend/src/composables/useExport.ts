import html2canvas from 'html2canvas';

export function useExport() {
  async function exportAsPng(element: HTMLElement, filename = 'export.png'): Promise<void> {
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2,
      backgroundColor: null,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function exportMp4(videoUrl: string, filename = 'export.mp4'): void {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function exportAsWebm(
    canvas: HTMLCanvasElement,
    duration: number,
    filename = 'export.webm'
  ): Promise<void> {
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();
    await new Promise((resolve) => setTimeout(resolve, duration * 1000));
    recorder.stop();
  }

  return { exportAsPng, exportMp4, exportAsWebm };
}
