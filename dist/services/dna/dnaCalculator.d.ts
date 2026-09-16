import { IReview, ICodeDNA } from '../../models';
export declare class DnaCalculator {
    static calculateProfile(userId: string, reviews: IReview[]): Partial<ICodeDNA>;
}
