import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WafRegionalStack } from '../lib/infrastructure/waf.stack';

describe('WAF Stack', () => {
  test('WAF', () => {
    const app = new cdk.App();
    const stack = new WafRegionalStack(app, 'WAF', {});

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::WAFv2::WebACL', {});
  });
});
