// Shared backend type definitions (planned for future phases)
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  service?: string;
  status?: string;
}
