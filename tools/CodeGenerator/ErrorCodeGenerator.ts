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

export class ErrorCodeGenerator {

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
    let generator = new ErrorCodeGenerator();
    generator.addEnum(diagnostics);
    return generator.text;
  }

  protected addEnum(diagnostics: DiagnosticInfo[]) {
    this.text += 'export enum ErrorCode {\n';
    this.text += '\n';

    this.text += '  /**\n';
    this.text += '   * An error code that was unknown, but has since been found to be unnecessary.\n';
    this.text += '   */\n';
    this.text += '  Void = -1,\n';
    this.text += '  /**\n';
    this.text += '   * An error code that has yet to be determined.\n';
    this.text += '   */\n';
    this.text += '  Unknown = 0';

    let code = 1;  // See above.
    for (let i = 0; i < diagnostics.length; i++) {
      let diagnostic = diagnostics[i];
      if (typeof diagnostic.code !== 'undefined') {
        code = diagnostic.code;
      }

      this.text += ',\n';
      this.text += '  /**\n';
      this.text += '   * "' + diagnostic.text.replace('*/', '') + '"\n';
      this.text += '   */\n';
      this.text += '  ' + diagnostic.name;
      this.text += ' = ' + code;

      code++;
    }
    this.text += '\n';  // Last enum member.

    this.text += '\n';
    this.text += '}\n';
  }

}
