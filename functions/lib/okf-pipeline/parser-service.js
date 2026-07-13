"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const xlsx = __importStar(require("xlsx"));
class ParserService {
    /**
     * Parses the file at the given local path and returns its text contents.
     */
    async parseFile(filePath, mimeType) {
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`File not found at path: ${filePath}`);
        }
        const extension = path_1.default.extname(filePath).toLowerCase();
        const fileBuffer = fs_1.default.readFileSync(filePath);
        try {
            if (extension === ".pdf" || mimeType === "application/pdf") {
                return await this.parsePdf(fileBuffer);
            }
            else if (extension === ".docx" ||
                mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                return await this.parseDocx(fileBuffer);
            }
            else if (extension === ".xlsx" ||
                extension === ".xls" ||
                mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                mimeType === "application/vnd.ms-excel") {
                return await this.parseXlsx(fileBuffer);
            }
            else if (extension === ".txt" ||
                extension === ".csv" ||
                extension === ".md" ||
                mimeType?.startsWith("text/")) {
                return fileBuffer.toString("utf-8");
            }
            else {
                // Safe fallback: try reading as UTF-8 string
                console.warn(`⚠️ Unknown file type (${extension} / ${mimeType}). Attempting direct UTF-8 decoding.`);
                return fileBuffer.toString("utf-8");
            }
        }
        catch (error) {
            console.error(`❌ Failed to parse file ${path_1.default.basename(filePath)}:`, error.message);
            throw new Error(`Parsing Error [${extension}]: ${error.message}`);
        }
    }
    /**
     * PDF text extraction
     */
    async parsePdf(buffer) {
        const pdfModule = await Promise.resolve().then(() => __importStar(require("pdf-parse")));
        const pdf = pdfModule.default || pdfModule;
        const data = await pdf(buffer);
        if (!data.text || !data.text.trim()) {
            throw new Error("No text content could be extracted from PDF (might be image-only).");
        }
        return data.text;
    }
    /**
     * DOCX text extraction
     */
    async parseDocx(buffer) {
        const result = (await mammoth_1.default.extractRawText({ buffer }));
        if (result.warnings && result.warnings.length > 0) {
            console.warn("Mammoth parsing warnings:", result.warnings);
        }
        return result.value;
    }
    /**
     * Excel sheet data extraction (to text)
     */
    async parseXlsx(buffer) {
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
exports.ParserService = ParserService;
//# sourceMappingURL=parser-service.js.map