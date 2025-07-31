// Test the improved C++ code organization
const testCppCode = '#include int main() { for (int i = 0; i < 10; i++) { std::cout << "Iteration: " << i << std::endl; } return 0; }';

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
      if (organizedCode.includes('#include') || organizedCode.includes('std::') || organizedCode.includes('main()') || 
          organizedCode.includes('cout') || organizedCode.includes('endl') || organizedCode.includes('int main')) {
        language = 'cpp';
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
  // Fix common issues first
  let processedCode = code
    // Fix missing iostream include
    .replace(/^#include\s+int\s+main/g, '#include <iostream>\n\nint main')
    .replace(/^#include([^<"])/g, '#include <iostream>$1')
    // Handle malformed includes
    .replace(/#include\s*([^<"\s])/g, '#include <iostream>')
    .trim();
  
  // Handle single-line compressed code
  if (!processedCode.includes('\n') && processedCode.includes('main()')) {
    // Add iostream if missing
    if (!processedCode.includes('#include')) {
      processedCode = '#include <iostream>\n\n' + processedCode;
    }
    
    // This is likely a compressed single-line C++ program
    processedCode = processedCode
      // Fix includes first
      .replace(/#include\s*<([^>]+)>/g, '#include <$1>\n')
      .replace(/#include\s*"([^"]+)"/g, '#include "$1"\n')
      // Add double newline after includes
      .replace(/(\#include[^\n]*\n)/g, '$1')
      // Format main function
      .replace(/int\s+main\s*\(\s*\)\s*{/g, '\nint main() {\n')
      // Format for loops
      .replace(/for\s*\(\s*([^)]+)\s*\)\s*{/g, '    for ($1) {\n')
      // Format while loops  
      .replace(/while\s*\(\s*([^)]+)\s*\)\s*{/g, '    while ($1) {\n')
      // Format if statements
      .replace(/if\s*\(\s*([^)]+)\s*\)\s*{/g, '    if ($1) {\n')
      // Handle statements with semicolons (but not the last one before })
      .replace(/;\s*([^}])/g, ';\n        $1')
      // Handle closing braces for loops/conditions
      .replace(/}\s*([^}])/g, '    }\n    $1')
      // Handle final return and closing brace
      .replace(/return\s+([^;]+);\s*}/g, '    return $1;\n}')
      // Clean up std::cout formatting
      .replace(/std::cout\s*<<\s*/g, 'std::cout << ')
      .replace(/\s*<<\s*std::endl/g, ' << std::endl')
      .replace(/\s*<<\s*/g, ' << ');
  }
  
  // General formatting improvements
  return processedCode
    // Fix spacing around operators
    .replace(/([^=!<>])=([^=])/g, '$1 = $2')
    .replace(/([^=!<>])==([^=])/g, '$1 == $2')
    .replace(/([^!])!=([^=])/g, '$1 != $2')
    .replace(/([^<>])<=([^=])/g, '$1 <= $2')
    .replace(/([^<>])>=([^=])/g, '$1 >= $2')
    .replace(/([^<>])<([^<=])/g, '$1 < $2')
    .replace(/([^<>])>([^>=])/g, '$1 > $2')
    // Fix increment/decrement operators
    .replace(/([a-zA-Z_]\w*)\s*\+\+/g, '$1++')
    .replace(/([a-zA-Z_]\w*)\s*--/g, '$1--')
    // Ensure proper include format
    .replace(/^#include\s*<([^>]+)>/gm, '#include <$1>')
    .replace(/^#include\s*"([^"]+)"/gm, '#include "$1"')
    // Clean up and format the result
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, index, array) => {
      // Add proper indentation based on content
      if (line.startsWith('#include')) {
        return line;
      } else if (line.startsWith('int main') || line === '}') {
        return line;
      } else if (line.includes('for (') || line.includes('while (') || line.includes('if (')) {
        return '    ' + line;
      } else if (line === '}' && index > 0) {
        // Check if this is a closing brace for a loop/condition
        const prevLine = array[index - 1];
        if (prevLine && (prevLine.includes('std::cout') || prevLine.includes('return'))) {
          return '    }';
        }
        return line;
      } else {
        return '        ' + line; // Statements inside loops/conditions
      }
    })
    .join('\n')
    // Add spacing after includes
    .replace(/(#include[^\n]*\n)([^#\n])/g, '$1\n$2')
    // Clean up excessive newlines
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

// Generic formatting
function organizeGeneric(code) {
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

console.log('Original problematic code:');
console.log(testCppCode);
console.log('\n=================================');
console.log('Formatted code:');
console.log(organizeCodeSnippet(testCppCode));
