export class UpstreamServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamServiceError";
  }
}
