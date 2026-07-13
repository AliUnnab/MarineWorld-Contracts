import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import * as xlsx from "xlsx";


export class ParserService {
  /**
   * Parses the file at the given local path and returns its text contents.
   */
  public async parseFile(filePath: string, mimeType?: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const extension = path.extname(filePath).toLowerCase();
    const fileBuffer = fs.readFileSync(filePath);

    try {
      if (extension === ".pdf" || mimeType === "application/pdf") {
        return await this.parsePdf(fileBuffer);
      } else if (
        extension === ".docx" ||
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return await this.parseDocx(fileBuffer);
      } else if (
        extension === ".xlsx" ||
        extension === ".xls" ||
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel"
      ) {
        return await this.parseXlsx(fileBuffer);
      } else if (
        extension === ".txt" ||
        extension === ".csv" ||
        extension === ".md" ||
        mimeType?.startsWith("text/")
      ) {
        return fileBuffer.toString("utf-8");
      } else {
        // Safe fallback: try reading as UTF-8 string
        console.warn(`⚠️ Unknown file type (${extension} / ${mimeType}). Attempting direct UTF-8 decoding.`);
        return fileBuffer.toString("utf-8");
      }
    } catch (error: any) {
      console.error(`❌ Failed to parse file ${path.basename(filePath)}:`, error.message);
      throw new Error(`Parsing Error [${extension}]: ${error.message}`);
    }
  }

  /**
   * PDF text extraction
   */
  private async parsePdf(buffer: Buffer): Promise<string> {
    const pdfModule = await import("pdf-parse");
    const pdf: any = pdfModule.default || pdfModule;
    const data = await pdf(buffer);
    if (!data.text || !data.text.trim()) {
      throw new Error("No text content could be extracted from PDF (might be image-only).");
    }
    return data.text;
  }

  /**
   * DOCX text extraction
   */
  private async parseDocx(buffer: Buffer): Promise<string> {
    const result = (await mammoth.extractRawText({ buffer })) as any;
    if (result.warnings && result.warnings.length > 0) {
      console.warn("Mammoth parsing warnings:", result.warnings);
    }
    return result.value;
  }

  /**
   * Excel sheet data extraction (to text)
   */
  private async parseXlsx(buffer: Buffer): Promise<string> {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    let combinedText = "";

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rowsText = xlsx.utils.sheet_to_txt(worksheet);
      if (rowsText.trim()) {
        combinedText += `--- Sheet: ${sheetName} ---\n${rowsText}\n\n`;
      }
    }

    if (!combinedText.trim()) {
      throw new Error("No text content could be extracted from Excel workbook.");
    }

    return combinedText;
  }
}
