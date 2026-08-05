import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT


def generate_pdf(content: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
    )

    # Colors
    accent = colors.HexColor("#1a56db")
    dark = colors.HexColor("#111827")
    mid = colors.HexColor("#374151")
    light_gray = colors.HexColor("#6b7280")
    rule_color = colors.HexColor("#d1d5db")

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "Name",
        parent=styles["Normal"],
        fontSize=24,
        fontName="Helvetica-Bold",
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=2,
    )

    role_style = ParagraphStyle(
        "Role",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica",
        textColor=accent,
        alignment=TA_CENTER,
        spaceAfter=8,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Helvetica-Bold",
        textColor=accent,
        spaceBefore=10,
        spaceAfter=3,
        letterSpacing=1,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9.5,
        fontName="Helvetica",
        textColor=mid,
        spaceAfter=3,
        leading=14,
        alignment=TA_JUSTIFY,
    )

    bullet_style = ParagraphStyle(
        "Bullet",
        parent=styles["Normal"],
        fontSize=9.5,
        fontName="Helvetica",
        textColor=mid,
        leftIndent=10,
        spaceAfter=2,
        leading=13,
    )

    job_title_style = ParagraphStyle(
        "JobTitle",
        parent=styles["Normal"],
        fontSize=10.5,
        fontName="Helvetica-Bold",
        textColor=dark,
        spaceAfter=0,
    )

    company_style = ParagraphStyle(
        "Company",
        parent=styles["Normal"],
        fontSize=9.5,
        fontName="Helvetica-Oblique",
        textColor=light_gray,
        spaceAfter=4,
    )

    skill_style = ParagraphStyle(
        "Skill",
        parent=styles["Normal"],
        fontSize=9.5,
        fontName="Helvetica",
        textColor=mid,
        leading=15,
    )

    story = []

    # ── Header ──────────────────────────────────────────────
    name = content.get("candidate_name", "Resume")
    role = content.get("target_role", "")
    story.append(Paragraph(name, name_style))
    if role:
        story.append(Paragraph(role, role_style))
    story.append(HRFlowable(width="100%", thickness=2, color=accent, spaceAfter=6))

    # ── Professional Summary ─────────────────────────────────
    if content.get("professional_summary"):
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceAfter=4))
        story.append(Paragraph(content["professional_summary"], body_style))

    # ── Core Competencies ────────────────────────────────────
    skills = content.get("skills", [])
    if skills:
        story.append(Paragraph("CORE COMPETENCIES", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceAfter=4))
        # 3-column grid
        cols = 3
        rows = [skills[i : i + cols] for i in range(0, len(skills), cols)]
        # Pad last row
        while rows and len(rows[-1]) < cols:
            rows[-1].append("")
        table_data = [[Paragraph(f"• {s}", skill_style) for s in row] for row in rows]
        t = Table(table_data, colWidths=[(7.2 * inch) / cols] * cols)
        t.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ]
            )
        )
        story.append(t)

    # ── Work Experience ──────────────────────────────────────
    if content.get("work_experience"):
        story.append(Paragraph("WORK EXPERIENCE", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceAfter=4))

        for exp in content["work_experience"]:
            title = exp.get("title", "")
            company = exp.get("company", "")
            dates = exp.get("dates", "")

            # Title left, dates right
            header_data = [
                [
                    Paragraph(title, job_title_style),
                    Paragraph(
                        dates,
                        ParagraphStyle(
                            "Dates",
                            parent=styles["Normal"],
                            fontSize=9.5,
                            fontName="Helvetica",
                            textColor=light_gray,
                            alignment=TA_RIGHT,
                        ),
                    ),
                ]
            ]
            header_table = Table(header_data, colWidths=[4.5 * inch, 2.7 * inch])
            header_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ]
                )
            )
            story.append(header_table)
            story.append(Paragraph(company, company_style))

            for bullet in exp.get("bullets", []):
                story.append(Paragraph(f"• {bullet}", bullet_style))
            story.append(Spacer(1, 6))

    # ── Education ────────────────────────────────────────────
    if content.get("education"):
        story.append(Paragraph("EDUCATION", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceAfter=4))
        for edu in content["education"]:
            story.append(
                Paragraph(
                    f"<b>{edu.get('degree', '')}</b>",
                    ParagraphStyle(
                        "EduDegree",
                        parent=styles["Normal"],
                        fontSize=10,
                        fontName="Helvetica-Bold",
                        textColor=dark,
                        spaceAfter=1,
                    ),
                )
            )
            story.append(
                Paragraph(
                    f"{edu.get('institution', '')}  |  {edu.get('year', '')}",
                    company_style,
                )
            )

    # ── Certifications ───────────────────────────────────────
    certs = content.get("certifications", [])
    if certs:
        story.append(Paragraph("CERTIFICATIONS", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceAfter=4))
        for cert in certs:
            if cert.strip():
                story.append(Paragraph(f"• {cert}", bullet_style))

    # ── Cover Letter page ────────────────────────────────────
    from reportlab.platypus import PageBreak

    story.append(PageBreak())
    story.append(
        Paragraph(
            "COVER LETTER",
            ParagraphStyle(
                "CLTitle",
                parent=styles["Normal"],
                fontSize=16,
                fontName="Helvetica-Bold",
                textColor=accent,
                spaceAfter=4,
            ),
        )
    )
    story.append(HRFlowable(width="100%", thickness=2, color=accent, spaceAfter=14))

    cover = content.get("cover_letter", "")
    for para in cover.split("\n\n"):
        if para.strip():
            story.append(Paragraph(para.strip(), body_style))
            story.append(Spacer(1, 8))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
