// Centralized email configuration utilities
export function getSenderInfo() {
  const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'deployx11@gmail.com';
  const displayName = 'DeployX';
  return { fromEmail, displayName };
}

