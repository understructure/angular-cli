import { getGlobalVariable } from '../../utils/env';
import { appendToFile, expectFileToMatch } from '../../utils/fs';
import { ng, silentNpm } from '../../utils/process';
import { updateJsonFile } from '../../utils/project';

const snapshots = require('../../ng-snapshot/package.json');

export default async function () {
  await appendToFile('src/app/app.component.html', '<router-outlet></router-outlet>');
  await ng('generate', 'appShell', '--client-project', 'test-project');

  const isSnapshotBuild = getGlobalVariable('argv')['ng-snapshots'];
  if (isSnapshotBuild) {
    await updateJsonFile('package.json', (packageJson) => {
      const dependencies = packageJson['dependencies'];
      // Iterate over all of the packages to update them to the snapshot version.
      for (const [name, version] of Object.entries(snapshots.dependencies)) {
        if (name in dependencies) {
          dependencies[name] = version;
        }
      }
    });

    await silentNpm('install');
  }

  await ng('run', 'test-project:app-shell');
  await expectFileToMatch('dist/test-project/browser/index.html', /app-shell works!/);

  await ng('run', 'test-project:app-shell:production');
  await expectFileToMatch('dist/test-project/browser/index.html', /app-shell works!/);
}
