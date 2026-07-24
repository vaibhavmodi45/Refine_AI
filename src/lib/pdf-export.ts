// Client-side PDF export: rasterizes the on-screen preview node so the PDF
// matches exactly. Import only from browser code (event handlers).
export async function exportNodeToPdf(node: HTMLElement, filename: string) {
  const [{ default: html2canvas }, jspdfMod] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const { jsPDF } = jspdfMod;

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    windowWidth: node.scrollWidth,
  });
  const imgData = canvas.toDataURL("image/png");
  // US Letter in mm
  const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(filename);
}
