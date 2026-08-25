import { transform } from "sucrase"

export function transpileTypeScript(code: string): string {
  return transform(code, {
    transforms: ["typescript"],
    production: true,
    disableESTransforms: false,
  }).code
}
