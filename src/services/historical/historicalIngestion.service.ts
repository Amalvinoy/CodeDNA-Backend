import fs from 'fs';
import path from 'path';
import { HistoricalRule, IHistoricalRule } from '../../models';
import { EmbeddingService } from '../embeddings';

export interface IngestionReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  inserted: number;
  updated: number;
  skipped: number;
  durationMs: number;
  errors: string[];
}

interface RawCSVRow {
  id: string;
  type: string;
  description: string;
}

export class HistoricalIngestionService {
  static async importFromCSVFile(filePath: string): Promise<IngestionReport> {
    const startTime = Date.now();
    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`CSV file not found at path: ${resolvedPath}`);
    }

    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    return await this.importFromCSVContent(fileContent);
  }

  static async importFromCSVContent(csvContent: string): Promise<IngestionReport> {
    const startTime = Date.now();
    const report: IngestionReport = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicates: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      durationMs: 0,
      errors: [],
    };

    if (!csvContent || !csvContent.trim()) {
      report.durationMs = Date.now() - startTime;
      return report;
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      report.durationMs = Date.now() - startTime;
      return report;
    }

    // 1. Parse and validate headers
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

    const idIndex = headers.indexOf('id');
    const typeIndex = headers.indexOf('type');
    const descIndex = headers.indexOf('description');

    if (idIndex === -1 || typeIndex === -1 || descIndex === -1) {
      throw new Error(
        `Invalid CSV header. Expected "id,type,description" but received: "${headerLine}"`
      );
    }

    const dataLines = lines.slice(1);
    report.totalRows = dataLines.length;

    const seenIds = new Set<string>();
    const seenDescriptions = new Set<string>();
    const validRecords: RawCSVRow[] = [];

    // 2. Row Validation & Deduplication
    dataLines.forEach((line, index) => {
      const rowNum = index + 2;
      const columns = this.parseCSVLine(line);

      const id = columns[idIndex]?.trim();
      const type = columns[typeIndex]?.trim().toLowerCase();
      const description = columns[descIndex]?.trim();

      // Check required fields
      if (!id || !type || !description) {
        report.invalidRows++;
        report.errors.push(`Row ${rowNum}: Missing required field (id, type, or description)`);
        return;
      }

      const normalizedDesc = description.toLowerCase().replace(/\s+/g, ' ');

      // Check in-batch duplicate ID or duplicate description
      if (seenIds.has(id)) {
        report.duplicates++;
        report.errors.push(`Row ${rowNum}: Duplicate external ID "${id}" in CSV`);
        return;
      }

      if (seenDescriptions.has(normalizedDesc)) {
        report.duplicates++;
        report.errors.push(`Row ${rowNum}: Duplicate rule description in CSV`);
        return;
      }

      seenIds.add(id);
      seenDescriptions.add(normalizedDesc);
      validRecords.push({ id, type, description });
      report.validRows++;
    });

    // 3. Batch Embedding Generation & Idempotent Upsert to MongoDB
    for (const record of validRecords) {
      try {
        const normalizedDescription = record.description.toLowerCase().replace(/\s+/g, ' ');

        // Check if existing record exists
        const existing = await HistoricalRule.findOne({ externalId: record.id });

        // Generate embedding if new or changed
        let embedding = existing?.embedding;
        if (!embedding || embedding.length === 0 || existing.description !== record.description) {
          embedding = await EmbeddingService.generateEmbedding(
            `${record.type}: ${record.description}`
          );
        }

        const categoryTag = record.type.toUpperCase();

        const updateResult = await HistoricalRule.updateOne(
          { externalId: record.id },
          {
            $set: {
              externalId: record.id,
              type: record.type,
              description: record.description,
              normalizedDescription,
              embedding,
              'metadata.category': categoryTag,
              'metadata.source': 'Historical Engineering CSV',
              'metadata.lastEnforced': 'Recently',
            },
          },
          { upsert: true }
        );

        if (updateResult.upsertedCount > 0) {
          report.inserted++;
        } else if (updateResult.modifiedCount > 0) {
          report.updated++;
        } else {
          report.skipped++; // Unchanged
        }
      } catch (err: any) {
        report.errors.push(`Failed to upsert rule ID "${record.id}": ${err.message}`);
      }
    }

    report.durationMs = Date.now() - startTime;
    return report;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
}
