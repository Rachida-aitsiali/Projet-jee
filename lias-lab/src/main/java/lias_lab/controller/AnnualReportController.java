package lias_lab.controller;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lias_lab.repository.MemberRepository;
import lias_lab.repository.PublicationRepository;
import lias_lab.repository.EventRepository;
import lias_lab.repository.TeamRepository;
import lias_lab.repository.AdhesionRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AnnualReportController {

    private final MemberRepository memberRepository;
    private final PublicationRepository publicationRepository;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final AdhesionRequestRepository adhesionRequestRepository;

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnnualReport(
            @RequestParam(defaultValue = "0") int year) {

        int reportYear = (year == 0) ? LocalDate.now().getYear() : year;

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            writer.setPageEvent(new PdfPageEventHelper() {
                @Override
                public void onEndPage(PdfWriter w, Document doc) {
                    try {
                        PdfContentByte cb = w.getDirectContent();
                        cb.setColorStroke(new BaseColor(200, 200, 200));
                        cb.moveTo(50, 45);
                        cb.lineTo(545, 45);
                        cb.stroke();
                        Font footerFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL,
                                new BaseColor(120, 120, 120));
                        Phrase footer = new Phrase(
                                "LIAS – Rapport Annuel " + reportYear +
                                        "     |     Généré le " + LocalDate.now(), footerFont);
                        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, footer, 297, 30, 0);
                        Phrase pageNum = new Phrase("Page " + w.getPageNumber(), footerFont);
                        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, pageNum, 545, 30, 0);
                    } catch (Exception ignored) {}
                }
            });

            document.open();

            Font titleFont   = new Font(Font.FontFamily.HELVETICA, 26, Font.BOLD,   new BaseColor(30, 58, 138));
            Font sectionFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD,   new BaseColor(30, 58, 138));
            Font labelFont   = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   new BaseColor(51, 65, 85));
            Font valueFont   = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(15, 23, 42));
            Font smallGray   = new Font(Font.FontFamily.HELVETICA,  9, Font.NORMAL, new BaseColor(100, 116, 139));
            Font whiteFont   = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL, BaseColor.WHITE);

            // Cover banner
            PdfContentByte canvas = writer.getDirectContentUnder();
            canvas.setColorFill(new BaseColor(30, 58, 138));
            canvas.rectangle(50, 680, 495, 90);
            canvas.fill();

            Paragraph title = new Paragraph("RAPPORT ANNUEL " + reportYear, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(60);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph labName = new Paragraph(
                    "Laboratoire d'Informatique et Applications Scientifiques", whiteFont);
            labName.setAlignment(Element.ALIGN_CENTER);
            labName.setSpacingAfter(50);
            document.add(labName);

            addSeparator(document);

            // Stats
            long totalMembers      = memberRepository.count();
            long totalPublications = publicationRepository.count();
            long totalEvents       = eventRepository.count();
            long totalTeams        = teamRepository.count();

            addSectionTitle(document, "Chiffres Clés", sectionFont);

            PdfPTable statsTable = new PdfPTable(4);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingBefore(10);
            statsTable.setSpacingAfter(20);
            addStatCell(statsTable, String.valueOf(totalMembers),      "Membres",      labelFont, valueFont);
            addStatCell(statsTable, String.valueOf(totalPublications), "Publications", labelFont, valueFont);
            addStatCell(statsTable, String.valueOf(totalEvents),       "Événements",   labelFont, valueFont);
            addStatCell(statsTable, String.valueOf(totalTeams),        "Équipes",      labelFont, valueFont);
            document.add(statsTable);
            addSeparator(document);

            // Members
            addSectionTitle(document, "Membres du Laboratoire", sectionFont);
            PdfPTable membersTable = new PdfPTable(3);
            membersTable.setWidthPercentage(100);
            membersTable.setSpacingBefore(8);
            membersTable.setSpacingAfter(20);
            membersTable.setWidths(new float[]{3f, 3f, 2f});
            addTableHeader(membersTable, new String[]{"Prénom", "Nom", "Statut"}, labelFont);
            memberRepository.findAll().forEach(m -> {
                addTableCell(membersTable, m.getFirstName(), valueFont);
                addTableCell(membersTable, m.getLastName(),  valueFont);
                addTableCell(membersTable, m.getStatus() != null ? m.getStatus().toString() : "—", smallGray);
            });
            document.add(membersTable);
            addSeparator(document);

            // Publications
            addSectionTitle(document, "Publications Scientifiques", sectionFont);
            PdfPTable pubTable = new PdfPTable(3);
            pubTable.setWidthPercentage(100);
            pubTable.setSpacingBefore(8);
            pubTable.setSpacingAfter(20);
            pubTable.setWidths(new float[]{5f, 2f, 2f});
            addTableHeader(pubTable, new String[]{"Titre", "Type", "Année"}, labelFont);
            publicationRepository.findAll().forEach(p -> {
                addTableCell(pubTable, p.getTitle(), valueFont);
                addTableCell(pubTable, p.getType() != null ? p.getType().toString() : "—", smallGray);
                addTableCell(pubTable, p.getYear() != 0 ? String.valueOf(p.getYear()) : "—", smallGray);
            });
            document.add(pubTable);
            addSeparator(document);

            // Events
            addSectionTitle(document, "Événements Scientifiques", sectionFont);
            PdfPTable evtTable = new PdfPTable(3);
            evtTable.setWidthPercentage(100);
            evtTable.setSpacingBefore(8);
            evtTable.setSpacingAfter(20);
            evtTable.setWidths(new float[]{4f, 2f, 3f});
            addTableHeader(evtTable, new String[]{"Titre", "Type", "Date"}, labelFont);
            eventRepository.findAll().forEach(e -> {
                addTableCell(evtTable, e.getTitle(), valueFont);
                addTableCell(evtTable, e.getType() != null ? e.getType().toString() : "—", smallGray);
                addTableCell(evtTable, e.getStartDate() != null ? e.getStartDate().toString() : "—", smallGray);
            });
            document.add(evtTable);

            document.close();

            byte[] pdfBytes = baos.toByteArray();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    "rapport-annuel-" + reportYear + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void addSectionTitle(Document doc, String text, Font font) throws DocumentException {
        Paragraph p = new Paragraph(text, font);
        p.setSpacingBefore(16);
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private void addSeparator(Document doc) throws DocumentException {
        Paragraph sep = new Paragraph(" ");
        sep.setSpacingAfter(4);
        doc.add(sep);
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBorderWidthTop(0.5f);
        cell.setBorderColorTop(new BaseColor(203, 213, 225));
        cell.setBorderWidthBottom(0);
        cell.setBorderWidthLeft(0);
        cell.setBorderWidthRight(0);
        cell.setPadding(0);
        line.addCell(cell);
        line.setSpacingAfter(10);
        doc.add(line);
    }

    private void addStatCell(PdfPTable table, String value, String label,
                             Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(new BaseColor(226, 232, 240));
        cell.setPadding(12);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(new BaseColor(248, 250, 252));
        Paragraph val = new Paragraph(value,
                new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, new BaseColor(30, 58, 138)));
        val.setAlignment(Element.ALIGN_CENTER);
        Paragraph lbl = new Paragraph(label, labelFont);
        lbl.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(val);
        cell.addElement(lbl);
        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, String[] headers, Font font) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBackgroundColor(new BaseColor(241, 245, 249));
            cell.setPadding(8);
            cell.setBorderColor(new BaseColor(203, 213, 225));
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "—", font));
        cell.setPadding(7);
        cell.setBorderColor(new BaseColor(226, 232, 240));
        table.addCell(cell);
    }
}