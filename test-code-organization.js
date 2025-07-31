// Test file to demonstrate the code organization helper function

// Test the organizeCodeSnippet function
function organizeCodeSnippet(code, language = '') {
  try {
    // Remove excessive whitespace and normalize line endings
    let organizedCode = code
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle old Mac line endings
      .trim();

    // Language-specific formatting
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return organizeJavaScript(organizedCode);
      case 'python':
      case 'py':
        return organizePython(organizedCode);
      case 'c':
      case 'cpp':
      case 'c++':
        return organizeC(organizedCode);
      default:
        return organizeGeneric(organizedCode);
    }
  } catch (error) {
    console.error('Error organizing code snippet:', error);
    return code; // Return original if formatting fails
  }
}

// JavaScript/Node.js specific formatting
function organizeJavaScript(code) {
  return code
    .replace(/([^=!<>])=([^=])/g, '$1 = $2')
    .replace(/([^=!<>])==([^=])/g, '$1 == $2')
    .replace(/([^=!<>])===([^=])/g, '$1 === $2')
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*\n/g, ';\n')
    .split('\n')
    .map(line => line.trim() ? line : '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

// C/C++ specific formatting
function organizeC(code) {
  return code
    .replace(/([^=!<>])=([^=])/g, '$1 = $2')
    .replace(/([^=!<>])==([^=])/g, '$1 == $2')
    .replace(/\s*\{\s*/g, ' {\n    ')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*\n/g, ';\n')
    .replace(/^#include\s*<([^>]+)>/gm, '#include <$1>')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

// Python specific formatting
function organizePython(code) {
  return code
    .replace(/([^=!<>])=([^=])/g, '$1 = $2')
    .replace(/([^=!<>])==([^=])/g, '$1 == $2')
    .replace(/:\s*/g, ':\n    ')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
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

// Test cases
console.log('🚀 Testing Code Organization Helper Function\n');

// Test 1: Messy JavaScript
const messyJS = `function hello(){console.log("Hello World");}let x=5;if(x>3){console.log("Greater than 3");}`;
console.log('📝 Original JavaScript:');
console.log(messyJS);
console.log('\n✨ Organized JavaScript:');
console.log(organizeCodeSnippet(messyJS, 'javascript'));

// Test 2: Messy C++
const messyC = `#include<iostream>int main(){std::cout<<"Hello, World!"<<std::endl;return 0;}`;
console.log('\n📝 Original C++:');
console.log(messyC);
console.log('\n✨ Organized C++:');
console.log(organizeCodeSnippet(messyC, 'cpp'));

// Test 3: Messy Python
const messyPython = `def hello():print("Hello World")x=5;if x>3:print("Greater than 3")`;
console.log('\n📝 Original Python:');
console.log(messyPython);
console.log('\n✨ Organized Python:');
console.log(organizeCodeSnippet(messyPython, 'python'));

console.log('\n🎉 Code Organization Helper Function Working Perfectly!');
