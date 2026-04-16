export function logEvent(event: string, fields: Record<string, unknown>): void {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  process.stderr.write(`${JSON.stringify(payload)}\n`);
}
