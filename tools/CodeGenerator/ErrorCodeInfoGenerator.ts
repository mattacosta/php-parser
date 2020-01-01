/**
 * Copyright 2017 Matt Acosta
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import * as os from 'os';

import { DiagnosticInfo } from './DiagnosticConfig';

export class ErrorCodeInfoGenerator {

  protected readonly licenseText: string = [
    '/**',
    ' * Copyright 2017 Matt Acosta',
    ' *',
    ' * Licensed under the Apache License, Version 2.0 (the "License");',
    ' * you may not use this file except in compliance with the License.',
    ' * You may obtain a copy of the License at',
    ' *',
    ' *     http://www.apache.org/licenses/LICENSE-2.0',
    ' *',
    ' * Unless required by applicable law or agreed to in writing, software',
    ' * distributed under the License is distributed on an "AS IS" BASIS,',
    ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
    ' * See the License for the specific language governing permissions and',
    ' * limitations under the License.',
    ' */'
  ].join(os.EOL);

  protected text: string;

  protected constructor() {
    this.text = this.licenseText +
      '\n' +
      '\n' +
      '// ----------------------------------------------------------------------------\n' +
      '// THIS IS A GENERATED FILE. DO NOT MODIFY.\n' +
      '// ----------------------------------------------------------------------------\n' +
      '\n' +
      '\'use strict\';\n' +
      '\n';
  }

  public static generate(diagnostics: DiagnosticInfo[]): string {
    let generator = new ErrorCodeInfoGenerator();
    generator.addImports();
    generator.addErrorCodeDataInterface();
    generator.addClass(diagnostics);
    return generator.text;
  }

  protected addClass(diagnostics: DiagnosticInfo[]): void {
    this.text += 'export class ErrorCodeInfo {\n';
    this.text += '\n';
    this.text += '  protected static Resources = new ResourceSet<ErrorCodeData>(\'../ErrorCode.json\');\n';
    this.text += '\n';
    this.text += this.addFormatMessage();
    this.text += '\n';
    this.text += this.addGetMessage();
    this.text += '\n';
    this.text += this.addGetSeverity();
    this.text += '\n';
    this.text += this.addIsInfo(diagnostics);
    this.text += '\n';
    this.text += this.addIsWarning(diagnostics);
    this.text += '\n';
    this.text += '}\n';
  }

  protected addErrorCodeDataInterface(): void {
    this.text += 'export interface ErrorCodeData {\n';
    this.text += '\n';
    this.text += '  severity: number;\n';
    this.text += '\n';
    this.text += '  text: string;\n';
    this.text += '\n';
    this.text += '}\n';
    this.text += '\n';
  }

  protected addFormatMessage(): string {
    let text = '  public static formatMessage(code: ErrorCode, messageArgs: ReadonlyArray<any>): string {\n';
    text += '    let message = ErrorCodeInfo.getMessage(code);\n';
    text += '    if (messageArgs.length > 0) {\n';
    text += '      let args = messageArgs.slice();\n';
    text += '      message = message.replace(/%s/g, function() { return args.shift(); });\n';
    text += '    }\n';
    text += '    return message;\n';
    text += '  }\n';
    return text;
  }

  protected addGetMessage(): string {
    let text = '  public static getMessage(code: ErrorCode): string {\n';
    text += '    if (code <= ErrorCode.Unknown) {\n';
    text += '      throw new ArgumentOutOfRangeException();\n';
    text += '    }\n';
    text += '    let data = ErrorCodeInfo.Resources.get(code.toString());\n';
    text += '    return data.text;\n';
    text += '  }\n';
    return text;
  }

  protected addGetSeverity(): string {
    let text = '  public static getSeverity(code: ErrorCode): DiagnosticSeverity {\n';
    text += '    if (ErrorCodeInfo.isInfo(code)) {\n';
    text += '      return DiagnosticSeverity.Info;\n';
    text += '    }\n';
    text += '    else if (ErrorCodeInfo.isWarning(code)) {\n';
    text += '      return DiagnosticSeverity.Warning;\n';
    text += '    }\n';
    text += '    else {\n';
    text += '      return DiagnosticSeverity.Error;\n';
    text += '    }\n';
    text += '  }\n';
    return text;
  }

  protected addImports(): void {
    this.text += 'import { ArgumentOutOfRangeException} from \'@mattacosta/php-common\';\n';
    this.text += '\n';
    this.text += 'import { ErrorCode } from \'./ErrorCode.Generated\';\n';
    this.text += 'import { DiagnosticSeverity } from \'./DiagnosticSeverity\';\n';
    this.text += 'import { ResourceSet } from \'./ResourceSet\';\n';
    this.text += '\n';
  }

  protected addIsInfo(diagnostics: DiagnosticInfo[]): string {
    let info: string[] = [];
    for (let i = 0; i < diagnostics.length; i++) {
      let diagnostic = diagnostics[i];
      if (diagnostic.severity && diagnostic.severity === 1) {
        info.push('      case ErrorCode.' + diagnostic.name + ':');
      }
    }

    let text = '  public static isInfo(code: ErrorCode): boolean {\n';
    text += '    switch (code) {\n';
    if (info.length > 0) {
      text += info.join('\n') + '\n';
      text += '        return true;\n';
    }
    text += '      default:\n';
    text += '        return false;\n';
    text += '    }\n';
    text += '  }\n';

    return text;
  }

  protected addIsWarning(diagnostics: DiagnosticInfo[]): string {
    let warnings: string[] = [];
    for (let i = 0; i < diagnostics.length; i++) {
      let diagnostic = diagnostics[i];
      if (diagnostic.severity && diagnostic.severity === 2) {
        warnings.push('      case ErrorCode.' + diagnostic.name + ':');
      }
    }

    let text = '  public static isWarning(code: ErrorCode): boolean {\n';
    text += '    switch (code) {\n';
    if (warnings.length > 0) {
      text += warnings.join('\n') + '\n';
      text += '        return true;\n';
    }
    text += '      default:\n';
    text += '        return false;\n';
    text += '    }\n';
    text += '  }\n';

    return text;
  }

}
