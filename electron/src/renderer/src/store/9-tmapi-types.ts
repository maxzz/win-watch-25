export interface WindowInfo {
  handle: string;
  title: string;
  processName: string;
  processId: number;
  className: string;
  rect: { left: number; top: number; right: number; bottom: number };
  children?: WindowInfo[];
}

export interface ControlNode {
  name: string;
  controlType: string;
  automationId: string;
  className: string;
  runtimeId: string;
  bounds: { left: number; top: number; right: number; bottom: number };
  isEnabled: boolean;
  isVisible: boolean;
  children?: ControlNode[];
}
