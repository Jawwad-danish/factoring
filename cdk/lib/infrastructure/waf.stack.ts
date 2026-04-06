import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

type listOfRules = {
  name: string;
  priority: number;
  overrideAction: string;
  excludedRules: string[];
  ruleActionOverrides?: wafv2.CfnWebACL.RuleActionOverrideProperty[];
  managedRuleGroupConfigs?: wafv2.CfnWebACL.ManagedRuleGroupConfigProperty[];
};

export class WafRegionalStack extends cdk.Stack {
  /**
   * Take in list of rules
   * Create output for use in WAF config
   */
  protected makeRules(listOfRules: listOfRules[] = []) {
    const rules: wafv2.CfnRuleGroup.RuleProperty[] = [];

    for (const r of listOfRules) {
      const stateProp: wafv2.CfnWebACL.StatementProperty = {
        managedRuleGroupStatement: {
          name: r['name'],
          vendorName: 'AWS',
          ruleActionOverrides: r['ruleActionOverrides'],
          managedRuleGroupConfigs: r['managedRuleGroupConfigs'],
        },
      };
      const overrideAction: wafv2.CfnWebACL.OverrideActionProperty =
        r['overrideAction'] === 'count'
          ? {
              count: {},
            }
          : {
              none: {},
            };

      const rule: wafv2.CfnRuleGroup.RuleProperty = {
        name: r['name'],
        priority: r['priority'],
        // @ts-expect-error Property 'overrideAction' does not exist on type 'CfnRuleGroup.RuleProperty'
        overrideAction: overrideAction,
        statement: stateProp,
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: r['name'],
        },
      };
      rules.push(rule);
    }

    // Allowed country list - not using it for now
    // const ruleGeoMatch: wafv2.CfnWebACL.RuleProperty = {
    //   name: 'GeoMatch',
    //   priority: 0,
    //   action: {
    //     block: {}, // To disable, change to *count*
    //   },
    //   statement: {
    //     notStatement: {
    //       statement: {
    //         geoMatchStatement: {
    //           // Block connection if source not in the below country list
    //           countryCodes: [
    //             'AR', // Argentina
    //             'BO', // Bolivia
    //             'BR', // Brazil
    //             'CL', // Chile
    //             'CO', // Colombia
    //             'EC', // Ecuador
    //             'FK', // Falkland Islands
    //             'GF', // French Guiana
    //             'GY', // Guiana
    //             'GY', // Guyana
    //             'PY', // Paraguay
    //             'PE', // Peru
    //             'SR', // Suriname
    //             'UY', // Uruguay
    //             'VE', // Venezuela
    //           ],
    //         },
    //       },
    //     },
    //   },
    //   visibilityConfig: {
    //     sampledRequestsEnabled: true,
    //     cloudWatchMetricsEnabled: true,
    //     metricName: 'GeoMatch',
    //   },
    // }; // GeoMatch
    // rules.push(ruleGeoMatch);

    /**
     * The rate limit is the maximum number of requests from a
     * single IP address that are allowed in a five-minute period.
     * This value is continually evaluated,
     * and requests will be blocked once this limit is reached.
     * The IP address is automatically unblocked after it falls below the limit.
     */
    const ruleLimitRequests300: wafv2.CfnWebACL.RuleProperty = {
      name: 'LimitRequests300',
      priority: 2,
      action: {
        block: {}, // To disable, change to *count*
      },
      statement: {
        rateBasedStatement: {
          limit: 3000, //  1 requests per second
          aggregateKeyType: 'IP',
        },
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'LimitRequests300',
      },
    }; // limit requests to 300
    rules.push(ruleLimitRequests300);

    const ruleMultipartFormData: wafv2.CfnWebACL.RuleProperty = {
      name: 'MultipartFormData',
      priority: 1,
      action: {
        allow: {}, // To disable, change to *count*
      },
      statement: {
        byteMatchStatement: {
          fieldToMatch: {
            singleHeader: {
              name: 'content-type',
            },
          },
          searchString: 'multipart/form-data',
          positionalConstraint: 'CONTAINS',
          textTransformations: [{ priority: 0, type: 'NONE' }],
        },
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'MultipartFormData',
      },
    }; // allow multipart/form-data
    rules.push(ruleMultipartFormData);

    // block the request when the request body exceeds 8KB (tagged by SizeRestrictions_BODY)
    // except on specified URI pattern where the request is blocked if the payload exceeds 1MB
    const ruleBlockLargerPayloadsExceptWhitelistedURI: wafv2.CfnWebACL.RuleProperty =
      {
        name: 'BlockLargerPayloadsExceptWhitelistedURI',
        priority: 15,
        action: {
          block: {},
        },
        statement: {
          andStatement: {
            statements: [
              // this label is set by the SizeRestrictions_BODY rule configured with a count action
              {
                labelMatchStatement: {
                  scope: 'LABEL',
                  key: 'awswaf:managed:aws:core-rule-set:SizeRestrictions_Body',
                },
              },
              {
                orStatement: {
                  statements: [
                    {
                      andStatement: {
                        statements: [
                          {
                            notStatement: {
                              statement: {
                                byteMatchStatement: {
                                  searchString: '/clients',
                                  fieldToMatch: {
                                    uriPath: {},
                                  },
                                  textTransformations: [
                                    {
                                      priority: 0,
                                      type: 'NONE',
                                    },
                                  ],
                                  positionalConstraint: 'STARTS_WITH',
                                },
                              },
                            },
                          },
                          {
                            notStatement: {
                              statement: {
                                byteMatchStatement: {
                                  searchString: '/v1/transfers/',
                                  fieldToMatch: {
                                    uriPath: {},
                                  },
                                  textTransformations: [
                                    {
                                      priority: 0,
                                      type: 'NONE',
                                    },
                                  ],
                                  positionalConstraint: 'STARTS_WITH',
                                },
                              },
                            },
                          },
                          {
                            notStatement: {
                              statement: {
                                byteMatchStatement: {
                                  searchString: '/webhooks/',
                                  fieldToMatch: {
                                    uriPath: {},
                                  },
                                  textTransformations: [
                                    {
                                      priority: 0,
                                      type: 'NONE',
                                    },
                                  ],
                                  positionalConstraint: 'STARTS_WITH',
                                },
                              },
                            },
                          },
                          {
                            notStatement: {
                              statement: {
                                regexMatchStatement: {
                                  regexString: '^/invoices/?$',
                                  fieldToMatch: {
                                    uriPath: {},
                                  },
                                  textTransformations: [
                                    {
                                      priority: 0,
                                      type: 'NONE',
                                    },
                                  ],
                                },
                              },
                            },
                          },
                          {
                            notStatement: {
                              statement: {
                                regexMatchStatement: {
                                  regexString:
                                    '^/invoices/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/?$',
                                  fieldToMatch: {
                                    uriPath: {},
                                  },
                                  textTransformations: [
                                    {
                                      priority: 0,
                                      type: 'NONE',
                                    },
                                  ],
                                },
                              },
                            },
                          },
                          {
                            notStatement: {
                              statement: {
                                regexMatchStatement: {
                                  regexString: '^/peruse/.+$',
                                  fieldToMatch: {
                                    uriPath: {},
                                  },
                                  textTransformations: [
                                    {
                                      priority: 0,
                                      type: 'NONE',
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      sizeConstraintStatement: {
                        fieldToMatch: {
                          body: {
                            oversizeHandling: 'CONTINUE',
                          },
                        },
                        comparisonOperator: 'GE',
                        size: 1_000_000, // bytes
                        textTransformations: [
                          {
                            priority: 0,
                            type: 'NONE',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: 'BlockLargerPayloadsExceptWhitelistedURI',
        },
      };

    rules.push(ruleBlockLargerPayloadsExceptWhitelistedURI);

    return rules;
  } // function makeRules

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    /**
     * List available Managed Rule Groups using AWS CLI
     * aws wafv2 list-available-managed-rule-groups --scope REGIONAL
     */
    const managedRules: listOfRules[] = [
      {
        name: 'AWSManagedRulesCommonRuleSet',
        priority: 10,
        overrideAction: 'none',
        excludedRules: [],
        ruleActionOverrides: [
          // SizeRestrictions_BODY blocks request bodies that are larger than 8KB
          // As some endpoints expect a larger payload we need to override the default block action with a count action
          // https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html
          {
            name: 'SizeRestrictions_BODY',
            actionToUse: {
              count: {},
            },
          },
        ],
      },
      {
        name: 'AWSManagedRulesAmazonIpReputationList',
        priority: 20,
        overrideAction: 'none',
        excludedRules: [],
      },
      {
        name: 'AWSManagedRulesKnownBadInputsRuleSet',
        priority: 30,
        overrideAction: 'none',
        excludedRules: [],
      },
      // disable this for now as is blocking Pakistan IP's
      // {
      //   name: 'AWSManagedRulesAnonymousIpList',
      //   priority: 40,
      //   overrideAction: 'none',
      //   excludedRules: [],
      // },
      {
        name: 'AWSManagedRulesLinuxRuleSet',
        priority: 50,
        overrideAction: 'none',
        excludedRules: [],
      },
      {
        name: 'AWSManagedRulesUnixRuleSet',
        priority: 60,
        overrideAction: 'none',
        excludedRules: [],
      },
      {
        name: 'AWSManagedRulesBotControlRuleSet',
        priority: 70,
        overrideAction: 'count',
        excludedRules: [],
        managedRuleGroupConfigs: [
          {
            awsManagedRulesBotControlRuleSet: {
              inspectionLevel: 'COMMON',
            },
          },
        ],
      },
    ];

    // WAF - Regional, for use in Load Balancers

    const wafAclRegional = new wafv2.CfnWebACL(this, 'WafRegional', {
      defaultAction: { allow: {} },
      /**
       * The scope of this Web ACL.
       * Valid options: CLOUDFRONT, REGIONAL.
       * For CLOUDFRONT, you must create your WAFv2 resources
       * in the US East (N. Virginia) Region, us-east-1
       */
      scope: 'REGIONAL',
      // Defines and enables Amazon CloudWatch metrics and web request sample collection.
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `waf-regional`,
        sampledRequestsEnabled: true,
      },
      description: `WAFv2 ACL for Regional`,
      name: `waf-regional`,
      rules: this.makeRules(managedRules),
    }); // wafv2.CfnWebACL

    cdk.Tags.of(wafAclRegional).add('Name', `waf-Regional`, { priority: 300 });
    cdk.Tags.of(wafAclRegional).add('Purpose', 'WAF Regional', {
      priority: 300,
    });
    cdk.Tags.of(wafAclRegional).add('CreatedBy', 'CloudFormation', {
      priority: 300,
    });

    // to use the outputa with an ALB
    // wafAclAppSyncArn = cdk.Fn.importValue("WAF:wafAclRegionalArn");
    // new wafv2.CfnWebACLAssociation(this, 'AlbWaf', {
    //   resourceArn: alb.arn,
    //   webAclArn:   wafAclAppSyncArn
    // });
    new cdk.CfnOutput(this, 'wafAclRegionalArn', {
      value: wafAclRegional.attrArn,
      description: 'WAF Regional arn',
      exportName: 'WAF:wafAclRegionalArn',
    });
  } // constructor
} // class
