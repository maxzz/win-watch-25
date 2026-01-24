export interface WindowInfo {
  handle: string;
  title: string;
  processName: string;
  processId: number;
  className: string;
  children?: WindowInfo[];
}

export interface ControlNode {
  name: string;
  controlType: string;
  automationId: string;
  className: string;
  runtimeId: string;
  bounds: { x: number; y: number; width: number; height: number };
  isEnabled: boolean;
  isVisible: boolean;
  children?: ControlNode[];
}
