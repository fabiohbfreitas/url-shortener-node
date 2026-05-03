export interface AuthNotifier {
  notify(email: string, code: string): void;
}

export class ConsoleAuthNotifier implements AuthNotifier {
  notify(email: string, code: string): void {
    console.log(`[AUTH CODE] Email: ${email} | Code: ${code}`);
  }
}

export class NoopAuthNotifier implements AuthNotifier {
  notify(_email: string, _code: string): void {}
}

export class TestAuthNotifier implements AuthNotifier {
  public lastEmail: string | null = null;
  public lastCode: string | null = null;

  notify(email: string, code: string): void {
    this.lastEmail = email;
    this.lastCode = code;
  }

  clear(): void {
    this.lastEmail = null;
    this.lastCode = null;
  }
}
