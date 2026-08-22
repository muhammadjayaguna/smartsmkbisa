import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToWord } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  title: string;
  headers: string[];
  rows: string[][];
  fileName: string;
  disabled?: boolean;
}

const ExportButtons = ({ title, headers, rows, fileName, disabled = false }: ExportButtonsProps) => {
  const handleExport = async (format: 'pdf' | 'excel' | 'word' | 'csv') => {
    if (rows.length === 0) {
      toast({ title: "Error", description: "Tidak ada data untuk diekspor", variant: "destructive" });
      return;
    }

    try {
      const options = { title, headers, rows, fileName };

      switch (format) {
        case 'pdf':
          exportToPDF(options);
          break;
        case 'excel':
          exportToExcel(options);
          break;
        case 'word':
          await exportToWord(options);
          break;
        case 'csv': {
          const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
          ].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileName}.csv`;
          link.click();
          break;
        }
      }

      toast({ title: "Berhasil", description: `Laporan berhasil diekspor ke ${format.toUpperCase()}` });
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengekspor laporan", variant: "destructive" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Ekspor</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-red-500" />
          <span>Ekspor PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center space-x-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span>Ekspor Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('word')} className="flex items-center space-x-2">
          <File className="h-4 w-4 text-blue-600" />
          <span>Ekspor Word</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} className="flex items-center space-x-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <span>Ekspor CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
