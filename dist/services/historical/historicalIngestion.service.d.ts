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
export declare class HistoricalIngestionService {
    static importFromCSVFile(filePath: string): Promise<IngestionReport>;
    static importFromCSVContent(csvContent: string): Promise<IngestionReport>;
    private static parseCSVLine;
}
