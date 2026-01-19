export interface Monitor {
  enterPath(path: string): void;
  leavePath(path: string): void;
}

export class NoMonitor {
  enterPath() { };
  leavePath() { };
}

export class ActiveMonitor {
  active: Set<string>;
  constructor() {
    this.active = new Set<string>();
    process.stdout.write("\n\x1B7");  // save cursor at newline
  }

  show() {
    process.stdout.write("\n\x1B8");  // restore cursor at newline
    process.stdout.write("\n\x1B7");  // save cursor at newline
    const act = [...this.active];
    act.sort();
    for(const e of act) {
      process.stdout.write(e + "\n");
    }
  }

  enterPath(path: string) {
    this.active.add(path);
    this.show();
  }
  leavePath(path: string) {
    this.active.delete(path);
    this.show();
  }
}

export class SlowMonitor {
  timeouts: Map<String, NodeJS.Timeout>;

  constructor() {
    this.timeouts = new Map<String, NodeJS.Timeout>();
  }

  enterPath(path: string) {
    this.timeouts.set(path, setTimeout(() => console.log(path, "takes long"), 10000));
  }
  leavePath(path: string) {
    clearTimeout(this.timeouts.get(path));
    this.timeouts.delete(path);
  }
}
