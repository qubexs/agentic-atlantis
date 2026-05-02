declare module 'inquirer' {
  export interface PromptOptions {
    type?: string;
    name?: string;
    message?: string;
    default?: any;
    choices?: string[];
  }

  export function prompt(prompts: PromptOptions | PromptOptions[]): Promise<any>;
}