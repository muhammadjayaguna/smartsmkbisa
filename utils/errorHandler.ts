/**
 * Centralized error handling utilities
 */

export interface DatabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface AppError {
  type: 'validation' | 'database' | 'network' | 'auth' | 'upload' | 'unknown';
  message: string;
  originalError?: unknown;
}

/**
 * Parse Supabase/PostgreSQL error codes into user-friendly messages
 */
export const parseSupabaseError = (error: any): AppError => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!error) {
    return {
      type: 'unknown',
      message: 'Terjadi kesalahan yang tidak diketahui'
    };
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.name === 'AbortError') {
    return {
      type: 'network',
      message: 'Koneksi timeout. Periksa koneksi internet dan coba lagi.',
      originalError: error
    };
  }

  // Handle network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      type: 'network',
      message: 'Masalah koneksi internet. Periksa koneksi dan coba lagi.',
      originalError: error
    };
  }

  // Handle authentication errors
  if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    return {
      type: 'auth',
      message: 'Sesi login telah berakhir. Silakan login kembali.',
      originalError: error
    };
  }

  // Handle PostgreSQL constraint violations
  switch (error.code) {
    case '23505': // unique_violation
      if (error.message?.includes('nisn')) {
        return {
          type: 'validation',
          message: 'NISN sudah terdaftar dalam sistem',
          originalError: error
        };
      }
      if (error.message?.includes('email')) {
        return {
          type: 'validation',
          message: 'Email sudah digunakan',
          originalError: error
        };
      }
      return {
        type: 'validation',
        message: 'Data sudah ada dalam sistem',
        originalError: error
      };

    case '23503': // foreign_key_violation
      if (error.message?.includes('rombel')) {
        return {
          type: 'validation',
          message: 'Rombel yang dipilih tidak valid atau sudah dihapus',
          originalError: error
        };
      }
      if (error.message?.includes('siswa')) {
        return {
          type: 'validation',
          message: 'Data siswa tidak valid atau sudah dihapus',
          originalError: error
        };
      }
      return {
        type: 'validation',
        message: 'Data referensi tidak valid',
        originalError: error
      };

    case '23514': // check_violation
      return {
        type: 'validation',
        message: 'Data tidak memenuhi kriteria yang ditetapkan',
        originalError: error
      };

    case '23502': // not_null_violation
      return {
        type: 'validation',
        message: 'Ada field wajib yang belum diisi',
        originalError: error
      };

    case 'PGRST116': // not found
      return {
        type: 'database',
        message: 'Data tidak ditemukan',
        originalError: error
      };

    case '42P01': // undefined_table
      return {
        type: 'database',
        message: 'Tabel database tidak ditemukan. Hubungi administrator.',
        originalError: error
      };

    case '42703': // undefined_column
      return {
        type: 'database',
        message: 'Struktur database tidak valid. Hubungi administrator.',
        originalError: error
      };

    default:
      // Handle RLS (Row Level Security) errors
      if (error.message?.includes('RLS') || error.message?.includes('policy')) {
        return {
          type: 'auth',
          message: 'Anda tidak memiliki izin untuk melakukan operasi ini',
          originalError: error
        };
      }

      // Handle storage errors
      if (error.message?.includes('storage') || error.message?.includes('upload')) {
        return {
          type: 'upload',
          message: 'Gagal mengupload file. Periksa koneksi internet.',
          originalError: error
        };
      }

      return {
        type: 'unknown',
        message: error.message || 'Terjadi kesalahan yang tidak diketahui',
        originalError: error
      };
  }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors
      const parsedError = parseSupabaseError(error);
      if (parsedError.type === 'validation' || parsedError.type === 'auth') {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
    }
  }

  throw lastError;
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  minSize?: number;
} = {}): { isValid: boolean; error?: string } => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    minSize = 1000 // 1KB minimum
  } = options;

  if (!file) {
    return { isValid: false, error: 'File tidak dipilih' };
  }

  if (file.size < minSize) {
    return { isValid: false, error: 'File terlalu kecil atau rusak' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: `Ukuran file terlalu besar. Maksimal ${(maxSize / 1024 / 1024).toFixed(1)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}` };
  }

  return { isValid: true };
};

/**
 * Validate location data
 */
export const validateLocation = (location: { lat?: number; lng?: number; address?: string } | null): { isValid: boolean; error?: string } => {
  if (!location) {
    return { isValid: false, error: 'Lokasi belum didapatkan' };
  }

  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return { isValid: false, error: 'Koordinat lokasi tidak valid' };
  }

  if (Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
    return { isValid: false, error: 'Koordinat lokasi di luar jangkauan yang valid' };
  }

  if (!location.address || location.address.trim().length === 0) {
    return { isValid: false, error: 'Alamat lokasi tidak valid' };
  }

  return { isValid: true };
};

/**
 * Sanitize text input
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';

  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 255); // Limit length
};

/**
 * Validate NISN format
 */
export const validateNISN = (nisn: string): { isValid: boolean; error?: string } => {
  if (!nisn || !nisn.trim()) {
    return { isValid: false, error: 'NISN harus diisi' };
  }

  const cleanNisn = nisn.trim();

  if (!/^\d+$/.test(cleanNisn)) {
    return { isValid: false, error: 'NISN harus berupa angka' };
  }

  if (cleanNisn.length < 8) {
    return { isValid: false, error: 'NISN minimal 8 digit' };
  }

  if (cleanNisn.length > 20) {
    return { isValid: false, error: 'NISN maksimal 20 digit' };
  }

  return { isValid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email harus diisi' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Format email tidak valid' };
  }

  return { isValid: true };
};

/**
 * Create timeout promise for database operations
 */
export const createTimeoutPromise = (timeoutMs: number = 30000) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operasi timeout setelah ${timeoutMs / 1000} detik`)), timeoutMs)
  );
};

/**
 * Safe database operation with timeout and retry
 */
export const safeDbOperation = async <T>(
  operation: () => Promise<T>,
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> => {
  const { timeout = 30000, retries = 2, retryDelay = 1000 } = options;

  return retryWithBackoff(
    () => Promise.race([
      operation(),
      createTimeoutPromise(timeout)
    ]) as Promise<T>,
    retries,
    retryDelay
  );
};