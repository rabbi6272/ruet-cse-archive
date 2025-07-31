// Test the C++ code organization
const testCppCode = '#include <iostream> int main() { std::cout << "Hello, world!" << std::endl; return 0; }';

// Helper function to organize and format code snippets for better readability
function organizeCodeSnippet(code, language = '') {
  try {
    // Remove excessive whitespace and normalize line endings
    let organizedCode = code
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle old Mac line endings
      .trim();

    // Auto-detect language if not provided
    if (!language) {
      if (organizedCode.includes('#include') && (organizedCode.includes('std::') || organizedCode.includes('main()'))) {
        language = 'cpp';
      } else if (organizedCode.includes('def ') || organizedCode.includes('import ') || organizedCode.includes('print(')) {
        language = 'python';
      } else if (organizedCode.includes('function ') || organizedCode.includes('const ') || organizedCode.includes('console.log')) {
        language = 'javascript';
      }
    }

    // Language-specific formatting
    switch (language.toLowerCase()) {
      case 'c':
      case 'cpp':
      case 'c++':
        organizedCode = organizeC(organizedCode);
        break;
      default:
        // Generic formatting for unknown languages
        organizedCode = organizeGeneric(organizedCode);
    }

    return organizedCode;
  } catch (error) {
    console.error('Error organizing code snippet:', error);
    return code; // Return original if formatting fails
  }
}

// C/C++ specific formatting
function organizeC(code) {
  // Handle single-line code that needs to be expanded
  if (!code.includes('\n') && code.includes('#include') && code.includes('main()')) {
    // This is likely a compressed single-line C++ program
    code = code
      .replace(/#include\s*<([^>]+)>/g, '#include <$1>\n')
      .replace(/#include\s*"([^"]+)"/g, '#include "$1"\n')
      .replace(/int\s+main\s*\(\s*\)\s*{/g, '\nint main() {\n    ')
      .replace(/;\s*([^}])/g, ';\n    $1')
      .replace(/return\s+0;\s*}/g, 'return 0;\n}')
      .replace(/std::cout\s*<<\s*/g, 'std::cout << ')
      .replace(/\s*<<\s*std::endl/g, ' << std::endl');
  }
  
  return code
    // Fix spacing around operators
    .replace(/([^=!<>])=([^=])/g, '$1 = $2')
    .replace(/([^=!<>])==([^=])/g, '$1 == $2')
    .replace(/([^!])!=([^=])/g, '$1 != $2')
    // Fix bracket spacing
    .replace(/\s*\{\s*/g, ' {\n    ')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*([^}])/g, ';\n    $1')
    // Fix include statements
    .replace(/^#include\s*<([^>]+)>/gm, '#include <$1>')
    .replace(/^#include\s*"([^"]+)"/gm, '#include "$1"')
    // Proper function declarations
    .replace(/int\s+main\s*\(\s*\)/g, 'int main()')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Add proper indentation
      if (line.startsWith('#') || line.startsWith('int main') || line === '}') {
        return line;
      } else if (line.includes('return')) {
        return '    ' + line;
      } else {
        return '    ' + line;
      }
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

// Generic formatting for unknown languages
function organizeGeneric(code) {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

console.log('Original code:');
console.log(testCppCode);
console.log('\nFormatted code:');
console.log(organizeCodeSnippet(testCppCode));
