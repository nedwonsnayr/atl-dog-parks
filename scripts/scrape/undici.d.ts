declare module "undici" {
  export class Agent {
    constructor(options?: {
      connect?: {
        lookup?: (
          hostname: string,
          options: { all?: boolean },
          callback: (
            error: Error | null,
            address: string | { address: string; family: number }[],
            family?: number,
          ) => void,
        ) => void;
      };
    });
  }
}
