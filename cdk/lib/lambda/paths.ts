import * as path from 'path';
import { LambdaPaths } from './types';

export const getPaths = (): LambdaPaths => {
  const projectRoot = path.resolve(__dirname, '../../../api');
  const lambdaRoot = path.resolve(projectRoot, 'src/lambda');
  const depsLockFile = path.resolve(projectRoot, 'package-lock.json');

  return {
    lambdaRoot,
    projectRoot,
    depsLockFile,
  };
};
