const fs = require('fs');
const path = require('path');

function editFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) {
    console.log(`[skip] Missing: ${filePath}`);
    return;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  for (const transform of transforms) {
    content = transform(content);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patched] ${filePath}`);
  } else {
    console.log(`[ok] ${filePath}`);
  }
}

function addCxxSharedInBlock(content, marker) {
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) return content;

  const blockStart = content.lastIndexOf('target_link_libraries(', markerIndex);
  if (blockStart === -1) return content;

  const closeIndex = content.indexOf('\n)', markerIndex);
  if (closeIndex === -1) return content;

  const block = content.slice(blockStart, closeIndex + 2);
  if (block.includes('c++_shared')) return content;

  return content.slice(0, closeIndex) + '\n  c++_shared' + content.slice(closeIndex);
}

const root = process.cwd();

const safeAreaCmake = path.join(
  root,
  'node_modules',
  'react-native-safe-area-context',
  'android',
  'src',
  'main',
  'jni',
  'CMakeLists.txt'
);

const screensCodegenCmake = path.join(
  root,
  'node_modules',
  'react-native-screens',
  'android',
  'src',
  'main',
  'jni',
  'CMakeLists.txt'
);

const screensMainCmake = path.join(
  root,
  'node_modules',
  'react-native-screens',
  'android',
  'CMakeLists.txt'
);

editFile(safeAreaCmake, [
  (c) => addCxxSharedInBlock(c, 'reactnative'),
  (c) => addCxxSharedInBlock(c, 'yoga'),
]);

editFile(screensCodegenCmake, [
  (c) => addCxxSharedInBlock(c, 'fbjni::fbjni'),
]);

editFile(screensMainCmake, [
  (c) => addCxxSharedInBlock(c, 'android\n    )'),
  (c) => {
    const elseMarker = 'else()\n    target_link_libraries(rnscreens\n        ReactAndroid::jsi\n        android';
    const idx = c.indexOf(elseMarker);
    if (idx === -1) return c;
    const close = c.indexOf('\n    )', idx);
    if (close === -1) return c;
    const block = c.slice(idx, close + 6);
    if (block.includes('c++_shared')) return c;
    return c.slice(0, close) + '\n        c++_shared' + c.slice(close);
  },
]);

console.log('Native fix script completed.');
