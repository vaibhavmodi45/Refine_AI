import { toast } from "sonner";

/**
 * High-Resolution PDF Export & Native Print Trigger.
 * Sets the document.title to the custom resume name so the browser print/save dialog
 * pre-populates the exact filename (e.g., "Vaibhav Resume01.pdf").
 */
export async function exportNodeToPdf(node: HTMLElement, filename: string) {
  const toastId = toast.loading("Preparing resume for PDF export...");

  const cleanTitle = filename.replace(/\.pdf$/i, "").trim() || "Resume";
  const originalTitle = document.title;

  try {
    // Set document title temporarily so Chrome/Edge save dialog uses the user's resume name
    document.title = cleanTitle;

    // Try background jsPDF rasterization
    const [{ default: html2canvas }, jspdfMod] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const { jsPDF } = jspdfMod;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0px";
    container.style.width = "800px";
    container.style.backgroundColor = "#ffffff";
    container.style.zIndex = "-9999";

    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.width = "100%";
    clone.style.boxSizing = "border-box";
    clone.style.backgroundColor = "#ffffff";

    container.appendChild(clone);
    document.body.appendChild(container);

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: false,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH, undefined, "FAST");
    heightLeft -= pageH;

    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH, undefined, "FAST");
      heightLeft -= pageH;
    }

    const safeFilename = `${cleanTitle}.pdf`;

    // Attempt direct save
    try {
      pdf.save(safeFilename);
    } catch {
      // Fallback blob
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    }

    // Open print dialog with pre-filled document title
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 400);

    toast.success(`Exporting "${cleanTitle}.pdf"`, { id: toastId });
  } catch (error) {
    console.error("[PDF Export Error]", error);
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
    toast.success(`Opening print dialog for "${cleanTitle}.pdf"`, { id: toastId });
  }
}
