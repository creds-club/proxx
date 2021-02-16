/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-ignore
import * as dat from "dat.gui/build/dat.gui.module.js";

import ShaderBox from "../../utils/shaderbox";
import Nebula from "../preact-canvas/components/nebula";

const gui = new dat.GUI();

export function nebula(nebula: Nebula, shaderBox: ShaderBox) {
  const nebulaUniforms = {};

  const nebulaF = gui.addFolder("Nebula");

  for (const uniformName of shaderBox.getUniformNames()) {
    // `dangerMode` has special handling due to being a boolean
    if (uniformName === "dangerMode") {
      continue;
    }
    Object.defineProperty(nebulaUniforms, uniformName, {
      get() {
        return shaderBox.getUniform(uniformName)![0];
      },
      set(v: number) {
        shaderBox.setUniform1f(uniformName, v);
      }
    });
    nebulaF.add(nebulaUniforms, uniformName, 0, 10);
  }

  nebulaF.add(nebula, "_timePeriod", 1, 100000);
}
