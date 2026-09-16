import { IReview, IReviewHistoricalContext } from '../models';
export interface SubmitReviewInput {
    language: string;
    fileName?: string;
    sourceCode: string;
}
export interface PaginatedReviewsResult {
    reviews: IReview[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class ReviewService {
    private static readonly MAX_CODE_SIZE_BYTES;
    static submitReview(userId: string, input: SubmitReviewInput): Promise<IReview>;
    static getUserReviews(userId: string, page?: number, limit?: number): Promise<PaginatedReviewsResult>;
    static getReviewById(reviewIdString: string, userId: string): Promise<IReview | null>;
    static getReviewHistoricalContext(reviewIdString: string, userId: string): Promise<IReviewHistoricalContext | null>;
    static deleteReview(reviewIdString: string, userId: string): Promise<boolean>;
    private static getDefaultExtensionForLanguage;
}
