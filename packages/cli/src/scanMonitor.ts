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

export class TreeMonitor {
  activePaths: Map<string, { startTime: number; children: Set<string> }>;
  pathHierarchy: Map<string, string[]>; // path -> [parent, grandparent, ...]
  refreshInterval: NodeJS.Timeout | null;
  lastUpdateTime: number;

  constructor() {
    this.activePaths = new Map();
    this.pathHierarchy = new Map();
    this.refreshInterval = null;
    this.lastUpdateTime = Date.now();
    
    // Start refresh loop
    this.startRefreshLoop();
  }

  startRefreshLoop() {
    this.refreshInterval = setInterval(() => {
      this.renderTree();
    }, 1000); // Update every second
  }

  stopRefreshLoop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  getParentPath(path: string): string | null {
    if (path === "/") return null;
    const lastSlash = path.lastIndexOf("/");
    if (lastSlash <= 0) return "/"; // Root parent
    return path.substring(0, lastSlash) || "/";
  }

  buildHierarchy(path: string): string[] {
    const hierarchy: string[] = [];
    let current = path;
    
    while (current !== "/" && current.length > 0) {
      hierarchy.unshift(current);
      const parent = this.getParentPath(current);
      if (parent === null || parent === current) break;
      current = parent;
    }
    
    if (current === "/") {
      hierarchy.unshift("/");
    }
    
    return hierarchy;
  }

  getTimeElapsed(path: string): string {
    const pathInfo = this.activePaths.get(path);
    if (!pathInfo) {
      // For root path, calculate time based on longest-running child
      if (path === "/") {
        let maxTime = 0;
        for (const [, childInfo] of this.activePaths) {
          const childTime = Date.now() - childInfo.startTime;
          if (childTime > maxTime) {
            maxTime = childTime;
          }
        }
        if (maxTime < 1000) return `${Math.round(maxTime)}ms`;
        return `${(maxTime / 1000).toFixed(1)}s`;
      }
      return "0s";
    }
    
    const elapsed = Date.now() - pathInfo.startTime;
    if (elapsed < 1000) return `${Math.round(elapsed)}ms`;
    return `${(elapsed / 1000).toFixed(1)}s`;
  }

  renderTree() {
    if (this.activePaths.size === 0) {
      return; // Nothing to show
    }
    
    // Clear screen and move cursor to top
    process.stdout.write("\x1B[2J"); // Clear screen
    process.stdout.write("\x1B[H"); // Move cursor to home position
    
    // Build a tree structure
    const rootPaths: string[] = [];
    const pathInfoMap = new Map<string, { path: string; time: string; depth: number }>();
    
    // Collect all active paths with their hierarchy
    for (const [path] of this.activePaths) {
      const hierarchy = this.buildHierarchy(path);
      this.pathHierarchy.set(path, hierarchy);
      
      for (let i = 0; i < hierarchy.length; i++) {
        const currentPath = hierarchy[i];
        const time = i === hierarchy.length - 1 ? this.getTimeElapsed(path) : this.getTimeElapsed(currentPath);
        
        if (!pathInfoMap.has(currentPath)) {
          pathInfoMap.set(currentPath, {
            path: currentPath,
            time: time,
            depth: i
          });
        }
      }
    }
    
    // Find root paths (paths that are not children of any other active path)
    const allPaths = Array.from(pathInfoMap.keys());
    for (const path of allPaths) {
      const hierarchy = this.pathHierarchy.get(path) || [];
      const parent = hierarchy.length > 1 ? hierarchy[hierarchy.length - 2] : null;
      
      if (!parent || !allPaths.includes(parent)) {
        rootPaths.push(path);
      }
    }
    
    // Sort root paths
    rootPaths.sort();
    
    // Render each root path and its children
    for (const rootPath of rootPaths) {
      this.renderPathTree(rootPath, pathInfoMap, 0);
    }
  }

  renderPathTree(path: string, pathInfoMap: Map<string, { path: string; time: string; depth: number }>, indent: number) {
    const info = pathInfoMap.get(path);
    if (!info) return;
    
    // Render current path
    const prefix = "  ".repeat(indent);
    const isActive = this.activePaths.has(path);
    const symbol = isActive ? "🔄" : "📁";
    
    process.stdout.write(`${prefix}${symbol} ${path} (${info.time})\n`);
    
    // Find and render children
    const children: string[] = [];
    for (const [childPath, childInfo] of pathInfoMap) {
      const childHierarchy = this.pathHierarchy.get(childPath);
      if (childHierarchy && childHierarchy.length > 1) {
        const childParent = childHierarchy[childHierarchy.length - 2];
        if (childParent === path && childInfo.depth === info.depth + 1) {
          children.push(childPath);
        }
      }
    }
    
    // Sort children
    children.sort();
    
    // Render children
    for (const childPath of children) {
      this.renderPathTree(childPath, pathInfoMap, indent + 1);
    }
  }

  enterPath(path: string) {
    this.activePaths.set(path, {
      startTime: Date.now(),
      children: new Set()
    });
    this.renderTree();
  }

  leavePath(path: string) {
    this.activePaths.delete(path);
    this.renderTree();
  }

  cleanup() {
    this.stopRefreshLoop();
    process.stdout.write("\n"); // Final newline
  }
}
