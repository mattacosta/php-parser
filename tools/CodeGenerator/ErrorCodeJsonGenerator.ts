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

import { DiagnosticInfo } from './DiagnosticConfig';

export class ErrorCodeJsonGenerator {

  protected constructor() {}

  public static generate(diagnostics: DiagnosticInfo[]): string {
    let info: { [key: string]: any } = {};
    let n = 0;
    for (let i = 0; i < diagnostics.length; i++) {
      let error = diagnostics[i];
      if (error.code) {
        n = error.code;
      }
      info[n] = {
        severity: error.severity ? error.severity : 3,  // DiagnosticSeverity.Error
        text: error.text
      };
      n++;
    }
    return JSON.stringify(info, undefined, '  ');
  }

}
