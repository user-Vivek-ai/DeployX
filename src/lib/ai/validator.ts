import { ProjectFile, FileChange } from '../types';

export class CodeSecurityValidator {
  private static ALLOWED_EXTENSIONS = [
    '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.svg'
  ];

  private static DANGEROUS_PATTERNS = [
    /child_process/i,
    /process\.env/i,
    /fs\.(unlink|rmdir|rm|chmod)/i,
    /eval\s*\(/i,
    /<script[^>]*src=["']http/i, // external remote script injection
  ];

  /**
   * Validates that a file path is safe and stays within the project virtual directory
   */
  public static validateFilePath(path: string): { valid: boolean; error?: string } {
    if (!path || typeof path !== 'string') {
      return { valid: false, error: 'File path cannot be empty' };
    }

    const trimmed = path.trim().replace(/\\/g, '/');

    // Reject directory traversal
    if (trimmed.includes('../') || trimmed.includes('/..') || trimmed === '..') {
      return { valid: false, error: `Directory traversal prohibited: "${path}"` };
    }

    // Reject absolute OS drive letters or root paths
    if (/^[a-zA-Z]:/.test(trimmed) || trimmed.startsWith('/')) {
      return { valid: false, error: `Absolute system paths prohibited: "${path}"` };
    }

    // Check extension
    const hasAllowedExt = this.ALLOWED_EXTENSIONS.some(ext => trimmed.toLowerCase().endsWith(ext));
    if (!hasAllowedExt) {
      return {
        valid: false,
        error: `Disallowed file extension for "${path}". Supported: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Inspects code content for dangerous operations or execution attempts
   */
  public static sanitizeFileContent(filename: string, content: string): { content: string; warnings: string[] } {
    const warnings: string[] = [];

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        warnings.push(`Warning in ${filename}: Detected restricted pattern matching ${pattern.toString()}`);
      }
    }

    return {
      content,
      warnings
    };
  }

  /**
   * Validates entire set of generated files before applying to project
   */
  public static validateGeneratedFiles(files: ProjectFile[]): { valid: boolean; errors: string[]; sanitized: ProjectFile[] } {
    const errors: string[] = [];
    const sanitized: ProjectFile[] = [];

    for (const file of files) {
      const pathCheck = this.validateFilePath(file.path);
      if (!pathCheck.valid) {
        errors.push(pathCheck.error || `Invalid path: ${file.path}`);
        continue;
      }

      const { content } = this.sanitizeFileContent(file.path, file.content);
      sanitized.push({
        ...file,
        content,
        size: new TextEncoder().encode(content).length
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }
}
