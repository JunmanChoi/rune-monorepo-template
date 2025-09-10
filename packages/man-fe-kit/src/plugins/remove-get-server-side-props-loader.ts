// remove-getserversideprops-loader.ts
import { LoaderContext } from "webpack";

// 대상 함수 이름들
const TARGET_FUNCTIONS = [
  "getServerSideProps",
  "getLayoutServerSideProps",
  "getErrorServerSideProps",
] as const;

type TargetFunction = (typeof TARGET_FUNCTIONS)[number];

// 로더 옵션 타입
interface LoaderOptions {
  debug?: boolean;
  performanceWarning?: boolean;
  performanceThreshold?: number;
  include?: RegExp;
  exclude?: RegExp;
}

// 함수 시그니처 정보 타입
interface FunctionSignature {
  type: "const" | "function" | "var";
  fullMatch: string;
  braceStart: number;
  signature: string;
}

// 교체 정보 타입
interface Replacement {
  start: number;
  end: number;
  replacement: string;
  original: string;
}

// 성능 측정 결과 타입
interface PerformanceResult<T> {
  result: T;
  duration: number;
}

// 분석 결과 타입
interface ProcessingAnalysis {
  filename: string;
  hasTargetFunctions: boolean;
  hasChanges: boolean;
  duration: number;
  originalLength: number;
  processedLength: number;
  reduction: number;
  reductionPercent: number;
}

// 주석 타입
type CommentType = "line" | "block" | "";

/**
 * 빠른 중괄호 매칭 (문자열과 주석 고려)
 */
function findMatchingBrace(str: string, startPos: number): number {
  let braceCount = 1;
  let inString = false;
  let stringChar = "";
  let inComment = false;
  let commentType: CommentType = "";
  let i = startPos + 1;

  while (i < str.length && braceCount > 0) {
    const char = str[i];
    const nextChar = str[i + 1];

    // 이스케이프 문자 처리
    if (char === "\\" && inString) {
      i += 2;
      continue;
    }

    // 주석 시작 감지
    if (!inString && !inComment) {
      if (char === "/" && nextChar === "/") {
        inComment = true;
        commentType = "line";
        i += 2;
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inComment = true;
        commentType = "block";
        i += 2;
        continue;
      }
    }

    // 주석 끝 감지
    if (inComment) {
      if (commentType === "line" && char === "\n") {
        inComment = false;
        commentType = "";
      } else if (commentType === "block" && char === "*" && nextChar === "/") {
        inComment = false;
        commentType = "";
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // 문자열 시작/끝 감지
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = "";
    }

    // 중괄호 카운팅 (문자열/주석 밖에서만)
    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
      }
    }

    i++;
  }

  return braceCount === 0 ? i - 1 : -1;
}

/**
 * 함수명이 정확히 일치하는지 확인 (단어 경계 체크)
 */
function isExactFunctionName(
  source: string,
  funcName: TargetFunction,
  index: number
): boolean {
  // 이전 문자 체크 (단어 경계)
  const prevChar = index > 0 ? source[index - 1] : " ";
  const prevIsWordBoundary = /[^a-zA-Z0-9_$]/.test(prevChar);

  // 다음 문자 체크 (단어 경계)
  const nextIndex = index + funcName.length;
  const nextChar = nextIndex < source.length ? source[nextIndex] : " ";
  const nextIsWordBoundary = /[^a-zA-Z0-9_$]/.test(nextChar);

  return prevIsWordBoundary && nextIsWordBoundary;
}

/**
 * import/export 구문 내부인지 더 정확히 확인
 */
function isInImportExportStatement(source: string, index: number): boolean {
  // 해당 라인 전체를 가져와서 분석
  const lineStart = source.lastIndexOf("\n", index - 1) + 1;
  const lineEnd = source.indexOf("\n", index);
  const currentLine = source.substring(
    lineStart,
    lineEnd === -1 ? source.length : lineEnd
  );

  // import 구문 패턴들
  const importPatterns = [
    /^\s*import\s*\{.*\}\s*from/, // import { ... } from
    /^\s*import\s+.*\s+from/, // import something from
    /^\s*import\s*\(/, // dynamic import(
    /^\s*import\s*["']/, // import "module"
    /^\s*import.*from.*["'].*["']/, // 전체 import 라인
  ];

  // export 구문 패턴들 (개선됨)
  const exportPatterns = [
    /^\s*export\s*\{.*\}\s*from/, // export { ... } from
    /^\s*export\s*\{.*\}/, // export { ... } (re-export)
    /^\s*export\s*\*/, // export * from
    /^\s*export\s+\{.*$/, // export { (멀티라인)
    /^\s*export\s*\{[^}]*\w+[^}]*\}/, // export { 함수명들 } (단일라인)
  ];

  const isImport = importPatterns.some((pattern) => pattern.test(currentLine));
  const isExport = exportPatterns.some((pattern) => pattern.test(currentLine));

  // export { ... } 구문 내부의 함수명인지 추가 체크
  if (!isImport && !isExport) {
    // export { 함수명 } 형태 체크
    const exportBraceMatch = currentLine.match(/^\s*export\s*\{([^}]+)\}/);
    if (exportBraceMatch) {
      const exportedNames = exportBraceMatch[1];
      // 함수명이 export 목록에 있는지 확인
      const funcNameInExports = TARGET_FUNCTIONS.some((funcName) => {
        const nameRegex = new RegExp(`\\b${funcName}\\b`);
        return nameRegex.test(exportedNames);
      });

      if (funcNameInExports) {
        return true;
      }
    }
  }

  // 추가 체크: 멀티라인 import 감지
  if (!isImport && !isExport) {
    // 이전 라인들을 확인해서 멀티라인 import 구문인지 체크
    let checkLineStart = lineStart;
    for (let i = 0; i < 10; i++) {
      // 최대 10라인 위까지 확인
      const prevLineEnd = source.lastIndexOf("\n", checkLineStart - 2);
      if (prevLineEnd === -1) break;

      const prevLineStart = source.lastIndexOf("\n", prevLineEnd - 1) + 1;
      const prevLine = source.substring(prevLineStart, prevLineEnd);

      // import가 시작되고 아직 끝나지 않았는지 확인
      if (/^\s*import\s/.test(prevLine) && !prevLine.includes("from")) {
        // 현재 라인까지의 전체 텍스트에서 from이 있는지 확인
        const multiLineText = source.substring(
          prevLineStart,
          lineEnd === -1 ? source.length : lineEnd
        );
        if (multiLineText.includes("from") && !multiLineText.includes(";")) {
          return true;
        }
      }

      // export 멀티라인도 체크
      if (/^\s*export\s*\{/.test(prevLine) && !prevLine.includes("}")) {
        return true;
      }

      // import/export 구문이 완료되면 중단
      if (
        (prevLine.includes("import") && prevLine.includes("from")) ||
        (prevLine.includes("export") && prevLine.includes("}"))
      ) {
        break;
      }

      checkLineStart = prevLineStart;
    }
  }

  return isImport || isExport;
}

/**
 * 함수 컨텍스트 확인 (import/export 구문이 아닌 실제 함수 정의인지)
 */
function isActualFunctionDefinition(
  source: string,
  funcName: TargetFunction,
  index: number
): boolean {
  // 1. import/export 구문 체크
  if (isInImportExportStatement(source, index)) {
    return false;
  }

  const beforeStart = Math.max(0, index - 100);
  const beforeText = source.substring(beforeStart, index);

  // 2. 실제 함수 정의 패턴 확인
  const isFunctionDefinition =
    /(export\s+)?const\s*$/.test(beforeText) ||
    /(export\s+)?(async\s+)?function\s*$/.test(beforeText) ||
    /(var|let)\s*$/.test(beforeText);

  return isFunctionDefinition;
}

/**
 * 함수 시그니처 패턴 매칭 (개선된 버전)
 */
function findFunctionSignature(
  source: string,
  funcName: TargetFunction,
  startIndex: number
): FunctionSignature | null {
  const beforeStart = Math.max(0, startIndex - 150);
  const afterEnd = Math.min(source.length, startIndex + funcName.length + 500);

  const beforeText = source.substring(beforeStart, startIndex);
  const afterText = source.substring(startIndex + funcName.length, afterEnd);

  // const 패턴 체크 (복잡한 제네릭 타입 지원)
  const constMatch = beforeText.match(/(export\s+)?const\s*$/);
  if (constMatch) {
    // 1. 타입 정의 찾기 (콜론 다음부터 = 까지)
    const colonMatch = afterText.match(/^(\s*:\s*)/);
    if (colonMatch) {
      const typeStart = colonMatch[0].length;
      const equalPos = findTypeDefinitionEnd(afterText, typeStart);

      if (equalPos !== -1) {
        // 2. = 다음에 함수 정의 찾기
        const afterEqual = afterText.substring(equalPos + 1);
        const functionMatch = afterEqual.match(
          /^(\s*(async\s*)?\([^)]*\)\s*=>\s*)\{/
        );

        if (functionMatch) {
          const fullConstDeclaration = constMatch[0] + funcName;
          return {
            type: "const",
            fullMatch:
              beforeText +
              funcName +
              afterText.substring(0, equalPos + 1 + functionMatch[0].length),
            braceStart:
              startIndex +
              funcName.length +
              equalPos +
              1 +
              functionMatch[0].length -
              1,
            signature: fullConstDeclaration + ": any = () => ",
          };
        }
      }
    }

    // 단순한 타입 정의 (기존 로직)
    const simpleTypeMatch = afterText.match(
      /^(\s*:\s*[^=<]*?)=\s*(async\s*)?\([^)]*\)\s*=>\s*\{/
    );
    if (simpleTypeMatch) {
      const fullConstDeclaration = constMatch[0] + funcName;
      return {
        type: "const",
        fullMatch: beforeText + funcName + simpleTypeMatch[0],
        braceStart:
          startIndex + funcName.length + simpleTypeMatch[0].length - 1,
        signature: fullConstDeclaration + ": any = () => ",
      };
    }
  }

  // function 패턴 체크
  const funcMatch = beforeText.match(/(export\s+)?(async\s+)?function\s*$/);
  if (funcMatch) {
    const paramsMatch = afterText.match(/^(\s*\([^)]*\)\s*)\{/);
    if (paramsMatch) {
      const fullFuncDeclaration = funcMatch[0] + funcName;
      return {
        type: "function",
        fullMatch: beforeText + funcName + paramsMatch[0],
        braceStart: startIndex + funcName.length + paramsMatch[0].length - 1,
        signature: fullFuncDeclaration + "() ",
      };
    }
  }

  // var/let 패턴 체크
  const varMatch = beforeText.match(/(var|let)\s+$/);
  if (varMatch) {
    const assignMatch = afterText.match(
      /^(\s*=\s*(async\s+)?function\s*\([^)]*\)\s*)\{/
    );
    if (assignMatch) {
      const fullVarDeclaration = varMatch[0] + funcName;
      return {
        type: "var",
        fullMatch: beforeText + funcName + assignMatch[0],
        braceStart: startIndex + funcName.length + assignMatch[0].length - 1,
        signature: fullVarDeclaration + " = function() ",
      };
    }
  }

  return null;
}

/**
 * 디버깅을 위한 상세 분석 함수
 */
function debugFunctionDetection(
  source: string,
  funcName: TargetFunction
): void {
  console.log(`🔍 Debugging detection for: ${funcName}`);

  let searchStart = 0;
  let foundCount = 0;

  while (true) {
    const funcIndex = source.indexOf(funcName, searchStart);
    if (funcIndex === -1) break;

    foundCount++;
    console.log(`\n📍 Found occurrence ${foundCount} at index ${funcIndex}`);

    // 단어 경계 체크
    const isExactMatch = isExactFunctionName(source, funcName, funcIndex);
    console.log(`   Word boundary: ${isExactMatch ? "✅" : "❌"}`);

    // import/export 구문 체크
    const inImportExport = isInImportExportStatement(source, funcIndex);
    console.log(`   In import/export: ${inImportExport ? "❌" : "✅"}`);

    // 함수 정의 체크
    const isFunctionDef = isActualFunctionDefinition(
      source,
      funcName,
      funcIndex
    );
    console.log(`   Function definition: ${isFunctionDef ? "✅" : "❌"}`);

    // 해당 라인 출력
    const lineStart = source.lastIndexOf("\n", funcIndex - 1) + 1;
    const lineEnd = source.indexOf("\n", funcIndex);
    const currentLine = source.substring(
      lineStart,
      lineEnd === -1 ? source.length : lineEnd
    );
    console.log(`   Line: "${currentLine.trim()}"`);

    if (isExactMatch && !inImportExport && isFunctionDef) {
      // 더 넓은 범위로 컨텍스트 확인
      const beforeStart = Math.max(0, funcIndex - 200);
      const afterEnd = Math.min(
        source.length,
        funcIndex + funcName.length + 200
      );

      const beforeText = source.substring(beforeStart, funcIndex);
      const afterText = source.substring(funcIndex + funcName.length, afterEnd);

      console.log(`   Before (200 chars): "${beforeText}"`);
      console.log(`   After (200 chars): "${afterText}"`);

      const signature = findFunctionSignature(source, funcName, funcIndex);
      if (signature) {
        console.log(`   ✅ Signature detected: ${signature.type}`);
        console.log(`   Brace start: ${signature.braceStart}`);
        console.log(`   Full signature: "${signature.signature}"`);
        console.log(`   Full match: "${signature.fullMatch}"`);
      } else {
        console.log(`   ❌ No signature detected`);
      }
    }

    searchStart = funcIndex + 1;
  }

  if (foundCount === 0) {
    console.log(`❌ Function ${funcName} not found in source`);
  }
}

/**
 * 복잡한 제네릭 타입에서 중괄호 찾기
 */
function findTypeDefinitionEnd(str: string, start: number): number {
  let angleBracketCount = 0;
  let parenCount = 0;
  let curlyCount = 0;
  let i = start;

  while (i < str.length) {
    const char = str[i];

    if (char === "<") angleBracketCount++;
    else if (char === ">") angleBracketCount--;
    else if (char === "(") parenCount++;
    else if (char === ")") parenCount--;
    else if (char === "{") curlyCount++;
    else if (char === "}") curlyCount--;

    // 타입 정의가 끝나고 = 를 만나면
    if (
      angleBracketCount === 0 &&
      parenCount === 0 &&
      curlyCount === 0 &&
      char === "="
    ) {
      return i;
    }

    i++;
  }

  return -1;
}

/**
 * 메인 처리 함수 (중복 처리 방지 개선)
 */
function processServerSideProps(
  source: string,
  debug: boolean = false
): string {
  if (debug) {
    console.log("🚀 Starting processing with debug mode");
    TARGET_FUNCTIONS.forEach((func) => {
      if (source.includes(func)) {
        debugFunctionDetection(source, func);
      }
    });
  }

  let processed = source;
  const processedRanges: { start: number; end: number }[] = [];

  // 각 대상 함수에 대해 처리
  for (const funcName of TARGET_FUNCTIONS) {
    let searchStart = 0;

    while (true) {
      // 1. 빠른 문자열 검색
      const funcIndex = processed.indexOf(funcName, searchStart);
      if (funcIndex === -1) break;

      // 2. 정확한 함수명 매칭 확인 (단어 경계)
      if (!isExactFunctionName(processed, funcName, funcIndex)) {
        if (debug) {
          console.log(
            `⚠️ Skipping ${funcName} at ${funcIndex} - not exact word boundary`
          );
        }
        searchStart = funcIndex + 1;
        continue;
      }

      // 3. 이미 처리된 범위인지 확인
      const isInProcessedRange = processedRanges.some(
        (range) => funcIndex >= range.start && funcIndex < range.end
      );

      if (isInProcessedRange) {
        if (debug) {
          console.log(
            `⚠️ Skipping ${funcName} at ${funcIndex} - already processed`
          );
        }
        searchStart = funcIndex + 1;
        continue;
      }

      // 4. import/export 구문 내부가 아닌지 확인
      if (isInImportExportStatement(processed, funcIndex)) {
        if (debug) {
          console.log(
            `⚠️ Skipping ${funcName} at ${funcIndex} - inside import/export statement`
          );
        }
        searchStart = funcIndex + 1;
        continue;
      }

      // 5. 실제 함수 정의인지 확인
      if (!isActualFunctionDefinition(processed, funcName, funcIndex)) {
        if (debug) {
          console.log(
            `⚠️ Skipping ${funcName} at ${funcIndex} - not a function definition`
          );
        }
        searchStart = funcIndex + 1;
        continue;
      }

      // 6. 함수 시그니처 분석
      const signature = findFunctionSignature(processed, funcName, funcIndex);
      if (!signature) {
        if (debug) {
          console.log(
            `⚠️ Skipping ${funcName} at ${funcIndex} - no signature match`
          );
        }
        searchStart = funcIndex + 1;
        continue;
      }

      // 7. 함수 본문 끝 찾기
      const braceEnd = findMatchingBrace(processed, signature.braceStart);
      if (braceEnd === -1) {
        if (debug) {
          console.log(
            `⚠️ Skipping ${funcName} at ${funcIndex} - no matching brace`
          );
        }
        searchStart = funcIndex + 1;
        continue;
      }

      // 8. 함수의 정확한 시작점 찾기
      let actualFunctionStart = funcIndex;

      // 라인의 시작점 찾기
      const lineStart = processed.lastIndexOf("\n", funcIndex - 1) + 1;
      const lineBeforeFunc = processed.substring(lineStart, funcIndex);

      // export const, const, function 등의 키워드 찾기
      const patterns = [
        /(export\s+const\s*)$/,
        /(const\s*)$/,
        /(export\s+function\s*)$/,
        /(function\s*)$/,
        /(var\s*)$/,
        /(let\s*)$/,
      ];

      for (const pattern of patterns) {
        const match = lineBeforeFunc.match(pattern);
        if (match) {
          actualFunctionStart =
            lineStart + lineBeforeFunc.lastIndexOf(match[1]);
          break;
        }
      }

      let replacement: string;
      if (signature.type === "const") {
        replacement = signature.signature + "({})";
      } else {
        replacement = signature.signature + "{ return {}; }";
      }

      if (debug) {
        console.log(`✅ Processing ${funcName}:`);
        console.log(`   Function index: ${funcIndex}`);
        console.log(`   Line start: ${lineStart}`);
        console.log(`   Line before func: "${lineBeforeFunc}"`);
        console.log(`   Actual function start: ${actualFunctionStart}`);
        console.log(`   Brace end: ${braceEnd}`);
        console.log(
          `   Original: "${processed.substring(actualFunctionStart, Math.min(actualFunctionStart + 150, braceEnd + 1))}"`
        );
        console.log(`   Replacement: "${replacement}"`);

        // 안전성 체크
        if (actualFunctionStart < 0 || actualFunctionStart > funcIndex) {
          console.log(
            `   ⚠️ Invalid function start detected, using func index instead`
          );
          actualFunctionStart = funcIndex;
        }
      }

      // 안전성 체크
      if (actualFunctionStart < 0 || actualFunctionStart > funcIndex) {
        actualFunctionStart = funcIndex;
      }

      // 교체 수행
      processed =
        processed.substring(0, actualFunctionStart) +
        replacement +
        processed.substring(braceEnd + 1);

      // 처리된 범위 기록
      processedRanges.push({
        start: actualFunctionStart,
        end: actualFunctionStart + replacement.length,
      });

      // 다음 검색 위치 조정
      searchStart = actualFunctionStart + replacement.length;

      break; // 한 번 처리하면 다음 함수로
    }
  }

  if (debug && processedRanges.length > 0) {
    console.log(
      `🎉 Processing complete. Made ${processedRanges.length} replacements.`
    );
  }

  return processed;
}

/**
 * 성능 측정 헬퍼
 */
function measurePerformance<T>(fn: () => T): PerformanceResult<T> {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // 나노초를 밀리초로

  return { result, duration };
}

/**
 * 디버깅 및 분석
 */
function analyzeProcessing(
  original: string,
  processed: string,
  filename: string,
  duration: number
): ProcessingAnalysis {
  const hasTargetFunctions = TARGET_FUNCTIONS.some((func) =>
    original.includes(func)
  );
  const hasChanges = original !== processed;
  const reduction = original.length - processed.length;

  return {
    filename,
    hasTargetFunctions,
    hasChanges,
    duration: Math.round(duration * 100) / 100, // 소수점 2자리
    originalLength: original.length,
    processedLength: processed.length,
    reduction,
    reductionPercent:
      original.length > 0
        ? Math.round((reduction / original.length) * 10000) / 100
        : 0,
  };
}

/**
 * 로깅 함수
 */
function logProcessingDetails(
  analysis: ProcessingAnalysis,
  options: LoaderOptions
): void {
  if (!options.debug) return;

  const {
    filename,
    hasTargetFunctions,
    hasChanges,
    duration,
    reduction,
    reductionPercent,
  } = analysis;

  console.log(
    `⚡ Fast Processing: ${filename.split("/").pop()} (${duration}ms)`
  );

  if (hasTargetFunctions) {
    if (hasChanges) {
      console.log(`   ✅ Processed successfully`);
      console.log(`   📊 Reduced by ${reduction} chars (${reductionPercent}%)`);
    } else {
      console.log(`   ⚠️  No changes made`);
    }
  }
}

/**
 * 웹팩 로더 메인 함수
 */
function loader(
  this: LoaderContext<LoaderOptions>,
  source: string,
  map?: any
): void {
  const options: LoaderOptions = this.getOptions() || {};

  // 파일 필터링
  if (options.include && !options.include.test(this.resourcePath)) {
    this.callback(null, source, map);
    return;
  }

  if (options.exclude && options.exclude.test(this.resourcePath)) {
    this.callback(null, source, map);
    return;
  }

  // 빠른 사전 검사 (성능 최적화)
  const hasAnyTargetFunction = TARGET_FUNCTIONS.some((func) =>
    source.includes(func)
  );
  if (!hasAnyTargetFunction) {
    this.callback(null, source, map);
    return;
  }

  // 성능 측정과 함께 처리
  const { result: processedSource, duration } = measurePerformance(() =>
    processServerSideProps(source, options.debug || false)
  );

  // 분석 및 로깅
  const analysis = analyzeProcessing(
    source,
    processedSource,
    this.resourcePath,
    duration
  );
  logProcessingDetails(analysis, options);

  // 성능 임계값 경고 (옵션)
  if (
    options.performanceWarning &&
    duration > (options.performanceThreshold || 10)
  ) {
    console.warn(
      `⚠️ Slow processing detected: ${this.resourcePath} took ${duration}ms`
    );
  }

  this.callback(null, processedSource, map);
}

// 로더 함수 내보내기
export default loader;
