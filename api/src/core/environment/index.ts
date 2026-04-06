import * as core from './core.envars';
import * as aws from './aws.envars';
import * as lambda from './lambda';
import * as environments from './environments';
import * as util from './util';

export const environment = {
  aws,
  lambda,
  core,
  util,
  ...environments,
};
