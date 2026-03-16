import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { maskVIN } from './vin';

interface ServiceRecord {
  id: string;
  date: string;
  mileage: number | null;
  service_type: string | null;
  description: string | null;
  cost: number | null;
  garage_name: string | null;
  created_at: string;
  receipts?: string[] | null;
}

interface HistoryLogEntry {
  id: string;
  content: string;
  entry_type: string;
  created_at: string;
  attachments?: string[] | null;
}

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  vin: string;
  currentMileage: number;
}

interface PDFExportOptions {
  includeReceipts?: boolean;
}

/**
 * Generate a professional PDF export of the service history
 * for classic car sales documentation
 */
export async function generateServiceHistoryPDF(
  car: CarDetails,
  serviceRecords: ServiceRecord[],
  totalSpent: number,
  journalEntries?: HistoryLogEntry[],
  options: PDFExportOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors (classic car aesthetic)
  const primaryColor: [number, number, number] = [34, 85, 102]; // Deep teal
  const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate
  
  // Helper to add footer
  const addFooter = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Virtual Service Passport - Classic Car Documentation', 14, pageHeight - 7);
    doc.text('For personal use only - Verify all service records independently', pageWidth - 14, pageHeight - 7, { align: 'right' });
  };

  // Header - Title
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Virtual Service Passport', 14, 18);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Service History Report', 14, 28);
  
  // Generated date
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, pageWidth - 14, 28, { align: 'right' });

  // Car Details Section
  let yPos = 45;
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Details', 14, yPos);
  
  yPos += 8;
  
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);
  
  yPos += 10;
  
  // Car info grid - use masked VIN
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const carInfo = [
    ['Make:', car.make || 'Unknown'],
    ['Model:', car.model || 'Unknown'],
    ['Year:', car.year?.toString() || 'N/A'],
    ['Registration:', car.registration || 'N/A'],
    ['VIN:', maskVIN(car.vin || 'N/A')],
    ['Current Mileage:', `${car.currentMileage?.toLocaleString() || 0} miles`],
  ];
  
  doc.setFont('helvetica', 'bold');
  carInfo.forEach((item, index) => {
    const col = index < 3 ? 0 : 1;
    const row = index < 3 ? index : index - 3;
    const x = col === 0 ? 14 : 110;
    const labelOffset = col === 0 ? 25 : 50; // More offset for second column to fit longer labels
    const y = yPos + (row * 7);
    
    doc.setTextColor(...secondaryColor);
    doc.text(item[0], x, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(item[1], x + labelOffset, y);
    
    doc.setFont('helvetica', 'bold');
  });

  // Service Summary
  yPos = 95;
  
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, yPos - 5, pageWidth - 28, 25, 2, 2, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Service Summary', 18, yPos + 5);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Services: ${serviceRecords.length}`, 18, yPos + 15);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`Total Spent: £${totalSpent.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, 18, yPos + 22);
  
  // Service Records Table with improved formatting
  yPos = 135;
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Service History', 14, yPos);
  
  yPos += 5;
  
  // Prepare table data - sorted by date descending
  const sortedRecords = [...serviceRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const tableData = sortedRecords.map((record) => [
    new Date(record.date).toLocaleDateString('en-GB'),
    record.service_type || 'Service',
    record.description ? (record.description.length > 35 ? record.description.substring(0, 35) + '...' : record.description) : '-',
    record.garage_name || '-',
    record.mileage?.toLocaleString() || '-',
    record.cost != null ? `£${record.cost.toFixed(2)}` : '-',
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Type', 'Description', 'Garage', 'Mileage', 'Cost']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 25, halign: 'left' },
      2: { cellWidth: 50, halign: 'left' },
      3: { cellWidth: 35, halign: 'left' },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      // Add footer on subsequent pages
      addFooter();
    },
  });

  // Add Journal/History Notes Section
  if (journalEntries && journalEntries.length > 0) {
    doc.addPage();
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Virtual Service Passport', 14, 18);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Vehicle History Notes', 14, 28);
    
    yPos = 50;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle History & Notes', 14, yPos);
    
    yPos += 8;
    
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    
    yPos += 10;
    
    // Journal entries
    const sortedJournal = [...journalEntries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    sortedJournal.forEach((entry) => {
      // Check if we need a new page
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 30;
      }
      
      // Entry header with date
      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      doc.text(new Date(entry.created_at).toLocaleDateString('en-GB'), 14, yPos);
      
      // Entry type badge
      const entryTypeLabel = entry.entry_type === 'NOTE' ? 'NOTE' : 
                             entry.entry_type === 'SERVICE' ? 'SERVICE' : 
                             entry.entry_type;
      doc.setFontSize(7);
      doc.setFillColor(34, 85, 102);
      doc.roundedRect(60, yPos - 3, 20, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(entryTypeLabel, 70, yPos, { align: 'center' });
      
      // Entry content
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const contentLines = doc.splitTextToSize(entry.content, pageWidth - 28);
      doc.text(contentLines, 14, yPos);
      
      yPos += contentLines.length * 5 + 8;
    });
    
    addFooter();
  }

  // Add Receipts Appendix (as images)
  if (options.includeReceipts) {
    const recordsWithReceipts = sortedRecords.filter(
      r => r.receipts && r.receipts.length > 0
    );
    
    if (recordsWithReceipts.length > 0) {
      doc.addPage();
      
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Virtual Service Passport', 14, 18);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Receipts Appendix', 14, 28);
      
      // Receipt images - one per page
      for (const record of recordsWithReceipts) {
        doc.addPage();
        
        // Service summary at top
        yPos = 20;
        
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, yPos, pageWidth - 28, 35, 2, 2, 'F');
        
        yPos += 8;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Service Details', 18, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Date: ${new Date(record.date).toLocaleDateString('en-GB')}`, 18, yPos);
        
        yPos += 5;
        doc.text(`Type: ${record.service_type || 'Service'}`, 18, yPos);
        
        yPos += 5;
        if (record.garage_name) {
          doc.text(`Garage: ${record.garage_name}`, 18, yPos);
          yPos += 5;
        }
        
        if (record.cost != null) {
          doc.setTextColor(...primaryColor);
          doc.setFont('helvetica', 'bold');
          doc.text(`Cost: £${record.cost.toFixed(2)}`, 18, yPos + 5);
        }
        
        yPos = 65;
        
        // Receipt images
        const receipts = record.receipts || [];
        for (let i = 0; i < receipts.length; i++) {
          const receiptUrl = receipts[i];
          
          if (i > 0) {
            doc.addPage();
            yPos = 20;
          }
          
          // Try to add the image
          try {
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(9);
            doc.text(`Receipt ${i + 1} of ${receipts.length}`, 14, yPos);
            
            yPos += 5;
            
            // For URLs, we'll add a link instead of embedding
            // (embedding would require fetching the image first)
            doc.setTextColor(0, 51, 153);
            doc.setFontSize(10);
            doc.textWithLink('View Receipt Online', 14, yPos, { url: receiptUrl });
            
            yPos += 10;
            
            // Try to add the image - this works for base64 or local files
            // For URLs, this will fail gracefully
            const imgProps = doc.getImageProperties(receiptUrl);
            if (imgProps) {
              const imgWidth = pageWidth - 28;
              const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
              
              // Scale to fit page
              const maxHeight = pageHeight - yPos - 20;
              let finalWidth = imgWidth;
              let finalHeight = imgHeight;
              
              if (imgHeight > maxHeight) {
                finalHeight = maxHeight;
                finalWidth = (imgProps.width * maxHeight) / imgProps.height;
              }
              
              doc.addImage(receiptUrl, 'JPEG', 14, yPos, finalWidth, finalHeight);
            }
          } catch {
            // If image fails, just show the link
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(9);
            doc.text(`Receipt ${i + 1}:`, 14, yPos);
            
            yPos += 5;
            doc.setTextColor(0, 51, 153);
            doc.setFontSize(10);
            doc.textWithLink(receiptUrl, 14, yPos, { url: receiptUrl });
          }
          
          yPos += 25;
        }
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
      }
      
      // Final footer for receipts page
      addFooter();
    }
  }

  // First page footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1 || (i === 1 && journalEntries && journalEntries.length > 0) || (i === 1 && options.includeReceipts)) {
      // Footer already added by autoTable and manual addPage calls for these pages
    } else {
      addFooter();
    }
  }

  return doc;
}

/**
 * Download the service history PDF
 */
export async function downloadServiceHistoryPDF(
  car: CarDetails,
  serviceRecords: ServiceRecord[],
  totalSpent: number,
  journalEntries?: HistoryLogEntry[],
  options: PDFExportOptions = {}
): Promise<void> {
  const doc = await generateServiceHistoryPDF(car, serviceRecords, totalSpent, journalEntries, options);
  
  const fileName = `${car.make}_${car.model}_${car.year}_service_history.pdf`;
  doc.save(fileName);
}