import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface ExportOptions {
  title: string;
  headers: string[];
  rows: string[][];
  fileName: string;
}

export const exportToPDF = ({ title, headers, rows, fileName }: ExportOptions) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Diekspor: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${fileName}.pdf`);
};

export const exportToExcel = ({ title, headers, rows, fileName }: ExportOptions) => {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToWord = async ({ title, headers, rows, fileName }: ExportOptions) => {
  const headerCells = headers.map(h => 
    new DocxTableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF' })] })],
      shading: { fill: '2563EB' },
      width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
    })
  );

  const dataRows = rows.map(row => 
    new DocxTableRow({
      children: row.map(cell => 
        new DocxTableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell || '-', size: 18 })] })],
          width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
        })
      ),
    })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Diekspor: ${new Date().toLocaleDateString('id-ID')}`, size: 20, italics: true })],
          spacing: { after: 300 },
        }),
        new DocxTable({
          rows: [
            new DocxTableRow({ children: headerCells, tableHeader: true }),
            ...dataRows,
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};
