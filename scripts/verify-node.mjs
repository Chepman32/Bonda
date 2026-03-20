const requiredVersion = [20, 19, 4];

const version = process.versions.node;
const currentVersion = version.split('.').slice(0, 3).map(Number);

function compareVersions(left, right) {
  for (let index = 0; index < right.length; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];

    if (Number.isNaN(leftPart) || Number.isNaN(rightPart)) {
      return Number.NaN;
    }

    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

if (compareVersions(currentVersion, requiredVersion) < 0) {
  console.error(
    `Bonda requires Node ${requiredVersion.join('.')} or newer. Current version: ${version}`,
  );
  process.exit(1);
}

console.log(`Node version OK: ${version}`);
