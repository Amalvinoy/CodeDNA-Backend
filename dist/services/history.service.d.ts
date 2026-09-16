import { IReview } from '../models';
export declare class HistoryService {
    static getDiagnosticLogs(userId: string): Promise<IReview[]>;
}
