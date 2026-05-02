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
