/*
 * MindTouch DekiScript - embeddable web-oriented scripting runtime
 * Copyright (c) 2006-2010 MindTouch Inc.
 * www.mindtouch.com  oss@mindtouch.com
 *
 * For community documentation and downloads visit wiki.developer.mindtouch.com;
 * please review the licensing section.
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

using MindTouch.Deki.Script.Expr;

namespace MindTouch.Deki.Script.Runtime.TargetInvocation {
    public interface IDekiScriptInvocationTarget {

        //--- Methods ---
        DekiScriptLiteral Invoke(DekiScriptRuntime runtime, DekiScriptLiteral args);
        DekiScriptLiteral InvokeList(DekiScriptRuntime runtime, DekiScriptList args);
        DekiScriptLiteral InvokeMap(DekiScriptRuntime runtime, DekiScriptMap args);
    }
}