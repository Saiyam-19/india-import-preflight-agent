from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


OUTPUT = Path(__file__).with_name("synthetic-router-pro-forma-invoice.pdf")


def build_fixture() -> None:
    pdf = canvas.Canvas(
        str(OUTPUT),
        pagesize=A4,
        pageCompression=0,
        invariant=1,
    )
    pdf.setAuthor("BWMI deterministic test fixture")
    pdf.setCreator("BWMI deterministic test fixture generator")
    pdf.setTitle("Synthetic router pro-forma invoice")

    width, height = A4
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(52, height - 64, "PRO FORMA INVOICE")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(52, height - 82, "SYNTHETIC TEST DOCUMENT - BWMI-13 - NOT FOR TRADE")

    lines = [
        ("Document number", "BWMI-PI-ROUTER-001"),
        ("Exporter", "Reviewed fixture exporter"),
        ("Producer", "Reviewed fixture producer"),
        ("Manufacturer", "Reviewed fixture manufacturer"),
        ("Importer", "Reviewed fixture importer India Pvt Ltd"),
        ("Product", "New retail integrated 2.4/5 GHz MIMO Wi-Fi router"),
        ("Router model", "BWMI-MIMO-245-R1"),
        ("Adapter model", "BWMI-ADAPTER-12V-R1"),
        ("Country of origin", "Vietnam (VN)"),
        ("Quantity", "1 retail set"),
        ("Item value", "INR 99,999.98"),
        ("Freight", "INR 0.01"),
        ("Insurance", "INR 0.01"),
    ]

    y = height - 124
    for label, value in lines:
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(52, y, f"{label}:")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(180, y, value)
        y -= 24

    pdf.setStrokeColorRGB(0.18, 0.32, 0.4)
    pdf.line(52, y - 4, width - 52, y - 4)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(52, y - 24, "Visible facts only. No HS code, duty, legal outcome, or certificate decision is stated.")
    pdf.drawString(52, y - 40, "This fixture contains one document on one page and is intentionally synthetic.")
    pdf.save()


if __name__ == "__main__":
    build_fixture()
